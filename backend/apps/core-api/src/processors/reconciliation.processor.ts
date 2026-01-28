import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  ChainTransactionStatus,
  CreateActivityRequestDto,
  CreateSaleRequestDto,
  LicenseAssetPayload,
  type TransactionFinalizedEvent,
  UpdateChainTransactionRequestDto,
  ReconcilieReleaseRequestDto,
  VerificationStatus,
  VerifyAssetPayload,
  ChainEventType,
  CreateOrgContractPayload,
  getTypedPayload,
  CreateAssetPayload,
  GrantAssetManagerRolePayload,
  AssignRoleRequestDto,
} from '@app/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { PrismaService } from '@app/database';
import { ethers, Interface } from 'ethers';
import { EmpressaRevenueDistributorAbi } from '@app/common/abis';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class ReconciliationProcessor {
  private readonly logger = new Logger(ReconciliationProcessor.name);
  private readonly indexerApiUrl: string | null;
  private readonly lensManagerUrl: string | null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionsService,
  ) {
    this.indexerApiUrl = this.configService.get<string>('INDEXER_API_URL') || null;
    this.lensManagerUrl = this.configService.get<string>('LENS_MANAGER_URL') || null;
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Reconciliation operations will be disabled.');
    }
    if (!this.lensManagerUrl) {
      this.logger.warn('Lens Manager URL not configured. Reconciliation operations will be disabled.');
    }
  }

  @RabbitSubscribe({
    exchange: 'empressa.events.topic',
    routingKey: 'transactions.finalized.*',
    queue: 'core-api.reconciliation.queue',
  })
  public async handleTransactionFinalized(event: TransactionFinalizedEvent) {
    const {
      id,
      eventType,
      finalStatus,
      blockNumber,
      txHash,
      originalPayload,
      finalizedAt,
      eventOutput,
      error,
      jobId,
    } = event;
    this.logger.log(`Received transaction finalized event: ${id}`);

    // Step 1: Update the transaction record in the indexer
    if (
      eventType !== ChainEventType.FUND_USER_WALLET &&
      eventType !== ChainEventType.GRANT_CREATOR_ROLE &&
      eventType !== ChainEventType.REVOKE_CREATOR_ROLE
    ) {
      const txUpdatePayload: UpdateChainTransactionRequestDto = {
        status: finalStatus,
        blockNumber: blockNumber !== 'unknown' ? blockNumber : undefined,
        txHash,
        confirmedAt: finalizedAt,
      };
      if (!this.indexerApiUrl) {
        this.logger.warn('Indexer API URL not configured. Skipping transaction update.');
      } else {
        await firstValueFrom(
          this.httpService
            .patch(`${this.indexerApiUrl}/transactions/${id}`, txUpdatePayload)
            .pipe(
              catchError((err: AxiosError) => {
                this.logger.error(
                  `CRITICAL: Failed to re-index transaction record for ${id}. This may cause polling to fail.`,
                  err.response?.data,
                );
                throw err;
              }),
            ),
        );
      }
    }

    if (finalStatus !== ChainTransactionStatus.CONFIRMED) {
      const errorDetails = error
        ? ` Error: ${error}`
        : ' No error details available.';
      this.logger.error(
        `Transaction ${id} (jobId: ${jobId}, eventType: ${eventType}) did not confirm successfully (${finalStatus}). TxHash: ${txHash}.${errorDetails} No further reconciliation will occur.`,
      );
      return; // Acknowledge and stop processing
    }

    // Step 2: Perform event-specific reconciliation
    try {
      switch (eventType) {
        case ChainEventType.CREATE_ORG_CONTRACT: {
          const payload = getTypedPayload<CreateOrgContractPayload>(
            eventType,
            originalPayload,
          );
          const { organizationId } = payload;
          const contractAddress = eventOutput?.contractAddress as string;

          if (!contractAddress) {
            throw new Error(
              `Missing contractAddress in eventOutput for CREATE_ORG_CONTRACT job ${event.jobId}`,
            );
          }

          this.logger.log(
            `[Reconciliation] CREATE_ORG_CONTRACT event for org ${organizationId}. Saving address ${contractAddress} to DB.`,
          );

          await this.prisma.organization.update({
            where: { id: organizationId },
            data: { contractAddress },
          });

          this.logger.log(
            `[Reconciliation] Successfully updated organization ${organizationId} with its on-chain address.`,
          );
          break;
        }
        case ChainEventType.GRANT_CREATOR_ROLE: {
          const payload = getTypedPayload<GrantAssetManagerRolePayload>(
            eventType,
            originalPayload,
          );
          this.logger.log(
            `[Reconciliation] GRANT_CREATOR_ROLE confirmed for org ${payload.organizationId}. Granting Asset Manager P2P role.`,
          );

          // 1. Fetch the necessary info from the database
          const org = await this.prisma.organization.findUniqueOrThrow({
            where: { id: payload.organizationId },
            select: { siteAddress: true },
          });

          const user = await this.prisma.user.findFirstOrThrow({
            where: { wallet: { walletAddress: payload.userWalletAddress } },
            select: { p2pIdentity: true },
          });

          if (!org.siteAddress || !user.p2pIdentity) {
            throw new Error(
              `Missing siteAddress or P2P identity for org ${payload.organizationId}, user wallet ${payload.userWalletAddress}.`,
            );
          }

          // 2. Call the new endpoint on lens-manager
          if (!this.lensManagerUrl) {
            this.logger.warn('Lens Manager URL not configured. Skipping role assignment.');
          } else {
            const url = `${this.lensManagerUrl}/sites/${org.siteAddress}/role-assignments`;
            const dto: AssignRoleRequestDto = {
              p2pPublicKey: user.p2pIdentity.publicKey,
              roleId: 'member', // The 'member' role grants 'release:create' permission by default
            };

            await firstValueFrom(
              this.httpService.post(url, dto).pipe(
                catchError((err: AxiosError) => {
                  this.logger.error(
                    `[Reconciliation] Failed to grant P2P role for user on site ${org.siteAddress}`,
                    err.response?.data,
                  );
                  throw err; // Re-throw to let RabbitMQ handle retries
                }),
              ),
            );

            this.logger.log(
              `[Reconciliation] Successfully granted 'member' role on P2P site ${org.siteAddress}`,
            );
          }
          break;
        }
        case ChainEventType.CREATE_ASSET: {
          const payload = getTypedPayload<CreateAssetPayload>(
            eventType,
            originalPayload,
          );
          const { releaseId, siteAddress, actorPeerId } = payload;
          const onChainAssetId = event.eventOutput?.onChainAssetId as string;

          this.logger.log(
            `[Reconciliation] CREATE_ASSET event for release ${releaseId}. On-chain ID: ${onChainAssetId}`,
          );

          if (!onChainAssetId) {
            this.logger.error(
              `CRITICAL: Missing onChainAssetId in eventOutput for CREATE_ASSET job ${event.jobId}. Reconciliation cannot complete.`,
            );
            // Throw an error to ensure the message is requeued by RabbitMQ for a retry.
            throw new Error(
              `Missing onChainAssetId in eventOutput for job ${event.jobId}`,
            );
          }

          // Step 1: Persist the on-chain asset ID to the indexer database.
          // This is the crucial link for future actions like verification.
          // TODO: This in the future should call to lens manager and update the P2P record instead of the indexer-api directly.
          if (!this.indexerApiUrl) {
            this.logger.warn('Indexer API URL not configured. Skipping onChainAssetId update.');
            break;
          }
          
          const indexerReconcileUrl = `${this.indexerApiUrl}/releases/${releaseId}`;
          const indexerPatchPayload = { onChainAssetId };

          const indexerPatchPromise = firstValueFrom(
            this.httpService
              .patch(indexerReconcileUrl, indexerPatchPayload)
              .pipe(
                catchError((error: AxiosError) => {
                  this.logger.error(
                    `[Reconciliation] CRITICAL: Failed to save onChainAssetId to indexer for release ${releaseId}.`,
                    error.response?.data,
                  );
                  // Re-throw to trigger a retry.
                  throw error;
                }),
              ),
          );

          // Step 2: Log the 'UPLOADED' activity in the indexer.
          const activityPayload: CreateActivityRequestDto = {
            releaseId,
            siteAddress,
            type: 'UPLOADED',
            actorPeerId,
            txHash,
          };
          const indexerActivityPromise = this.indexerApiUrl ? firstValueFrom(
            this.httpService
              .post(`${this.indexerApiUrl}/activities`, activityPayload)
              .pipe(
                catchError((err: AxiosError) => {
                  this.logger.error(
                    `[Reconciliation] Failed to index UPLOADED activity for release ${releaseId}`,
                    err.response?.data,
                  );
                  // Re-throw to trigger a retry.
                  throw err;
                }),
              ),
          ) : Promise.resolve();

          // Await both promises in parallel to ensure both operations complete.
          await Promise.all([indexerPatchPromise, indexerActivityPromise]);

          this.logger.log(
            `[Reconciliation] Successfully saved onChainAssetId and logged activity for release ${releaseId}.`,
          );
          break;
        }
        case ChainEventType.VERIFY_ASSET: {
          const payload = getTypedPayload<VerifyAssetPayload>(
            eventType,
            originalPayload,
          );
          const { releaseId, siteAddress } = payload;

          this.logger.log(
            `[Reconciliation] VERIFY_ASSET event for release ${releaseId}. Patching status via lens-manager.`,
          );

          if (!this.lensManagerUrl) {
            this.logger.warn('Lens Manager URL not configured. Skipping verification status update.');
            break;
          }

          const url = `${this.lensManagerUrl}/sites/${siteAddress}/releases/${releaseId}`;
          const reconciliePayload: ReconcilieReleaseRequestDto = {
            verificationStatus: VerificationStatus.VERIFIED,
          };

          await firstValueFrom(
            this.httpService.patch(url, reconciliePayload).pipe(
              catchError((error: AxiosError) => {
                this.logger.error(
                  `[Reconciliation] Failed to send VERIFY_ASSET patch to lens-manager for release ${releaseId}.`,
                  error.response?.data,
                );
                throw error;
              }),
            ),
          );
          break;
        }
        case ChainEventType.LICENSE_ASSET: {
          const payload = getTypedPayload<LicenseAssetPayload>(
            eventType,
            originalPayload,
          );
          const { releaseId, siteAddress, buyerPeerId, creatorPeerId, price } =
            payload;

          this.logger.log(
            `[Reconciliation] LICENSE_ASSET event for release ${releaseId}. Indexing sale and activity.`,
          );

          // Step 1: Parse the RevenueDistributed event from the transaction logs to get the exact royalty amount.
          const revenueDistributorInterface = new Interface(
            EmpressaRevenueDistributorAbi,
          );
          const revenueEventTopic =
            revenueDistributorInterface.getEvent(
              'RevenueDistributed',
            )?.topicHash;
          if (!revenueEventTopic) {
            throw new Error('Could not find RevenueDistributed event topic.');
          }

          // We need the raw transaction receipt for this
          const rawReceipt =
            await this.transactionService.getRawTransactionReceipt(txHash);
          const revenueEventLog = rawReceipt.logs.find(
            (log) => log.topics[0] === revenueEventTopic,
          );

          let ownerAmount = 0n;
          if (revenueEventLog) {
            const parsedLog =
              revenueDistributorInterface.parseLog(revenueEventLog);
            if (parsedLog) {
              ownerAmount = parsedLog.args.ownerAmount as bigint;
              this.logger.log(
                `[Reconciliation] Successfully parsed ownerAmount from event log: ${ownerAmount.toString()}`,
              );
            }
          }

          if (ownerAmount === 0n) {
            // Fallback to a less accurate calculation if parsing fails
            ownerAmount = (BigInt(price) * 95400n) / 10000n; // 95% of gross
            this.logger.warn(
              `[Reconciliation] Could not parse ownerAmount from event logs for tx ${txHash}. Using fallback calculation. Fallback ownerAmount: ${ownerAmount.toString()}`,
            );
          }

          const priceDecimal = parseFloat(ethers.formatUnits(price, 6));
          const royaltyAmountDecimal = parseFloat(
            ethers.formatUnits(ownerAmount, 6),
          );
          const platformFeeDecimal = priceDecimal - royaltyAmountDecimal;

          // Step 2: Index the sale for analytics using the parsed amounts
          const salePayload: CreateSaleRequestDto = {
            releaseId,
            creatorPeerId,
            buyerPeerId,
            priceUSDC: priceDecimal,
            royaltyAmountUSDC: royaltyAmountDecimal,
            platformFeeUSDC: platformFeeDecimal,
            txHash,
          };

          if (!this.indexerApiUrl) {
            this.logger.warn('Indexer API URL not configured. Skipping sale indexing.');
            break;
          }
          
          const indexSalePromise = firstValueFrom(
            this.httpService
              .post(`${this.indexerApiUrl}/analytics/sales`, salePayload)
              .pipe(
                catchError((err: AxiosError) => {
                  this.logger.error(
                    `Failed to index SALE analytics for release ${releaseId}`,
                    err.response?.data,
                  );
                  throw err;
                }),
              ),
          );

          // Step 2: Log the 'LICENSED' activity in the indexer
          const activityPayload: CreateActivityRequestDto = {
            releaseId,
            siteAddress,
            type: 'LICENSED',
            actorPeerId: buyerPeerId,
            txHash,
          };
          const indexActivityPromise = this.indexerApiUrl ? firstValueFrom(
            this.httpService
              .post(`${this.indexerApiUrl}/activities`, activityPayload)
              .pipe(
                catchError((err: AxiosError) => {
                  this.logger.error(
                    `Failed to index LICENSE activity for release ${releaseId}`,
                    err.response?.data,
                  );
                  throw err;
                }),
              ),
          ) : Promise.resolve();

          await Promise.all([indexSalePromise, indexActivityPromise]);

          this.logger.log(
            `[Reconciliation] Successfully indexed sale and activity for release ${releaseId}.`,
          );
          break;
        }

        default:
          this.logger.warn(
            `Unhandled event type for reconciliation: ${eventType}`,
          );
      }
    } catch (error) {
      this.logger.error(
        `Reconciliation failed for transaction ${txHash}. The message will be requeued.`,
        error,
      );
      throw error;
    }
  }
}
