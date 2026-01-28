import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import type { Job } from 'bullmq';
import * as fs from 'fs/promises';
import {
  CreateIpfsPinsRequestDto,
  CreateIpfsPinsResponseDto,
  getTypedIpfsJobPayload,
  IpfsJobPayload,
  IpfsJobType,
  IpfsPersistenceJobResult,
  IpfsPinStatus,
  PinOrganizationLogoPayload,
  PinReleaseFilesPayload,
  UpdateIpfsPinRequestDto,
} from '@app/common';
import { PersistenceStrategy } from './ipfs-persistence-stragegy';
import { IPersistenceProvider } from './providers/persistence-provider.interface';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { v4 as uuid } from 'uuid';
import { tmpdir } from 'os';
import { join } from 'path';

@Injectable()
@Processor('ipfs-pinning', {
  concurrency: 5,
  lockDuration: 120 * 60 * 1000,
})
export class IpfsPersistenceProcessor extends WorkerHost {
  private readonly logger = new Logger(IpfsPersistenceProcessor.name);
  private readonly indexerApiUrl: string;

  constructor(
    private readonly persistenceStrategy: PersistenceStrategy,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.indexerApiUrl = this.configService.getOrThrow('INDEXER_API_URL');
    this.logger.log(
      `[IpfsPersistenceProcessor] Initialized with INDEXER_API_URL: ${this.indexerApiUrl}`,
    );
  }

