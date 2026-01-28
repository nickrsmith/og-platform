import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
  InjectQueue,
} from '@nestjs/bullmq';
import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  IpfsPersistenceJobResult,
  IpfsJobPayload,
  IpfsJobType,
  ReconcilieReleaseRequestDto,
  getTypedIpfsJobPayload,
  PinReleaseFilesPayload,
  PinOrganizationLogoPayload,
  PaginatedIpfsPinsDto,
  IpfsPinStatus,
} from '@app/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { PrismaService } from '@app/database';
import { ReleasesService } from '../releases/releases.service';

@QueueEventsListener('ipfs-pinning')
export class IpfsEventsProcessor extends QueueEventsHost {
  private readonly logger = new Logger(IpfsEventsProcessor.name);
  private readonly lensManagerUrl: string | null;
  private readonly indexerApiUrl: string | null;
  private readonly processedJobIds = new Set<string>(); // Track processed jobs to avoid duplicates
  private readonly missingOrganizations = new Set<string>(); // Track organizations that don't exist to avoid repeated warnings

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @InjectQueue('ipfs-pinning')
    private readonly pinningQueue: Queue<
      IpfsJobPayload,
      IpfsPersistenceJobResult
    >,
    private readonly releasesService: ReleasesService,
  ) {
    super();
    this.lensManagerUrl = this.configService.get<string>('LENS_MANAGER_URL') || null;
    this.indexerApiUrl = this.configService.get<string>('INDEXER_API_URL') || null;
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. IPFS event processing will be disabled.');
    }
    if (!this.lensManagerUrl) {
      this.logger.warn('Lens Manager URL not configured. IPFS event processing will be disabled.');
    }
  }

  onApplicationBootstrap() {
    this.logger.log(
      `[IpfsEventsProcessor] Application bootstrapped. Event listener is active for queue: ipfs-pinning`,
    );
    // Start periodic check for completed logo jobs (workaround if events don't fire)
    this.startPeriodicLogoCheck();
  }

  /**
   * Periodic check for completed organization logo jobs
   * This is a workaround in case the QueueEventsListener doesn't receive events
   */
  private startPeriodicLogoCheck() {
    this.logger.log(
      `[PeriodicCheck] Starting periodic check for completed logo jobs (every 30 seconds)`,
    );

    setInterval(() => {
      void (async () => {
        try {
          // Query indexer-api for all logo pins and check which ones need reconciliation
          // This is more reliable than getCompleted() which might not return jobs
          if (!this.indexerApiUrl) {
            this.logger.debug('Indexer API URL not configured. Skipping periodic logo check.');
            return;
          }
          
          try {
            const url = `${this.indexerApiUrl}/ipfs/pins`;
            const response = await firstValueFrom(
              this.httpService.get<PaginatedIpfsPinsDto>(url, {
                params: {
                  filterType: 'ORGANIZATION_LOGO',
                  pageSize: 100, // Get all logo pins
                },
              }),
            );

            const allLogoPins = response.data.data;
            const pinnedLogos = allLogoPins.filter(
              (p) => p.status === IpfsPinStatus.PINNED && p.cid,
            );

            // Check each PINNED logo to see if database needs updating
            for (const pinRecord of pinnedLogos) {
              // For organization logos, releaseId contains the organizationId
              const organizationId = pinRecord.releaseId;

              // Skip if we've already processed this pin record
              if (this.processedJobIds.has(pinRecord.id)) {
                continue;
              }

              // Skip if we already know this organization doesn't exist
              if (this.missingOrganizations.has(organizationId)) {
                // Mark as processed silently
                this.processedJobIds.add(pinRecord.id);
                continue;
              }

              // Check if organization already has logoImage
              const org = await this.prisma.organization.findUnique({
                where: { id: organizationId },
                select: { logoImage: true },
              });

              // Skip if organization doesn't exist
              if (!org) {
                // Only log warning once per organization
                if (!this.missingOrganizations.has(organizationId)) {
                  this.logger.warn(
                    `[PeriodicCheck] Organization ${organizationId} not found. Skipping all logo updates for this organization.`,
                  );
                  this.missingOrganizations.add(organizationId);
                }
                // Mark as processed to avoid repeated warnings
                this.processedJobIds.add(pinRecord.id);
                continue;
              }

              // If logoImage is null but we have a PINNED record with CID, update it
              if (!org.logoImage && pinRecord.cid) {
                this.logger.log(
                  `[PeriodicCheck] Updating organization ${organizationId} with logo CID: ${pinRecord.cid}`,
                );

                try {
                  // Directly update the database (same logic as handlePinLogoComplete)
                  await this.prisma.organization.update({
                    where: { id: organizationId },
                    data: { logoImage: pinRecord.cid },
                  });

                  this.logger.log(
                    `[PeriodicCheck] Successfully updated organization ${organizationId} with logo CID: ${pinRecord.cid}`,
                  );

                  // Mark as processed
                  this.processedJobIds.add(pinRecord.id);
                } catch (updateError) {
                  this.logger.error(
                    `[PeriodicCheck] Failed to update organization ${organizationId} with logo CID ${pinRecord.cid}`,
                    updateError,
                  );
                }
              } else if (org.logoImage) {
                // Already has logoImage - verify it matches the pin record CID
                if (org.logoImage !== pinRecord.cid) {
                  this.logger.warn(
                    `[PeriodicCheck] Organization ${organizationId} has logoImage ${org.logoImage} but pin record has CID ${pinRecord.cid}. Updating to match pin record.`,
                  );
                  try {
                    await this.prisma.organization.update({
                      where: { id: organizationId },
                      data: { logoImage: pinRecord.cid },
                    });
                    this.logger.log(
                      `[PeriodicCheck] Updated organization ${organizationId} logoImage from ${org.logoImage} to ${pinRecord.cid}`,
                    );
                  } catch (updateError) {
                    this.logger.error(
                      `[PeriodicCheck] Failed to update organization ${organizationId} logoImage`,
                      updateError,
                    );
                  }
                }
                // Mark as processed
                this.processedJobIds.add(pinRecord.id);
              }
            }
          } catch (indexerError) {
            this.logger.error(
              `[PeriodicCheck] Error querying indexer-api: ${indexerError instanceof Error ? indexerError.message : String(indexerError)}`,
            );
          }
        } catch (error) {
          // Log errors in periodic check for debugging
          this.logger.error(
            `[PeriodicCheck] Error checking for completed jobs: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      })();
    }, 30000); // Check every 30 seconds
  }

  @OnQueueEvent('completed')
  async onCompleted({ jobId }: { jobId: string }) {
    // Avoid processing the same job twice
    if (this.processedJobIds.has(jobId)) {
      return;
    }

    this.logger.log(`[onCompleted] Processing completed job ${jobId}`);

    const job = await this.pinningQueue.getJob(jobId);
    if (!job) {
      this.logger.error(
        `[onCompleted] Could not find job with ID ${jobId}. Cannot reconcile.`,
      );
      return;
    }

    try {
      const jobName = job.name as IpfsJobType;

      if (jobName === IpfsJobType.PIN_RELEASE_FILES) {
        const payload = getTypedIpfsJobPayload<PinReleaseFilesPayload>(
          jobName,
          job.data,
        );
        this.logger.log(
          `[onCompleted] Processing PIN_RELEASE_FILES for release: ${payload.releaseId}`,
        );
        await this.handlePinFileComplete(payload);
      } else if (jobName === IpfsJobType.PIN_ORGANIZATION_LOGO) {
        const payload = getTypedIpfsJobPayload<PinOrganizationLogoPayload>(
          jobName,
          job.data,
        );
        this.logger.log(
          `[onCompleted] Processing PIN_ORGANIZATION_LOGO for organization: ${payload.organizationId}`,
        );
        await this.handlePinLogoComplete(payload);
      } else {
        this.logger.warn(
          `[onCompleted] Job ${job.id} has unhandled name: ${job.name}`,
        );
      }

      // Mark job as processed
      this.processedJobIds.add(jobId);
    } catch (error) {
      const errorDetails = error instanceof Error ? error.stack : String(error);

      // Distinguish between user-facing validation errors and system failures
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        // These are expected validation errors that don't require manual intervention
        // The user needs to complete organization setup (e.g., wait for contract creation)
        this.logger.warn(
          `[onCompleted] Reconciliation skipped for job ${job.id} due to validation error: ${error instanceof Error ? error.message : String(error)}. This is expected if organization setup is incomplete.`,
        );
        // Mark as processed since retrying won't help until the underlying issue is resolved
        this.processedJobIds.add(jobId);
      } else {
        // System failures that may require manual intervention
        this.logger.error(
          `[onCompleted] Reconciliation FAILED for job ${job.id}. This requires manual intervention.`,
          errorDetails,
        );
        // Don't mark as processed if it failed - allow retry
      }
    }
  }

  private async handlePinFileComplete(
    payload: PinReleaseFilesPayload,
  ): Promise<void> {
    const { releaseId, siteAddress } = payload;
    this.logger.log(`Reconciling completed IPFS job for release ${releaseId}.`);

    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Cannot reconcile IPFS job.');
      return;
    }

    // Step 1: Fetch the final, consolidated state from the indexer's source of truth.
    const url = `${this.indexerApiUrl}/ipfs/pins`;

    const { data: paginatedPins } = await firstValueFrom(
      this.httpService
        .get<PaginatedIpfsPinsDto>(url, {
          params: {
            filterReleaseId: releaseId,
            pageSize: 100, // Fetch all pins for the release
          },
        })
        .pipe(
          catchError((err: AxiosError) => {
            this.logger.error(
              `CRITICAL: Failed to fetch pin records from indexer-api for release ${releaseId}. Reconciliation cannot continue.`,
              err.response?.data,
            );
            throw new InternalServerErrorException(
              'Failed to retrieve file processing status.',
            );
          }),
        ),
    );
    const allPins = paginatedPins.data;
    // Step 2: Find the critical records for content and manifest.
    const contentRecord = allPins.find((p) => p.type === 'CONTENT');
    const manifestRecord = allPins.find((p) => p.type === 'MANIFEST');

    // Step 3: Validate that all necessary data is present.
    if (!contentRecord || !contentRecord.cid || !contentRecord.assetHash) {
      const missing = [
        !contentRecord && 'content record',
        contentRecord && !contentRecord.cid && 'content CID',
        contentRecord && !contentRecord.assetHash && 'assetHash',
      ]
        .filter(Boolean)
        .join(', ');

      throw new Error(
        `Cannot proceed with on-chain creation: The following data for release ${releaseId} is missing from the indexer: ${missing}.`,
      );
    }

    this.logger.log(
      `Step 1: Reconciling final CIDs for release ${releaseId} via lens-manager.`,
    );

    // Prepare the PATCH payload for the lens-manager
    const p2pPatchPayload: ReconcilieReleaseRequestDto = {
      contentCID: contentRecord.cid,
      thumbnailCID: manifestRecord?.cid ?? undefined,
    };

    // Make the single, authoritative update call to the P2P layer owner.
    if (!this.lensManagerUrl) {
      this.logger.warn('Lens Manager URL not configured. Cannot update P2P record.');
      return;
    }
    
    await firstValueFrom(
      this.httpService
        .patch(
          `${this.lensManagerUrl}/sites/${siteAddress}/releases/${releaseId}`,
          p2pPatchPayload,
        )
        .pipe(
          catchError((err: AxiosError) => {
            this.logger.error(
              `CRITICAL: Failed to patch lens-manager for release ${releaseId}. On-chain creation will be blocked.`,
              err.response?.data,
            );
            // Re-throwing is crucial to ensure the job fails and can be retried.
            throw new InternalServerErrorException(
              'Failed to update P2P record.',
            );
          }),
        ),
    );

    this.logger.log(
      `Step 2: P2P record update sent. Proceeding to on-chain creation.`,
    );
    // Step 4: Construct the result object for the next service.
    const ipfsResult: Omit<IpfsPersistenceJobResult, 'providerName'> = {
      contentCID: contentRecord.cid,
      thumbnailManifestCID: manifestRecord?.cid ?? undefined, // This can be null if there are no thumbnails.
      assetHash: contentRecord.assetHash,
    };

    // Step 5: Initiate the next step in the pipeline: on-chain asset creation.
    this.logger.log(
      `All required CIDs and hashes found for release ${releaseId}. Proceeding to on-chain creation.`,
    );
    await this.releasesService.initiateAssetOnChainCreation(
      payload,
      ipfsResult,
    );
  }

  private async handlePinLogoComplete(
    payload: PinOrganizationLogoPayload,
  ): Promise<void> {
    const { organizationId, pinRecordId } = payload;

    // Fetch the completed pin record from the indexer to get the final CID
    // Note: For organization logos, the releaseId field stores the organizationId
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Cannot fetch logo pin record.');
      return;
    }
    
    const url = `${this.indexerApiUrl}/ipfs/pins`;
    let paginatedPins: PaginatedIpfsPinsDto;
    try {
      const response = await firstValueFrom(
        this.httpService.get<PaginatedIpfsPinsDto>(url, {
          params: {
            filterReleaseId: organizationId, // organizationId is stored in releaseId field
            filterType: 'ORGANIZATION_LOGO',
            pageSize: 100, // Get all pins for this org (should be just one)
          },
        }),
      );
      paginatedPins = response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch pin record for organization ${organizationId} from indexer-api during logo reconciliation`,
        error,
      );
      throw new InternalServerErrorException(
        `Could not fetch pin record for organization ${organizationId} from indexer-api.`,
      );
    }

    // Find the pin record by ID (in case there are multiple)
    const pinRecord = paginatedPins.data.find((p) => p.id === pinRecordId);
    if (!pinRecord || !pinRecord.cid) {
      this.logger.error(
        `Pin record ${pinRecordId} not found or missing CID. Found ${paginatedPins.data.length} record(s). Available records: ${JSON.stringify(paginatedPins.data.map((p) => ({ id: p.id, cid: p.cid, status: p.status })))}`,
      );
      throw new InternalServerErrorException(
        `Could not find completed pin record or CID for pinId ${pinRecordId} during logo reconciliation.`,
      );
    }

    const { cid: contentCID } = pinRecord;

    try {
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: { logoImage: contentCID },
      });

      this.logger.log(
        `Successfully updated organization ${organizationId} with logo CID: ${contentCID}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update organization ${organizationId} with logo CID ${contentCID}`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to update organization logo in database.`,
      );
    }
  }

  @OnQueueEvent('failed')
  onFailed({ jobId }: { jobId: string }, error: Error) {
    if (jobId) {
      this.logger.error(
        `Job ${jobId} failed with error: ${error.message}`,
        error.stack,
      );
    } else {
      this.logger.error(
        `A job failed with error: ${error.message}`,
        error.stack,
      );
    }
  }
}
