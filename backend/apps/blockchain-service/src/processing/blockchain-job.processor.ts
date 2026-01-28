import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { EventPublisherService } from './event-publisher.service';
import {
  BlockchainJobStatus,
  ChainEventType,
  ChainTransactionStatus,
  CreateOrgContractPayload,
  getTypedPayload,
  GrantAssetManagerRolePayload,
  RevokeAssetManagerRolePayload,
  VerifyAssetPayload,
  FundUserWalletPayload,
  CreateAssetPayload,
  LicenseAssetPayload,
  WithdrawOrgEarningsPayload,
  StoragePool,
  AssetType,
  AssetCategory,
  ProductionStatus,
} from '@app/common';
import { EthersJSProvider } from './ethersjs.provider';
import { ContractAddressManager } from './contract-address.manager';
import { ethers, Interface, TransactionResponse } from 'ethers';
import {
  EmpressaAssetRegistryAbi,
  EmpressaContractFactoryUpgradeableAbi,
} from '@app/common/abis';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Processor('blockchain-jobs')
export class BlockchainJobProcessor extends WorkerHost {
  private readonly logger = new Logger(BlockchainJobProcessor.name);
  private readonly kmsServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ethersProvider: EthersJSProvider,
    private readonly addressManager: ContractAddressManager,
    private readonly eventPublisher: EventPublisherService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.kmsServiceUrl = this.configService.getOrThrow('KMS_SERVICE_URL');
  }

  /**
   * Map TypeScript AssetType enum to Solidity enum index
   * Solidity enum: Lease, WorkingInterest, Mineral, Override
   */
  private mapAssetType(assetType?: AssetType): number {
    if (!assetType) return 0; // Default to Lease
    switch (assetType) {
      case AssetType.Lease:
        return 0;
      case AssetType.WorkingInterest:
        return 1;
      case AssetType.Mineral:
        return 2;
      case AssetType.Override:
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Map TypeScript AssetCategory enum to Solidity enum index
   * Solidity enum: A, B, C
   */
  private mapAssetCategory(category?: AssetCategory): number {
    if (!category) return 0; // Default to A
    switch (category) {
      case AssetCategory.A:
        return 0;
      case AssetCategory.B:
        return 1;
      case AssetCategory.C:
        return 2;
      default:
        return 0;
    }
  }

  /**
   * Map TypeScript ProductionStatus enum to Solidity enum index
   * Solidity enum: Active, Pending, Available, Drilling, Producing, Idle, Expired
   */
  private mapProductionStatus(status?: ProductionStatus): number {
    if (!status) return 0; // Default to Active
    switch (status) {
      case ProductionStatus.Active:
        return 0;
      case ProductionStatus.Pending:
        return 1;
      case ProductionStatus.Available:
        return 2;
      case ProductionStatus.Drilling:
        return 3;
      case ProductionStatus.Producing:
        return 4;
      case ProductionStatus.Idle:
        return 5;
      case ProductionStatus.Expired:
        return 6;
      default:
        return 0;
    }
  }

  async process(job: Job<{ jobId: string }>): Promise<void> {
    const { jobId } = job.data;
    this.logger.log(`Processing job ${jobId}...`);

    const dbJob = await this.prisma.blockchainJob.findUnique({
      where: { id: jobId },
    });

    if (!dbJob) {
      this.logger.error(`Job ${jobId} not found in database. Skipping.`);
      return;
    }

    try {
      await this.prisma.blockchainJob.update({
        where: { id: jobId },
        data: { status: BlockchainJobStatus.SUBMITTED },
      });

      let txResponse: ethers.TransactionResponse;
      let receipt: ethers.TransactionReceipt | null;
      const eventType = dbJob.eventType as ChainEventType;
      const eventOutput: Record<string, unknown> = {};

      switch (eventType) {
        case ChainEventType.CREATE_ORG_CONTRACT: {
          const payload = getTypedPayload<CreateOrgContractPayload>(
            eventType,
            dbJob.payloadJson,
          );
          this.logger.log(
            `Executing CREATE_ORG_CONTRACT for org ${payload.organizationId}`,
          );

          // --- STEP 1: Create the Org Contract using the ADMIN WALLET ---
          const factoryContract = this.ethersProvider.getContract(
            'EmpressaContractFactoryUpgradeable',
            this.addressManager.getFactoryAddress(),
          );
          const integrationPartner = ethers.ZeroAddress;

          const createTx = (await factoryContract.createOrgContract(
            payload.principalWalletAddress,
            integrationPartner,
          )) as ethers.TransactionResponse;

          const createReceipt = await createTx.wait();
          if (!createReceipt || createReceipt.status === 0) {
            throw new Error(
              `Transaction to create org contract reverted. Hash: ${createTx.hash}`,
            );
          }
          this.logger.log(
            `Org contract created successfully. Tx: ${createTx.hash}`,
          );

          // --- STEP 2: Parse the new contract address from the logs ---
          const factoryInterface = new Interface(
            EmpressaContractFactoryUpgradeableAbi,
          );
          const createdEventLog = createReceipt.logs.find((log) => {
            try {
              return (
                factoryInterface.parseLog(log)?.name === 'OrgContractCreated'
              );
            } catch {
              return false;
            }
          });

          let newOrgContractAddress: string;
          if (createdEventLog) {
            const parsedLog = factoryInterface.parseLog(createdEventLog);
            newOrgContractAddress = parsedLog?.args.orgContract as string;
            eventOutput.contractAddress = newOrgContractAddress;
            this.logger.log(
              `Parsed new org contract address: ${newOrgContractAddress}`,
            );
          } else {
            throw new Error(
              'Could not find ContractCreated event in transaction logs.',
            );
          }

          // --- STEP 3: Grant the VERIFIER_ROLE using the PRINCIPAL'S WALLET ---
          if (
            payload.platformVerifierWalletAddress &&
            payload.platformVerifierWalletAddress !== ethers.ZeroAddress
          ) {
            this.logger.log(
              `Fetching Principal's private key for user ${payload.principalUserId}`,
            );

            // Step 3.1: Get the Principal's private key from KMS
            const { data: keyData } = await firstValueFrom(
              this.httpService.get<{ privateKey: string }>(
                `${this.kmsServiceUrl}/wallets/users/${payload.principalUserId}/private-key`,
              ),
            );
            const principalPrivateKey = keyData.privateKey;
            if (!principalPrivateKey) {
              // This is a critical failure. The job should fail and retry.
              throw new Error(
                `Failed to retrieve private key for Principal user ${payload.principalUserId}`,
              );
            }

            // Step 3.2: Get a contract instance signed by the PRINCIPAL
            const orgContractAsPrincipal =
              this.ethersProvider.getContractForUser(
                'EmpressaOrgContract',
                newOrgContractAddress,
                principalPrivateKey, // Use the Principal's key
              );

            this.logger.log(
              `Granting VERIFIER_ROLE to ${payload.platformVerifierWalletAddress} using Principal's wallet.`,
            );

            // Step 3.3: Call addCreator. The msg.sender is now the Principal.
            const grantRoleTx = (await orgContractAsPrincipal.addCreator(
              payload.platformVerifierWalletAddress,
            )) as TransactionResponse;
            const grantRoleReceipt = await grantRoleTx.wait();

            if (!grantRoleReceipt || grantRoleReceipt.status === 0) {
              this.logger.error(
                `CRITICAL: Failed to grant verifier role for new org ${newOrgContractAddress}. Tx: ${grantRoleTx.hash}. Manual intervention may be required.`,
              );
              // We won't throw an error here, as the primary org creation was successful.
            } else {
              this.logger.log(
                `Successfully granted verifier role for new org ${newOrgContractAddress}. Tx: ${grantRoleTx.hash}`,
              );
            }
          }

          // The final receipt for the event bus is from the primary action (contract creation)
          receipt = createReceipt;
          break;
        }
        case ChainEventType.CREATE_ASSET: {
          const payload = getTypedPayload<CreateAssetPayload>(
            eventType,
            dbJob.payloadJson,
          );
          this.logger.log(
            `Executing CREATE_ASSET for release ${payload.releaseId}`,
          );

          const kmsUrl = `${this.kmsServiceUrl}/wallets/users/${payload.userId}/private-key`;
          this.logger.log(
            `Fetching user private key from KMS at: ${kmsUrl} for user ID: ${payload.userId}`,
          );

          const { data: keyData } = await firstValueFrom(
            this.httpService.get<{ privateKey: string }>(kmsUrl),
          );
          const userPrivateKey = keyData.privateKey;
          if (!userPrivateKey) {
            throw new Error(
              `Failed to retrieve private key for user ${payload.userId}`,
            );
          }

          const org = await this.prisma.organization.findFirstOrThrow({
            where: { siteAddress: payload.siteAddress },
            select: { contractAddress: true },
          });

          if (!org.contractAddress) {
            throw new Error(
              `Org at site ${payload.siteAddress} has no contract address.`,
            );
          }

          const orgContract = this.ethersProvider.getContractForUser(
            'EmpressaOrgContract',
            org.contractAddress,
            userPrivateKey,
          );

          let fxPoolIndex: number;
          switch (payload.fxPool) {
            case StoragePool.VDAS:
              fxPoolIndex = 0;
              break;
            case StoragePool.PII:
              fxPoolIndex = 1;
              break;
            case StoragePool.DT:
              fxPoolIndex = 2;
              break;
            default:
              throw new Error(`Unsupported fxPool type`);
          }
          // Map O&G enum values to Solidity enum indices
          const assetTypeIndex = this.mapAssetType(payload.assetType);
          const categoryIndex = this.mapAssetCategory(payload.category);
          const productionStatusIndex = this.mapProductionStatus(
            payload.productionStatus,
          );

          txResponse = (await orgContract.createAsset(
            payload.assetCID,
            payload.metadataHash,
            payload.assetHash,
            payload.price,
            payload.isEncrypted,
            payload.canBeLicensed,
            fxPoolIndex,
            payload.timeStamp,
            [], // geoRestrictions
            assetTypeIndex,
            categoryIndex,
            productionStatusIndex,
            payload.basin || '',
            payload.acreage || 0,
            payload.state || '',
            payload.county || '',
            payload.location || '',
            payload.projectedROI || 0,
          )) as ethers.TransactionResponse;

          this.logger.log(
            `CREATE_ASSET transaction submitted. Hash: ${txResponse.hash}`,
          );
          receipt = await txResponse.wait();
          if (!receipt || receipt.status === 0) {
            throw new Error(
              `Transaction to create asset reverted. Hash: ${txResponse.hash}`,
            );
          }

          // Step 1: Create an interface for the AssetRegistry contract ABI.
          const registryInterface = new Interface(EmpressaAssetRegistryAbi);

          // Step 2: Find the correct event log from the transaction receipt.
          // The `AssetRegistered` event is emitted by the AssetRegistry, not the OrgContract.
          const assetRegisteredEventTopic =
            registryInterface.getEvent('AssetRegistered')?.topicHash;

          if (!assetRegisteredEventTopic) {
            throw new Error('Asset Registered Topic not found');
          }
          const createdEventLog = receipt.logs.find(
            (log) => log.topics[0] === assetRegisteredEventTopic,
          );

          if (createdEventLog) {
            const parsedLog = registryInterface.parseLog(createdEventLog);
            if (parsedLog) {
              const assetId = (parsedLog.args['assetId'] as number).toString();
              // The event signature is:
              // event AssetRegistered(address indexed orgContract, uint256 indexed assetId, address indexed creator, bytes32 assetHash);
              eventOutput.onChainAssetId = assetId;
              this.logger.log(
                `Successfully parsed on-chain assetId: ${assetId}`,
              );
            } else {
              throw new Error('Failed to parse AssetRegistered event log.');
            }
          } else {
            throw new Error(
              'Could not find AssetRegistered event in transaction logs.',
            );
          }
          break;
        }
        case ChainEventType.LICENSE_ASSET: {
          const payload = getTypedPayload<LicenseAssetPayload>(
            eventType,
            dbJob.payloadJson,
          );
          this.logger.log(
            `Executing LICENSE_ASSET for on-chain ID ${payload.onChainAssetId} by user ${payload.userId}`,
          );

          // Step 1: Get buyer's private key
          const { data: keyData } = await firstValueFrom(
            this.httpService.get<{ privateKey: string }>(
              `${this.kmsServiceUrl}/wallets/users/${payload.userId}/private-key`,
            ),
          );
          const buyerPrivateKey = keyData.privateKey;
          if (!buyerPrivateKey) {
            throw new Error(
              `Failed to retrieve private key for buyer ${payload.userId}`,
            );
          }

          // Step 2: Get org's contract address
          const org = await this.prisma.organization.findFirstOrThrow({
            where: { siteAddress: payload.siteAddress },
            select: { contractAddress: true },
          });
          if (!org.contractAddress) {
            throw new Error(
              `Org at site ${payload.siteAddress} has no contract address.`,
            );
          }

          // Step 3: Set up wallet and contracts
          const buyerWallet = new ethers.Wallet(
            buyerPrivateKey,
            this.ethersProvider.getAdminWallet().provider,
          );

          const usdcContract = this.ethersProvider.getContract(
            'MockUSDC',
            this.addressManager.getUsdcAddress(),
            buyerWallet,
          );

          const orgContract = this.ethersProvider.getContract(
            'EmpressaOrgContract',
            org.contractAddress,
            buyerWallet,
          );

          const licenseManagerAddress =
            (await orgContract.licenseManager()) as string;

          // Step 4: Fetch the initial nonce for the buyer's wallet
          let nonce = await buyerWallet.getNonce();
          this.logger.log(
            `Initial nonce for buyer wallet ${buyerWallet.address}: ${nonce}`,
          );

          // Step 5: Check current allowance and approve if necessary
          const currentAllowance = (await usdcContract.allowance(
            buyerWallet.address,
            licenseManagerAddress,
          )) as bigint;
          const requiredPrice = BigInt(payload.price);

          this.logger.log(
            `Required price: ${requiredPrice.toString()}, Current allowance: ${currentAllowance.toString()}`,
          );

          if (currentAllowance < requiredPrice) {
            this.logger.log(
              `Allowance is insufficient. Sending 'approve' transaction with nonce ${nonce}...`,
            );

            const approveTx = (await usdcContract.approve(
              licenseManagerAddress,
              requiredPrice, // Approve only the exact amount needed
              { nonce: nonce },
            )) as TransactionResponse;

            const approveReceipt = await approveTx.wait();
            if (!approveReceipt || approveReceipt.status === 0) {
              throw new Error(
                `USDC approval failed for license purchase. Tx: ${approveTx.hash}`,
              );
            }
            this.logger.log(
              `USDC approval successful with nonce ${nonce}. Tx: ${approveTx.hash}`,
            );

            // Manually increment the nonce for the next transaction
            nonce++;
          } else {
            this.logger.log(
              'Sufficient allowance already exists. Skipping approve transaction.',
            );
          }

          // Step 6: Call the licenseAsset function with the correct (potentially incremented) nonce
          this.logger.log(`Calling 'licenseAsset' with nonce ${nonce}...`);
          txResponse = (await orgContract.licenseAsset(
            payload.onChainAssetId,
            payload.permissions,
            payload.resellerFee,
            { nonce: nonce }, // Use the correct nonce
          )) as ethers.TransactionResponse;

          receipt = await txResponse.wait();
          if (!receipt || receipt.status === 0) {
            throw new Error(
              `Transaction to license asset reverted. Hash: ${txResponse.hash}`,
            );
          }
          break;
        }
        case ChainEventType.FUND_USER_WALLET: {
          const payload = getTypedPayload<FundUserWalletPayload>(
            eventType,
            dbJob.payloadJson,
          );
          this.logger.log(
            `Executing FUND_USER_WALLET for address ${payload.recipientAddress}`,
          );

          const faucetWallet = this.ethersProvider.getFaucetWallet();

          // 1. Get the current transaction count from the network.
          let nonce = await faucetWallet.getNonce();
          this.logger.log(`Initial nonce for faucet wallet: ${nonce}`);

          // 2. Send native currency for gas, explicitly setting the nonce.
          const nativeAmount = this.configService.get<string>(
            'FAUCET_NATIVE_AMOUNT',
            '1000000000000000000',
          );
          const nativeTx = await faucetWallet.sendTransaction({
            to: payload.recipientAddress,
            value: nativeAmount,
            nonce: nonce, // Use the fetched nonce
          });
          this.logger.log(
            `Sent ${nativeAmount} native currency with nonce ${nonce}. Tx: ${nativeTx.hash}`,
          );
          await nativeTx.wait(); // Wait for confirmation

          // 3. Manually increment the nonce for the next transaction.
          nonce++;

          // 4. Send MockUSDC
          const usdcAmount = this.configService.get<string>(
            'FAUCET_USDC_AMOUNT',
            '1000000000',
          );
          const usdcContractAddress = this.addressManager.getUsdcAddress();
          const usdcContract = this.ethersProvider.getContract(
            'MockUSDC',
            usdcContractAddress,
            faucetWallet,
          );

          // 5. Send the USDC transfer, explicitly setting the incremented nonce.
          const usdcTx = (await usdcContract.transfer(
            payload.recipientAddress,
            usdcAmount,
            { nonce: nonce }, // Use the incremented nonce
          )) as TransactionResponse;

          this.logger.log(
            `Sent ${usdcAmount} MockUSDC with nonce ${nonce}. Tx: ${usdcTx.hash}`,
          );
          receipt = await usdcTx.wait();

          if (!receipt || receipt.status === 0) {
            throw new Error(
              `USDC transfer transaction reverted on-chain. Hash: ${usdcTx.hash}`,
            );
          }
          break;
        }
        case ChainEventType.WITHDRAW_ORG_EARNINGS: {
          const payload = getTypedPayload<WithdrawOrgEarningsPayload>(
            eventType,
            dbJob.payloadJson,
          );
          this.logger.log(
            `Executing WITHDRAW_ORG_EARNINGS for organization ${payload.organizationId}`,
          );

          // Step 1: Get the organization's contract address
          const org = await this.prisma.organization.findUniqueOrThrow({
            where: { id: payload.organizationId },
            select: { contractAddress: true },
          });
          if (!org.contractAddress) {
            throw new Error(
              `Organization ${payload.organizationId} does not have a contract address.`,
            );
          }

          // Step 2: Get the Principal's private key from KMS to sign the transaction
          const { data: keyData } = await firstValueFrom(
            this.httpService.get<{ privateKey: string }>(
              `${this.kmsServiceUrl}/wallets/users/${payload.principalUserId}/private-key`,
            ),
          );
          const principalPrivateKey = keyData.privateKey;
          if (!principalPrivateKey) {
            throw new Error(
              `Failed to retrieve private key for Principal ${payload.principalUserId}`,
            );
          }

          // Step 3: Get the RevenueDistributor address from the OrgContract
          const revenueDistributorAddress = (await this.ethersProvider
            .getContract('EmpressaOrgContract', org.contractAddress)
            .revenueDistributor()) as string;

          // Step 4: Create a contract instance signed by the Principal
          const revenueDistributorContract =
            this.ethersProvider.getContractForUser(
              'EmpressaRevenueDistributor',
              revenueDistributorAddress,
              principalPrivateKey,
            );

          // Step 5: Call the withdrawAllOrgEarnings function
          txResponse = (await revenueDistributorContract.withdrawAllOrgEarnings(
            org.contractAddress,
          )) as ethers.TransactionResponse;

          receipt = await txResponse.wait();
          if (!receipt || receipt.status === 0) {
            throw new Error(
              `Transaction to withdraw earnings reverted. Hash: ${txResponse.hash}`,
            );
          }
          break;
        }
        case ChainEventType.GRANT_CREATOR_ROLE: {
          const payload = getTypedPayload<GrantAssetManagerRolePayload>(
            eventType,
            dbJob.payloadJson,
          );
          this.logger.log(
            `Executing GRANT_CREATOR_ROLE (Asset Manager) for user wallet ${payload.userWalletAddress} in org ${payload.organizationId}`,
          );

          const org = await this.prisma.organization.findUniqueOrThrow({
            where: { id: payload.organizationId },
            select: { contractAddress: true },
          });

          if (!org.contractAddress) {
            throw new Error(
              `Organization ${payload.organizationId} does not have a contract address. Cannot grant role.`,
            );
          }

          const orgContract = this.ethersProvider.getContract(
            'EmpressaOrgContract',
            org.contractAddress,
          );

          txResponse = (await orgContract.addCreator(
            payload.userWalletAddress,
          )) as ethers.TransactionResponse;

          receipt = await txResponse.wait();
          if (!receipt || receipt.status === 0) {
            throw new Error(
              `Transaction to grant asset manager role reverted on-chain. Hash: ${txResponse.hash}`,
            );
          }
          break;
        }
        case ChainEventType.REVOKE_CREATOR_ROLE: {
          const payload = getTypedPayload<RevokeAssetManagerRolePayload>(
            eventType,
            dbJob.payloadJson,
          );
          this.logger.log(
            `Executing REVOKE_CREATOR_ROLE (Asset Manager) for user wallet ${payload.userWalletAddress} in org ${payload.organizationId}`,
          );

          const org = await this.prisma.organization.findUniqueOrThrow({
            where: { id: payload.organizationId },
            select: { contractAddress: true },
          });

          if (!org.contractAddress) {
            throw new Error(
              `Organization ${payload.organizationId} does not have a contract address. Cannot revoke role.`,
            );
          }

          const orgContract = this.ethersProvider.getContract(
            'EmpressaOrgContract',
            org.contractAddress,
          );

          txResponse = (await orgContract.removeCreator(
            payload.userWalletAddress,
          )) as ethers.TransactionResponse;

          receipt = await txResponse.wait();
          if (!receipt || receipt.status === 0) {
            throw new Error(
              `Transaction to revoke asset manager role reverted on-chain. Hash: ${txResponse.hash}`,
            );
          }
          break;
        }
        case ChainEventType.VERIFY_ASSET: {
          const payload = getTypedPayload<VerifyAssetPayload>(
            eventType,
            dbJob.payloadJson,
          );
          this.logger.log(
            `Executing VERIFY_ASSET for on-chain ID ${payload.onChainAssetId}`,
          );

          // Step 1: Fetch the platform verifier's private key from KMS
          const { data: keyData } = await firstValueFrom(
            this.httpService.get<{ privateKey: string }>(
              `${this.kmsServiceUrl}/wallets/platform/verifier-private-key`,
            ),
          );
          const verifierPrivateKey = keyData.privateKey;
          if (!verifierPrivateKey) {
            throw new Error(
              'Failed to retrieve platform verifier private key from KMS.',
            );
          }

          // Step 2: Get the organization's contract address from the database
          const org = await this.prisma.organization.findFirstOrThrow({
            where: { siteAddress: payload.siteAddress },
            select: { contractAddress: true },
          });

          if (!org.contractAddress) {
            throw new Error(
              `Org at site ${payload.siteAddress} has no contract address.`,
            );
          }

          // Step 3: Get a contract instance signed by the DEDICATED verifier wallet (CORRECTED)
          const orgContract = this.ethersProvider.getContractForUser(
            'EmpressaOrgContract',
            org.contractAddress,
            verifierPrivateKey,
          );

          // Step 4: Call the verifyAsset function. The msg.sender is now the verifier's address.
          txResponse = (await orgContract.verifyAsset(
            payload.onChainAssetId,
          )) as ethers.TransactionResponse;

          receipt = await txResponse.wait();
          if (!receipt || receipt.status === 0) {
            throw new Error(
              `Transaction to verify asset reverted on-chain. Hash: ${txResponse.hash}`,
            );
          }
          break;
        }
        default:
          throw new Error(`Unsupported event type: ${dbJob.eventType}`);
      }

      if (!receipt) {
        throw new Error('Transaction failed to be mined.');
      }

      const confirmedJob = await this.prisma.blockchainJob.update({
        where: { id: jobId },
        data: {
          status: BlockchainJobStatus.SUCCESS,
          finalizedAt: new Date(),
        },
      });

      const genericPayload = dbJob.payloadJson as { txId: string };

      this.eventPublisher.publishTransactionFinalized({
        txId: genericPayload.txId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber.toString(),
        finalStatus: ChainTransactionStatus.CONFIRMED,
        job: confirmedJob,
        eventOutput,
      });

      this.logger.log(
        `Job ${jobId} successfully confirmed and finalized with txHash: ${receipt.hash}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Job ${jobId} failed permanently: ${errorMessage}`);

      const failedJob = await this.prisma.blockchainJob.update({
        where: { id: jobId },
        data: {
          status: 'ERROR',
          errorMessage,
          finalizedAt: new Date(),
        },
      });
      const genericPayload = failedJob.payloadJson as { txId: string };

      this.eventPublisher.publishTransactionFinalized({
        txId: genericPayload.txId,
        txHash: 'unknown',
        blockNumber: 'unknown',
        finalStatus: ChainTransactionStatus.FAILED,
        job: failedJob,
        eventOutput: {},
      });
    }
  }
}