  async process(
    job: Job<IpfsJobPayload>,
  ): Promise<IpfsPersistenceJobResult | void> {
    this.logger.log(
      `Processing new job on ipfs-pinning queue. Job ID: ${job.id}, Name: ${job.name}`,
    );

    const jobName = job.name as IpfsJobType;

    try {
      switch (jobName) {
        case IpfsJobType.PIN_RELEASE_FILES: {
          const payload = getTypedIpfsJobPayload<PinReleaseFilesPayload>(
            jobName,
            job.data,
          );
          if (job.attemptsMade > 0) {
            const allPinRecordIds = [
              payload.mainFile?.pinRecordId,
              ...(payload.thumbnailFiles?.map((f) => f.pinRecordId) || []),
            ].filter(Boolean) as string[];

            if (allPinRecordIds.length > 0) {
              this.logger.log(
                `This is a retry (attempt #${job.attemptsMade + 1}). Resetting status of ${allPinRecordIds.length} pin records to PINNING.`,
              );
              await Promise.all(
                allPinRecordIds.map((id) =>
                  this._updatePinRecord(id, { status: IpfsPinStatus.PINNING }),
                ),
              );
            }
          }
          await this.processReleaseFiles(payload);
          return;
        }

        case IpfsJobType.PIN_ORGANIZATION_LOGO: {
          const payload = getTypedIpfsJobPayload<PinOrganizationLogoPayload>(
            jobName,
            job.data,
          );

          // Update status to PINNING when job starts processing (if this is the first attempt)
          if (job.attemptsMade === 0) {
            try {
              await this._updatePinRecord(payload.pinRecordId, {
                status: IpfsPinStatus.PINNING,
              });
              this.logger.log(
                `[process] Updated pin record ${payload.pinRecordId} status to PINNING`,
              );
            } catch (error) {
              this.logger.warn(
                `[process] Failed to update pin record status to PINNING, continuing anyway`,
                error,
              );
            }
          }

          await this.processOrganizationLogo(payload);
          return;
        }

        default:
          this.logger.warn(`Job with name ${job.name} not handled.`);
          return;
      }
    } catch (error) {
      const errorDetails = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Job ${job.id}: An operation FAILED. This will trigger a retry.`,
        errorDetails,
      );
      throw error; // Re-throw to let BullMQ handle the retry.
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<IpfsJobPayload>) {
    this.logger.log(
      `Job ${job.id} has completed permanently. Cleaning up files.`,
    );
    await this.cleanupFiles(job);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<IpfsJobPayload>, _error: Error) {
    this.logger.warn(
      `Job ${job.id} has failed permanently after all retries. Cleaning up files.`,
    );
    await this.cleanupFiles(job);
  }

  private async cleanupFiles(job: Job<IpfsJobPayload>): Promise<void> {
    const filesToClean: string[] = [];
    const { name, data } = job;

    if ((name as IpfsJobType) === IpfsJobType.PIN_RELEASE_FILES) {
      const payload = data as PinReleaseFilesPayload;
      if (payload.mainFile) {
        filesToClean.push(payload.mainFile.tempFilePath);
      }
      if (payload.thumbnailFiles) {
        filesToClean.push(...payload.thumbnailFiles.map((f) => f.tempFilePath));
      }
    } else if ((name as IpfsJobType) === IpfsJobType.PIN_ORGANIZATION_LOGO) {
      const payload = data as PinOrganizationLogoPayload;
      if (payload.tempFilePath) filesToClean.push(payload.tempFilePath);
    }

    if (filesToClean.length > 0) {
      this.logger.log(
        `Cleaning up ${filesToClean.length} temporary file(s) for job ${job.id}.`,
      );
      await Promise.all(
        filesToClean.map((path) =>
          fs
            .unlink(path)
            .catch((err) =>
              this.logger.error(
                `Failed to delete temporary file: ${path}`,
                err,
              ),
            ),
        ),
      );
    }
  }

  private async processReleaseFiles(
    payload: PinReleaseFilesPayload,
  ): Promise<void> {
    const {
      mainFile,
      thumbnailFiles = [],
      existingThumbnailCIDs = [],
      organizationId,
      releaseId,
    } = payload;
    const provider = await this.persistenceStrategy.getPrimaryProvider();
    let anyFailure = false;

    // Process Main File
    if (mainFile) {
      try {
        const { cid, assetHash } = await provider.add(
          mainFile.tempFilePath,
          mainFile.originalName || 'asset',
        );

        await provider.pin(
          cid,
          `[org:${organizationId}] ${mainFile.originalName || 'asset'}`,
        );
        await this._updatePinRecord(mainFile.pinRecordId, {
          status: IpfsPinStatus.PINNED,
          cid: cid,
          assetHash: assetHash,
          provider: provider.name,
        });
        this.logger.log(
          `PIN successful for main file (record: ${mainFile.pinRecordId}): ${cid}`,
        );
      } catch (error) {
        anyFailure = true;
        this.logger.error(
          `Failed to process main file for pin record ${mainFile.pinRecordId}`,
          error,
        );
        await this._updatePinRecord(mainFile.pinRecordId, {
          status: IpfsPinStatus.FAILED,
          provider: provider.name,
        });
      }
    }

    // Process Thumbnails
    const newThumbnailCIDs: string[] = [];
    if (thumbnailFiles.length > 0) {
      for (const thumbFile of thumbnailFiles) {
        try {
          const { cid } = await provider.add(
            thumbFile.tempFilePath,
            `thumb-${thumbFile.originalName}-${releaseId}`,
          );
          newThumbnailCIDs.push(cid);
          await this._updatePinRecord(thumbFile.pinRecordId, {
            status: IpfsPinStatus.PINNED,
            cid,
            provider: provider.name,
          });
          this.logger.log(
            `PIN successful for thumbnail (record: ${thumbFile.pinRecordId}): ${cid}`,
          );
        } catch (error) {
          anyFailure = true;
          this.logger.error(
            `Failed to process thumbnail for pin record ${thumbFile.pinRecordId}`,
            error,
          );
          await this._updatePinRecord(thumbFile.pinRecordId, {
            status: IpfsPinStatus.FAILED,
            provider: provider.name,
          });
        }
      }
    }

    // Process Manifest (only if no files have failed so far)
    if (
      !anyFailure &&
      (newThumbnailCIDs.length > 0 || existingThumbnailCIDs.length > 0)
    ) {
      const finalThumbnailCIDs = [
        ...existingThumbnailCIDs,
        ...newThumbnailCIDs,
      ];
      let tempManifestPath: string | null = null;
      try {
        const manifest = { thumbnails: finalThumbnailCIDs };
        const manifestBuffer = Buffer.from(JSON.stringify(manifest));

        // Create a temporary file for the manifest
        tempManifestPath = join(
          tmpdir(),
          `manifest-${releaseId}-${uuid()}.json`,
        );
        await fs.writeFile(tempManifestPath, manifestBuffer);
        this.logger.log(`Wrote temporary manifest to: ${tempManifestPath}`);

        const { cid: thumbnailManifestCID } = await provider.add(
          tempManifestPath,
          `manifest-${releaseId}`,
        );

        await provider.pin(
          thumbnailManifestCID,
          `[org:${organizationId}] manifest-${releaseId}`,
        );
        await this._createManifestPinRecord(
          releaseId,
          thumbnailManifestCID,
          provider.name,
        );
        this.logger.log(
          `PIN successful for thumbnail manifest: ${thumbnailManifestCID}`,
        );
      } catch (error) {
        anyFailure = true;
        this.logger.error(
          `Failed to process and pin manifest for release ${releaseId}`,
          error,
        );
      } finally {
        // Ensure the temporary manifest file is always cleaned up
        if (tempManifestPath) {
          await fs
            .unlink(tempManifestPath)
            .catch((err) =>
              this.logger.warn(
                `Failed to clean up temporary manifest file: ${tempManifestPath}`,
                err,
              ),
            );
        }
      }
    }

    if (anyFailure) {
      throw new Error(
        `One or more files failed to process for release ${releaseId}. See logs for details.`,
      );
    }
  }

  private async processOrganizationLogo(
    payload: PinOrganizationLogoPayload,
  ): Promise<void> {
    const { tempFilePath, organizationId, originalName, pinRecordId } = payload;

    this.logger.log(
      `[processOrganizationLogo] Starting logo processing for org ${organizationId}, pinRecordId: ${pinRecordId}, tempFilePath: ${tempFilePath}`,
    );

    // Step 1: Verify the temp file exists
    try {
      await fs.access(tempFilePath);
      this.logger.log(
        `[processOrganizationLogo] Temp file exists: ${tempFilePath}`,
      );
    } catch (error) {
      this.logger.error(
        `[processOrganizationLogo] Temp file does not exist: ${tempFilePath}`,
        error,
      );
      try {
        await this._updatePinRecord(pinRecordId, {
          status: IpfsPinStatus.FAILED,
        });
      } catch (updateError) {
        this.logger.error(
          `[processOrganizationLogo] Failed to update pin record status to FAILED`,
          updateError,
        );
      }
      throw new Error(
        `Temp file does not exist: ${tempFilePath}. The file may have been deleted or the path is incorrect.`,
      );
    }

    // Step 2: Get the provider
    let provider: IPersistenceProvider;
    try {
      provider = await this.persistenceStrategy.getPrimaryProvider();
      this.logger.log(
        `[processOrganizationLogo] Using provider: ${provider.name}`,
      );
    } catch (error) {
      this.logger.error(
        `[processOrganizationLogo] Failed to get primary provider`,
        error,
      );
      try {
        await this._updatePinRecord(pinRecordId, {
          status: IpfsPinStatus.FAILED,
        });
      } catch (updateError) {
        this.logger.error(
          `[processOrganizationLogo] Failed to update pin record status to FAILED`,
          updateError,
        );
      }
      throw error;
    }

    // Step 3: Process the logo
    let success = false;
    try {
      this.logger.log(
        `[processOrganizationLogo] Adding file to IPFS: ${tempFilePath}`,
      );
      const { cid } = await provider.add(tempFilePath, originalName || 'logo');
      this.logger.log(
        `[processOrganizationLogo] File added to IPFS with CID: ${cid}`,
      );

      this.logger.log(`[processOrganizationLogo] Pinning CID: ${cid}`);
      await provider.pin(
        cid,
        `[org:${organizationId}] ${originalName || 'logo'}`,
      );
      this.logger.log(
        `[processOrganizationLogo] PIN successful for organization logo: ${cid}`,
      );

      this.logger.log(
        `[processOrganizationLogo] Updating pin record ${pinRecordId} to PINNED status`,
      );

      // Try to update the pin record, but don't fail the entire job if this fails
      // (e.g., due to network issues with indexer-api). The file is already pinned successfully.
      try {
        await this._updatePinRecord(pinRecordId, {
          status: IpfsPinStatus.PINNED,
          cid,
          provider: provider.name,
        });
        this.logger.log(
          `[processOrganizationLogo] Successfully updated pin record to PINNED`,
        );
      } catch (updateError) {
        // Log the error but don't fail the job - the file is already pinned
        const errorMessage =
          updateError instanceof Error
            ? updateError.message
            : String(updateError);
        this.logger.error(
          `[processOrganizationLogo] WARNING: Failed to update pin record status to PINNED, but file was successfully pinned to IPFS with CID: ${cid}`,
        );
        this.logger.error(
          `[processOrganizationLogo] Update error: ${errorMessage}`,
        );
        this.logger.warn(
          `[processOrganizationLogo] The logo is pinned (CID: ${cid}), but the status update failed. ` +
            `This may be due to network issues. The job will be marked as successful, but manual status update may be required.`,
        );
        // Continue - the file is pinned, which is the main goal
      }

      success = true;
    } catch (error) {
      const errorDetails =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[processOrganizationLogo] Failed to process logo for organization ${organizationId}`,
        errorDetails,
        error instanceof Error ? error.stack : undefined,
      );

      // Try to update status to FAILED, but don't throw if this fails
      try {
        await this._updatePinRecord(pinRecordId, {
          status: IpfsPinStatus.FAILED,
          provider: provider?.name,
        });
        this.logger.log(
          `[processOrganizationLogo] Updated pin record status to FAILED`,
        );
      } catch (updateError) {
        this.logger.error(
          `[processOrganizationLogo] CRITICAL: Failed to update pin record status to FAILED. This requires manual intervention.`,
          updateError,
        );
        // Don't throw here - we want the original error to be thrown
      }
    }

