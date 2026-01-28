import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChainEventType,
  CreateBlockchainJobRequestDto,
  CreateBlockchainJobResponseDto,
  FindQueryDto,
  PaginatedPendingReleasesDto,
  ReconcilieReleaseRequestDto,
  ReleaseDto,
  VerificationStatus,
  VerifyAssetPayload,
} from '@app/common';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ReleasesService {
  private readonly logger = new Logger(ReleasesService.name);
  private readonly indexerApiUrl: string;
  private readonly lensManagerUrl: string;
  private readonly blockchainServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.indexerApiUrl = this.configService.getOrThrow('INDEXER_API_URL');
    this.lensManagerUrl = this.configService.getOrThrow('LENS_MANAGER_URL');
    this.blockchainServiceUrl = this.configService.getOrThrow(
      'BLOCKCHAIN_SERVICE_URL',
    );
  }

  async findPendingVerifications(
    query: FindQueryDto,
  ): Promise<PaginatedPendingReleasesDto> {
    this.logger.log(`Fetching all unverified releases from indexer-api`);

    const url = `${this.indexerApiUrl}/releases/pending-verifications`;
    const startTime = Date.now();
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<PaginatedPendingReleasesDto>(url, {
          params: query,
        }),
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `Successfully fetched ${data.data.length} pending verifications (took ${duration}ms)`,
      );
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      const axiosError = error as AxiosError;
      const isTimeout =
        axiosError.code === 'ECONNABORTED' ||
        axiosError.message?.includes('timeout');

      this.logger.error(
        `Failed to fetch pending verifications from indexer-api (took ${duration}ms)`,
        {
          url,
          error: axiosError.message,
          code: axiosError.code,
          isTimeout,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
        },
      );

      if (isTimeout) {
        throw new InternalServerErrorException(
          `Request to indexer-api timed out after ${duration}ms. The service may be overloaded.`,
        );
      }

      throw new InternalServerErrorException(
        'Failed to retrieve pending verifications.',
      );
    }
  }

  async approveVerification(releaseId: string) {
    this.logger.log(`Admin is approving verification for release ${releaseId}`);

    // Step 1: Fetch full release details to get required info
    const release = await this.findOneRelease(releaseId);
    if (!release.onChainAssetId) {
      throw new InternalServerErrorException(
        'Asset is missing its onChainAssetId. Cannot verify.',
      );
    }

    // Step 2: Enqueue the blockchain job
    const url = `${this.blockchainServiceUrl}/jobs`;
    const eventType = ChainEventType.VERIFY_ASSET;
    const txId = uuid();

    const jobPayload: VerifyAssetPayload = {
      releaseId,
      siteAddress: release.siteAddress,
      // Injecting the on-chain ID directly into the payload
      onChainAssetId: release.onChainAssetId,
    };

    const jobRequestDto: CreateBlockchainJobRequestDto = {
      eventType,
      txId,
      payload: jobPayload,
    };

    const startTime = Date.now();
    try {
      await firstValueFrom(
        this.httpService.post(`${this.indexerApiUrl}/transactions`, {
          txId,
          eventType,
          submittedAt: new Date().toISOString(),
          relatedObjectId: releaseId,
        }),
      );

      const { data } = await firstValueFrom(
        this.httpService.post<CreateBlockchainJobResponseDto>(
          url,
          jobRequestDto,
          {
            headers: { 'X-Idempotency-Key': `verify-${releaseId}` },
          },
        ),
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `Successfully created verification job for release ${releaseId} (took ${duration}ms)`,
      );
      return { ...data, txId };
    } catch (error) {
      const duration = Date.now() - startTime;
      const axiosError = error as AxiosError;
      const isTimeout =
        axiosError.code === 'ECONNABORTED' ||
        axiosError.message?.includes('timeout');

      this.logger.error(
        `Failed to create verification job for release ${releaseId} (took ${duration}ms)`,
        {
          error: axiosError.message,
          code: axiosError.code,
          isTimeout,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
        },
      );

      if (isTimeout) {
        throw new InternalServerErrorException(
          `Request timed out after ${duration}ms. The blockchain-service or indexer-api may be overloaded.`,
        );
      }

      throw new InternalServerErrorException(
        'Failed to initiate verification.',
      );
    }
  }

  async rejectVerification(releaseId: string, reason?: string) {
    this.logger.log(
      `Admin is rejecting verification for release ${releaseId}. Reason: ${reason || 'None provided'}`,
    );
    const release = await this.findOneRelease(releaseId);

    // This logic is purely off-chain and updates the P2P and indexer layers
    const lensUrl = `${this.lensManagerUrl}/sites/${release.siteAddress}/releases/${releaseId}`;
    const reconciliePayload: ReconcilieReleaseRequestDto = {
      verificationStatus: VerificationStatus.REJECTED,
    };

    const lensStartTime = Date.now();
    await firstValueFrom(
      this.httpService.patch(lensUrl, reconciliePayload).pipe(
        catchError((error: AxiosError) => {
          const duration = Date.now() - lensStartTime;
          const isTimeout =
            error.code === 'ECONNABORTED' || error.message?.includes('timeout');

          this.logger.error(
            `CRITICAL: Failed to update lens-manager for release ${releaseId} (took ${duration}ms)`,
            {
              url: lensUrl,
              error: error.message,
              code: error.code,
              isTimeout,
              response: error.response?.data,
              status: error.response?.status,
            },
          );

          if (isTimeout) {
            return throwError(
              () =>
                new InternalServerErrorException(
                  `Request to lens-manager timed out after ${duration}ms. The service may be overloaded.`,
                ),
            );
          }

          return throwError(
            () =>
              new InternalServerErrorException(
                'Failed to update release status in lens-manager.',
              ),
          );
        }),
      ),
    );
    const lensDuration = Date.now() - lensStartTime;
    this.logger.log(
      `Successfully updated lens-manager for release ${releaseId} (took ${lensDuration}ms)`,
    );

    // Update the indexer
    const indexerUrl = `${this.indexerApiUrl}/releases/${releaseId}`;
    const indexerPayload = {
      verificationStatus: VerificationStatus.REJECTED,
      rejectionReason: reason,
    };
    const indexerStartTime = Date.now();
    await firstValueFrom(
      this.httpService.patch(indexerUrl, indexerPayload).pipe(
        catchError((error: AxiosError) => {
          const duration = Date.now() - indexerStartTime;
          const isTimeout =
            error.code === 'ECONNABORTED' || error.message?.includes('timeout');

          this.logger.error(
            `CRITICAL: Failed to update indexer for release ${releaseId} (took ${duration}ms)`,
            {
              url: indexerUrl,
              error: error.message,
              code: error.code,
              isTimeout,
              response: error.response?.data,
              status: error.response?.status,
            },
          );

          if (isTimeout) {
            throw new InternalServerErrorException(
              `Request to indexer-api timed out after ${duration}ms. The service may be overloaded.`,
            );
          }

          throw new InternalServerErrorException(
            'Failed to update release status in indexer.',
          );
        }),
      ),
    );
    const indexerDuration = Date.now() - indexerStartTime;
    this.logger.log(
      `Successfully updated indexer for release ${releaseId} (took ${indexerDuration}ms)`,
    );
  }

  private async findOneRelease(id: string): Promise<ReleaseDto> {
    const url = `${this.indexerApiUrl}/releases/${id}`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<ReleaseDto>(url),
      );
      return data;
    } catch {
      throw new InternalServerErrorException(
        'Failed to retrieve release details from indexer.',
      );
    }
  }

  async deleteRelease(releaseId: string): Promise<void> {
    this.logger.log(`Admin is deleting release: ${releaseId}`);

    // 1. Fetch release from indexer to get its siteAddress
    const release = await this.findOneRelease(releaseId);
    if (!release.siteAddress) {
      throw new InternalServerErrorException(
        `Release ${releaseId} is missing a siteAddress and cannot be deleted from the P2P network.`,
      );
    }

    // 2. Call the new DELETE endpoint on lens-manager
    const url = `${this.lensManagerUrl}/sites/${release.siteAddress}/releases/${releaseId}`;

    await firstValueFrom(
      this.httpService.delete(url).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(
            `Failed to delete P2P release ${releaseId} via lens-manager`,
            error.response?.data,
          );
          // Still throw an error, but be specific
          if (error.response?.status === 404) {
            throw new NotFoundException(
              `P2P release record not found in lens-manager for ID: ${releaseId}. It may have already been deleted.`,
            );
          }
          throw new InternalServerErrorException(
            'Failed to delete the P2P release record.',
          );
        }),
      ),
    );

    // The lens-manager will automatically trigger the indexer-api to clean up its own record.
    this.logger.log(
      `Successfully initiated deletion for release: ${releaseId}`,
    );
  }

  // Flagged listings - TODO: Implement when flagged field is added to Release schema
  async findFlagged(query: FindQueryDto) {
    this.logger.log('Finding flagged listings (placeholder)');
    // Placeholder: Return empty array until flagged field is added to Release model
    return {
      items: [],
      total: 0,
      page: query.page || 1,
      limit: query.limit || 50,
      totalPages: 0,
    };
  }

  async flagRelease(releaseId: string, reason?: string) {
    this.logger.log(`Flagging release ${releaseId} with reason: ${reason || 'No reason provided'}`);
    // Placeholder: Implement when flagged field is added to Release model
    // For now, just return success
    return { id: releaseId, flagged: true, reason };
  }

  async unflagRelease(releaseId: string) {
    this.logger.log(`Unflagging release ${releaseId}`);
    // Placeholder: Implement when flagged field is added to Release model
    return { id: releaseId, flagged: false };
  }

  // Featured listings - TODO: Implement when featured field is added to Release schema
  async findFeatured(query: FindQueryDto) {
    this.logger.log('Finding featured listings (placeholder)');
    // Placeholder: Return empty array until featured field is added to Release model
    return {
      items: [],
      total: 0,
      page: query.page || 1,
      limit: query.limit || 50,
      totalPages: 0,
    };
  }

  async featureRelease(releaseId: string) {
    this.logger.log(`Featuring release ${releaseId}`);
    // Placeholder: Implement when featured field is added to Release model
    return { id: releaseId, featured: true };
  }

  async unfeatureRelease(releaseId: string) {
    this.logger.log(`Unfeaturing release ${releaseId}`);
    // Placeholder: Implement when featured field is added to Release model
    return { id: releaseId, featured: false };
  }
}