    if (!success) {
      throw new Error(
        `Failed to pin logo for organization ${organizationId}. See logs for details.`,
      );
    }
  }

  private async _updatePinRecord(
    pinRecordId: string,
    dto: UpdateIpfsPinRequestDto,
  ): Promise<void> {
    const url = `${this.indexerApiUrl}/ipfs/pins/${pinRecordId}`;
    this.logger.log(
      `[_updatePinRecord] Updating pin record ${pinRecordId} at ${url}`,
    );

    try {
      await firstValueFrom(
        this.httpService.patch(url, dto).pipe(
          catchError((err: AxiosError) => {
            const errorMessage = err.message || 'Unknown error';
            const errorCode = err.code || 'NO_CODE';
            const responseData = err.response?.data;

            this.logger.error(
              `[_updatePinRecord] Failed to update pin record ${pinRecordId} in indexer-api`,
            );
            this.logger.error(
              `[_updatePinRecord] URL: ${url}, Error: ${errorMessage}, Code: ${errorCode}`,
            );
            if (responseData) {
              this.logger.error(
                `[_updatePinRecord] Response data:`,
                JSON.stringify(responseData, null, 2),
              );
            }
            if (err.cause) {
              this.logger.error(`[_updatePinRecord] Cause:`, err.cause);
            }
            throw err;
          }),
        ),
      );
      this.logger.log(
        `[_updatePinRecord] Successfully updated pin record ${pinRecordId}`,
      );
    } catch (error) {
      // Log additional context for DNS/network errors
      if (error instanceof Error && error.message.includes('ENOTFOUND')) {
        this.logger.error(
          `[_updatePinRecord] DNS resolution failed. INDEXER_API_URL is set to: ${this.indexerApiUrl}`,
        );
        this.logger.error(
          `[_updatePinRecord] This usually means the indexer-api service is not accessible from ipfs-service. Check Docker networking or service configuration.`,
        );
      }
      throw error;
    }
  }

  private async _createManifestPinRecord(
    releaseId: string,
    cid: string,
    providerName: string,
  ): Promise<void> {
    const url = `${this.indexerApiUrl}/ipfs/pins`;
    const payload: CreateIpfsPinsRequestDto = {
      pins: [{ releaseId, type: 'MANIFEST' }],
    };

    const { data } = await firstValueFrom(
      this.httpService.post<CreateIpfsPinsResponseDto>(url, payload).pipe(
        catchError((err: AxiosError) => {
          this.logger.error(
            `Failed to create manifest pin record for release ${releaseId}`,
            err.response?.data,
          );
          throw err;
        }),
      ),
    );

    if (data.ids && data.ids.length > 0) {
      await this._updatePinRecord(data.ids[0], {
        status: IpfsPinStatus.PINNED,
        cid,
        provider: providerName,
      });
    } else {
      const errorMsg = `Indexer did not return an ID for the manifest pin record for release ${releaseId}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }
}
