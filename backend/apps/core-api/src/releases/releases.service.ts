import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JwtPayload,
  ReleaseDto,
  PaginatedReleasesResponseDto,
  FindReleasesQueryDto,
  CreateBlockchainJobResponseDto,
  CreateBlockchainJobRequestDto,
  ChainEventType,
  LicenseAssetPayload,
  PinReleaseFilesPayload,
  StoragePool,
  IpfsJobType,
  CreateAssetPayload,
  IpfsPersistenceJobResult,
  VerificationStatus,
  FileToPinRecordMap,
  CreateIpfsPinsRequestDto,
  CreateIpfsPinsResponseDto,
  CreateReleaseDto,
  UpdateReleaseDto,
} from '@app/common';
import { catchError, firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { AxiosError } from 'axios';
import { v4 as uuid } from 'uuid';
import { TransactionsService } from '../transactions/transactions.service';
import { ethers } from 'ethers';
import { LicensePermissions } from '@app/common/enums/license-permissions.enum';
import { PrismaService } from '@app/database';
import { ValidationService } from '../validation/validation.service';

interface IpfsJobResponse {
  jobId: string;
  status: 'QUEUED';
}

@Injectable()
export class ReleasesService {
  private readonly logger = new Logger(ReleasesService.name);
  private readonly ipfsServiceUrl: string;
  private readonly blockchainServiceUrl: string;
  private readonly indexerApiUrl: string | null;
  private readonly lensManagerUrl: string | null;
  private readonly httpTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionsService,
    private readonly prisma: PrismaService,
    private readonly validationService: ValidationService,
  ) {
    this.ipfsServiceUrl = this.configService.getOrThrow('IPFS_SERVICE_URL');
    this.blockchainServiceUrl = this.configService.getOrThrow(
      'BLOCKCHAIN_SERVICE_URL',
    );
    this.indexerApiUrl = this.configService.get<string>('INDEXER_API_URL') || null;
    this.lensManagerUrl = this.configService.get<string>('LENS_MANAGER_URL') || null;
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Release operations will be disabled.');
    }
    if (!this.lensManagerUrl) {
      this.logger.warn('Lens Manager URL not configured. P2P operations will be disabled.');
    }
    // Ensure httpTimeout is always a valid number (default: 100 seconds)
    // Handle both number and string values from environment variables
    const timeoutValue = this.configService.get<string | number>(
      'HTTP_TIMEOUT',
      100000,
    );
    const parsedTimeout =
      typeof timeoutValue === 'string' ? Number(timeoutValue) : timeoutValue;
    this.httpTimeout =
      typeof parsedTimeout === 'number' &&
      !isNaN(parsedTimeout) &&
      parsedTimeout > 0
        ? parsedTimeout
        : 100000;
  }

  async uploadReleaseFiles(uploadData: {
    organizationId: string;
    userId: string;
    siteAddress: string;
    releaseId: string;
    actorPeerId: string;
    file?: Express.Multer.File;
    thumbnails?: Express.Multer.File[];
    existingThumbnailCIDs?: string[];
  }) {
    const {
      organizationId,
      userId,
      releaseId,
      siteAddress,
      actorPeerId,
      file,
      thumbnails,
      existingThumbnailCIDs,
    } = uploadData;

    this.logger.log(`Enqueuing file uploads for release ID: ${releaseId}`);

    let mainFileRecord: FileToPinRecordMap | undefined;
    const thumbnailFileRecords: FileToPinRecordMap[] = [];

    const callIndexerToCreatePins = async (
      req: CreateIpfsPinsRequestDto,
    ): Promise<CreateIpfsPinsResponseDto> => {
      try {
        if (!this.indexerApiUrl) {
          throw new InternalServerErrorException(
            'IPFS pinning is not available. INDEXER_API_URL is not configured.',
          );
        }
        
        const { data } = await firstValueFrom(
          this.httpService.post<CreateIpfsPinsResponseDto>(
            `${this.indexerApiUrl}/ipfs/pins`,
            req,
          ),
        );
        return data;
      } catch (error) {
        this.logger.error(
          `CRITICAL: Failed to create pin records in indexer-api for release ${releaseId}. Aborting upload.`,
          (error as AxiosError).response?.data,
        );
        throw new InternalServerErrorException(
          'Could not initialize file processing records.',
        );
      }
    };

    // 1. Handle Main Content File
    if (file) {
      const pinCreationRequest: CreateIpfsPinsRequestDto = {
        pins: [{ releaseId, type: 'CONTENT' }],
      };
      const pinRecordResponse =
        await callIndexerToCreatePins(pinCreationRequest);
      const tempFilePath = file.path;
      mainFileRecord = {
        tempFilePath,
        pinRecordId: pinRecordResponse.ids[0],
        originalName: file.originalname,
      };
    }

    // 2. Handle Thumbnail Files
    if (thumbnails && thumbnails.length > 0) {
      const pinCreationRequest: CreateIpfsPinsRequestDto = {
        pins: thumbnails.map(() => ({ releaseId, type: 'THUMBNAIL' })),
      };
      const pinRecordResponse =
        await callIndexerToCreatePins(pinCreationRequest);

      for (let i = 0; i < thumbnails.length; i++) {
        const tempFilePath = thumbnails[i].path;
        thumbnailFileRecords.push({
          tempFilePath,
          pinRecordId: pinRecordResponse.ids[i],
          originalName: thumbnails[i].originalname,
        });
      }
    }

    const payload: PinReleaseFilesPayload = {
      pool: StoragePool.VDAS,
      userId,
      organizationId,
      releaseId,
      siteAddress,
      actorPeerId,
      existingThumbnailCIDs,
      mainFile: mainFileRecord,
      thumbnailFiles: thumbnailFileRecords,
    };

    const url = `${this.ipfsServiceUrl}/ipfs/pins`;
    const { data: ipfsJob } = await firstValueFrom(
      this.httpService
        .post<IpfsJobResponse>(url, {
          name: IpfsJobType.PIN_RELEASE_FILES,
          data: payload,
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              'Failed to enqueue IPFS pinning job',
              error.response?.data,
            );
            throw new InternalServerErrorException(
              'IPFS service request failed.',
            );
          }),
        ),
    );
    this.logger.log(
      `IPFS pinning job for release ${releaseId} enqueued with ID: ${ipfsJob.jobId}`,
    );

    return {
      releaseId,
      pinJobId: ipfsJob.jobId,
    };
  }

  async findAllReleases(
    query: FindReleasesQueryDto,
  ): Promise<PaginatedReleasesResponseDto> {
    if (!this.indexerApiUrl) {
      throw new InternalServerErrorException(
        'Release operations are not available. INDEXER_API_URL is not configured.',
      );
    }
    
    this.logger.log(`Forwarding find all releases request to indexer-api`);
    const url = `${this.indexerApiUrl}/releases`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<PaginatedReleasesResponseDto>(url, {
          params: query,
        }),
      );
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        'Failed to fetch releases from indexer-api',
        axiosError.response?.data,
      );
      throw new InternalServerErrorException('Failed to retrieve releases.');
    }
  }

  async findOneRelease(id: string): Promise<ReleaseDto> {
    this.logger.log(`Forwarding find release by id request for ${id}`);
    const url = `${this.indexerApiUrl}/releases/${id}`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<ReleaseDto>(url),
      );
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new NotFoundException(`Release with ID ${id} not found.`);
      }
      this.logger.error(
        `Failed to fetch release ${id} from indexer-api`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException('Failed to retrieve release.');
    }
  }

  async initiateAssetOnChainCreation(
    ipfsPayload: PinReleaseFilesPayload,
    ipfsResult: Omit<IpfsPersistenceJobResult, 'providerName'>,
  ) {
    const { releaseId, userId, actorPeerId } = ipfsPayload;
    const { contentCID, thumbnailManifestCID, assetHash } = ipfsResult;

    this.logger.log(`Initiating on-chain creation for release ${releaseId}`);

    // Step 1: Fetch the full P2P metadata to get price, description, etc.
    // This ensures we use the exact data the user submitted.
    const url = `${this.indexerApiUrl}/releases/${releaseId}`;
    let indexedRelease: ReleaseDto;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<ReleaseDto>(url),
      );
      indexedRelease = data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to fetch release ${releaseId} from indexer-api`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve release information.',
      );
    }

    // Step 1.5: Validate that the organization has a contract address before proceeding
    const organization = await this.prisma.organization.findFirst({
      where: { siteAddress: indexedRelease.siteAddress },
      select: { contractAddress: true, id: true },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with siteAddress ${indexedRelease.siteAddress} not found.`,
      );
    }

    if (!organization.contractAddress) {
      this.logger.error(
        `Cannot create asset for release ${releaseId}: Organization ${organization.id} at site ${indexedRelease.siteAddress} has no contract address. The organization contract must be created first.`,
      );
      throw new BadRequestException(
        `Cannot create asset: Organization contract has not been created yet. Please wait for the organization setup to complete.`,
      );
    }

    // Step 1.6: Run asset validation (non-blocking, logs warnings)
    try {
      const validationResult = await this.validationService.validateAsset({
        releaseId,
        county: indexedRelease.county,
        state: indexedRelease.state,
        operator: (indexedRelease as any).operator,
        apiNumber: (indexedRelease as any).apiNumber,
        legalDescription: indexedRelease.description, // Use description as legalDescription
        category: indexedRelease.category,
        assetType: indexedRelease.assetType,
        // Note: documentUrl would need to be available from the release
        // For now, we skip AI analysis if no document URL is present
        skipAIAnalysis: true, // TODO: Enable when document URL is available
      });

      if (validationResult.canProceed) {
        this.logger.log(
          `Asset validation passed for release ${releaseId}: Score ${validationResult.overallScore}%`,
        );
        if (validationResult.warnings.length > 0) {
          this.logger.warn(
            `Asset validation warnings for release ${releaseId}: ${validationResult.warnings.join('; ')}`,
          );
        }
      } else {
        this.logger.warn(
          `Asset validation issues for release ${releaseId}: ${validationResult.errors.join('; ')}. Proceeding with asset creation (validation is non-blocking).`,
        );
      }
    } catch (validationError) {
      // Validation errors don't block asset creation, just log them
      this.logger.warn(
        `Asset validation failed for release ${releaseId}: ${validationError}. Proceeding with asset creation.`,
      );
    }

    // Step 2: Calculate metadataHash (a hash of the full metadata object)
    // The contract expects a hash of the descriptive data, not the file itself.
    const metadataForHashing = {
      name: indexedRelease.name,
      description: indexedRelease.description,
      tags: indexedRelease.tags,
      contentCID: contentCID,
      thumbnailCID: thumbnailManifestCID,
    };
    const metadataHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(metadataForHashing)),
    );

    // Step 3: Enqueue the blockchain job
    const blockchainUrl = `${this.blockchainServiceUrl}/jobs`;
    const eventType = ChainEventType.CREATE_ASSET;
    const txId = uuid();

    // The payload for the blockchain service. `onChainAssetId` will be added later.
    const jobPayload: Partial<CreateAssetPayload> = {
      txId,
      userId,
      releaseId,
      siteAddress: indexedRelease.siteAddress,
      actorPeerId,
      assetCID: contentCID,
      metadataHash: metadataHash,
      assetHash,
      price: indexedRelease.price
        ? ethers.parseUnits(indexedRelease.price, 6).toString()
        : '0',
      isEncrypted: indexedRelease.isEncrypted,
      canBeLicensed: true,
      fxPool: StoragePool.VDAS,
      timeStamp: new Date(indexedRelease.createdAt).toISOString(),
      // O&G-specific fields
      assetType: indexedRelease.assetType,
      category: indexedRelease.category,
      productionStatus: indexedRelease.productionStatus,
      basin: indexedRelease.basin,
      acreage: indexedRelease.acreage,
      state: indexedRelease.state,
      county: indexedRelease.county,
      location: indexedRelease.location,
      projectedROI: indexedRelease.projectedROI,
    };

    const jobRequestDto: CreateBlockchainJobRequestDto = {
      eventType,
      txId,
      payload: jobPayload,
    };

    try {
      await this.transactionService.indexTransaction({
        txId,
        eventType,
        submittedAt: new Date().toISOString(),
        relatedObjectId: releaseId,
      });
      this.logger.log(
        `Indexed PENDING transaction record for CREATE_ASSET job. Tx ID: ${txId}`,
      );
      await firstValueFrom(
        this.httpService.post<CreateBlockchainJobResponseDto>(
          blockchainUrl,
          jobRequestDto,
          { headers: { 'X-Idempotency-Key': `create-asset-${releaseId}` } },
        ),
      );
      this.logger.log(
        `Successfully enqueued CREATE_ASSET job for release ${releaseId}`,
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to create on-chain asset job for release ${releaseId}`,
        axiosError.response?.data,
      );
      // This will be caught by the IpfsEventsProcessor and logged.
      throw new InternalServerErrorException(
        'Failed to initiate on-chain asset creation.',
      );
    }
  }

  async initiateAssetOnChainLicense(
    releaseId: string,
    jwtPayload: JwtPayload,
    attemptId: string,
  ) {
    this.logger.log(
      `Initiating license purchase for release ${releaseId} by user ${jwtPayload.sub} (Attempt: ${attemptId})`,
    );

    // Step 1: Fetch the full, up-to-date release details from the indexer
    const release = await this.findOneRelease(releaseId);

    if (release.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException(
        'Cannot license an asset that is not verified.',
      );
    }
    if (!release.onChainAssetId) {
      throw new InternalServerErrorException(
        'Asset is missing its on-chain ID and cannot be licensed.',
      );
    }
    if (!release.price) {
      throw new BadRequestException(
        'Asset does not have a price and cannot be licensed.',
      );
    }
    // Step 2: Fetch platform fees to calculate the gross price
    const feesUrl = `${this.blockchainServiceUrl}/rpc/factory/fees`;
    const { data: fees } = await firstValueFrom(
      this.httpService.get<{ integratorFee: string; EmpressaFee: string }>(
        feesUrl,
      ),
    );
    const integratorFeePct = BigInt(fees.integratorFee);
    const EmpressaFeePct = BigInt(fees.EmpressaFee);

    const priceWei = ethers.parseUnits(release.price, 6);
    const grossPriceWei =
      (priceWei * (10000n + EmpressaFeePct + integratorFeePct)) / 10000n;

    this.logger.log(
      `Calculated gross price: ${ethers.formatUnits(
        grossPriceWei,
        6,
      )} USDC from net price ${release.price} USDC`,
    );

    // Step 3: Construct the full payload for the blockchain job
    const url = `${this.blockchainServiceUrl}/jobs`;
    const eventType = ChainEventType.LICENSE_ASSET;
    const txId = uuid();

    const licensePayload: LicenseAssetPayload = {
      txId,
      userId: jwtPayload.sub,
      releaseId: release.id,
      siteAddress: release.siteAddress,
      onChainAssetId: release.onChainAssetId,
      price: grossPriceWei.toString(), // Use the calculated gross price
      permissions: [LicensePermissions.View, LicensePermissions.Resell],
      resellerFee: priceWei.toString(), // Reseller fee is based on creator's net price
      buyerPeerId: jwtPayload.peerId,
      creatorPeerId: release.postedBy,
    };

    const jobRequestDto: CreateBlockchainJobRequestDto = {
      eventType,
      txId,
      payload: licensePayload,
    };

    // Step 4: Create a PENDING transaction record in the indexer
    await this.transactionService.indexTransaction({
      txId,
      eventType,
      submittedAt: new Date().toISOString(),
      relatedObjectId: releaseId,
    });

    // Step 5: Enqueue the job in the blockchain-service
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<CreateBlockchainJobResponseDto>(
          url,
          jobRequestDto,
          {
            headers: {
              'X-Idempotency-Key': `license-${releaseId}-${jwtPayload.sub}-${attemptId}`,
            },
          },
        ),
      );
      // Return the job and transaction IDs to the frontend for polling
      return {
        ...data,
        txId,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to create license job for release ${releaseId}`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException(
        'Failed to initiate license purchase.',
      );
    }
  }

  async checkAssetHash(hash: string): Promise<{ exists: boolean }> {
    this.logger.log(`Proxying asset hash check for hash: ${hash}`);
    const url = `${this.blockchainServiceUrl}/rpc/assets/check-hash/${hash}`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ exists: boolean }>(url),
      );
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to proxy asset hash check to blockchain-service`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException('Failed to check asset hash.');
    }
  }

  async createRelease(
    siteAddress: string,
    postedBy: string, // p2pPublicKey from JWT
    dto: Omit<CreateReleaseDto, 'siteAddress' | 'postedBy'>,
  ): Promise<{ releaseId: string }> {
    // The ID is now passed in the DTO from the frontend
    const { id: releaseId } = dto;
    this.logger.log(`Proxying create release request for ID: ${releaseId}`);

    const fullDto: CreateReleaseDto = {
      ...dto,
      siteAddress,
      postedBy,
    };

    if (!this.lensManagerUrl) {
      throw new InternalServerErrorException(
        'Release creation is not available. LENS_MANAGER_URL is not configured.',
      );
    }

    const url = `${this.lensManagerUrl}/sites/${siteAddress}/releases`;

    try {
      // Use Promise.race to ensure hard timeout even if HTTP client doesn't respect it
      await Promise.race([
        firstValueFrom(
          this.httpService
            .post(url, fullDto, { timeout: this.httpTimeout })
            .pipe(
              timeout(this.httpTimeout),
              catchError((error: unknown) => {
                // Handle timeout errors
                if (error instanceof TimeoutError) {
                  this.logger.error(
                    `Request to lens-manager timed out after ${this.httpTimeout}ms while creating release ${releaseId}. Lens-manager may be slow or unavailable.`,
                  );
                  throw new InternalServerErrorException(
                    'Request to lens-manager timed out. The service may be overloaded or unavailable.',
                  );
                }

                // Handle Axios errors
                if (!(error instanceof AxiosError)) {
                  const errorMessage =
                    error instanceof Error
                      ? error.message
                      : `Unexpected error: ${String(error)}`;
                  throw new InternalServerErrorException(errorMessage);
                }

                const statusCode = error.response?.status;
                const errorMessage = error.message || 'Unknown error';

                // Handle gateway timeouts (504)
                if (
                  statusCode === 504 ||
                  errorMessage.includes('504') ||
                  errorMessage.includes('Gateway Timeout')
                ) {
                  this.logger.error(
                    `Gateway timeout (504) from lens-manager while creating release ${releaseId} on site ${siteAddress}. This may indicate the site does not exist or lens-manager is overloaded.`,
                  );
                  throw new InternalServerErrorException(
                    `Gateway timeout: The P2P site ${siteAddress} may not exist or lens-manager is taking too long to respond. Please verify the site exists or contact support.`,
                  );
                }

                // Handle 500 errors that indicate site doesn't exist
                if (
                  statusCode === 500 &&
                  (errorMessage.includes("doesn't exist") ||
                    errorMessage.includes('Failed to open P2P site') ||
                    errorMessage.includes('Failed to resolve program'))
                ) {
                  const responseMessage =
                    (error.response?.data as { message?: string })?.message ||
                    errorMessage;
                  this.logger.error(
                    `Site ${siteAddress} does not exist in P2P network. Cannot create release ${releaseId}.`,
                  );
                  throw new InternalServerErrorException(
                    `The P2P site ${siteAddress} does not exist. The organization's P2P site may not have been created properly. Please contact support to recreate the site.`,
                  );
                }

                // Handle other HTTP errors
                this.logger.error(
                  `Failed to proxy create release request to lens-manager`,
                  {
                    statusCode,
                    message: errorMessage,
                    responseData: error.response?.data as unknown,
                  },
                );
                throw new InternalServerErrorException(
                  'Failed to create P2P release record.',
                );
              }),
            ),
        ),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => {
              this.logger.error(
                `Hard timeout: Request to lens-manager exceeded ${this.httpTimeout}ms while creating release ${releaseId}. Aborting.`,
              );
              reject(new TimeoutError());
            },
            this.httpTimeout + 100, // Add 100ms buffer
          ),
        ),
      ]);

      this.logger.log(
        `Successfully created release ${releaseId} in lens-manager`,
      );
    } catch (error) {
      // Handle timeout errors from Promise.race
      if (error instanceof TimeoutError) {
        this.logger.error(
          `Request to lens-manager timed out after ${this.httpTimeout}ms while creating release ${releaseId} on site ${siteAddress}. The site may not exist in the P2P network.`,
        );
        throw new InternalServerErrorException(
          `Request to lens-manager timed out. The P2P site ${siteAddress} may not exist or the service may be overloaded. Please verify the site exists or contact support.`,
        );
      }
      // Re-throw other errors (they're already handled above)
      throw error;
    }

    // Return the same ID that was passed in to confirm success
    return { releaseId };
  }

  async updateRelease(
    siteAddress: string,
    releaseId: string,
    dto: UpdateReleaseDto,
  ): Promise<void> {
    if (!this.lensManagerUrl) {
      throw new InternalServerErrorException(
        'Release update is not available. LENS_MANAGER_URL is not configured.',
      );
    }
    
    this.logger.log(`Proxying update release request for ID: ${releaseId}`);
    const url = `${this.lensManagerUrl}/sites/${siteAddress}/releases/${releaseId}`;

    try {
      await Promise.race([
        firstValueFrom(
          this.httpService.patch(url, dto, { timeout: this.httpTimeout }).pipe(
            timeout(this.httpTimeout),
            catchError((error: unknown) => {
              if (error instanceof TimeoutError) {
                this.logger.error(
                  `Request to lens-manager timed out after ${this.httpTimeout}ms while updating release ${releaseId}.`,
                );
                throw new InternalServerErrorException(
                  'Request to lens-manager timed out. The service may be overloaded or unavailable.',
                );
              }

              if (!(error instanceof AxiosError)) {
                const errorMessage =
                  error instanceof Error
                    ? error.message
                    : `Unexpected error: ${String(error)}`;
                throw new InternalServerErrorException(errorMessage);
              }

              const statusCode = error.response?.status;
              const errorMessage = error.message || 'Unknown error';

              if (
                statusCode === 504 ||
                errorMessage.includes('504') ||
                errorMessage.includes('Gateway Timeout')
              ) {
                this.logger.error(
                  `Gateway timeout (504) from lens-manager while updating release ${releaseId}.`,
                );
                throw new InternalServerErrorException(
                  'Gateway timeout: lens-manager is taking too long to respond. Please try again.',
                );
              }

              this.logger.error(
                `Failed to proxy update release request to lens-manager`,
                {
                  statusCode,
                  message: errorMessage,
                  responseData: error.response?.data as unknown,
                },
              );
              throw new InternalServerErrorException(
                'Failed to update P2P release record.',
              );
            }),
          ),
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            this.logger.error(
              `Hard timeout: Request to lens-manager exceeded ${this.httpTimeout}ms while updating release ${releaseId}. Aborting.`,
            );
            reject(new TimeoutError());
          }, this.httpTimeout + 100),
        ),
      ]);
      this.logger.log(
        `Successfully updated release ${releaseId} in lens-manager`,
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new InternalServerErrorException(
          'Request to lens-manager timed out. The service may be overloaded or unavailable.',
        );
      }
      throw error;
    }
  }

  async removeRelease(siteAddress: string, releaseId: string): Promise<void> {
    if (!this.lensManagerUrl) {
      throw new InternalServerErrorException(
        'Release removal is not available. LENS_MANAGER_URL is not configured.',
      );
    }
    
    this.logger.log(`Proxying delete release request for ID: ${releaseId}`);
    const url = `${this.lensManagerUrl}/sites/${siteAddress}/releases/${releaseId}`;

    try {
      await Promise.race([
        firstValueFrom(
          this.httpService.delete(url, { timeout: this.httpTimeout }).pipe(
            timeout(this.httpTimeout),
            catchError((error: unknown) => {
              if (error instanceof TimeoutError) {
                this.logger.error(
                  `Request to lens-manager timed out after ${this.httpTimeout}ms while deleting release ${releaseId}.`,
                );
                throw new InternalServerErrorException(
                  'Request to lens-manager timed out. The service may be overloaded or unavailable.',
                );
              }

              if (!(error instanceof AxiosError)) {
                const errorMessage =
                  error instanceof Error
                    ? error.message
                    : `Unexpected error: ${String(error)}`;
                throw new InternalServerErrorException(errorMessage);
              }

              const statusCode = error.response?.status;
              const errorMessage = error.message || 'Unknown error';

              if (
                statusCode === 504 ||
                errorMessage.includes('504') ||
                errorMessage.includes('Gateway Timeout')
              ) {
                this.logger.error(
                  `Gateway timeout (504) from lens-manager while deleting release ${releaseId}.`,
                );
                throw new InternalServerErrorException(
                  'Gateway timeout: lens-manager is taking too long to respond. Please try again.',
                );
              }

              this.logger.error(
                `Failed to proxy delete release request to lens-manager`,
                {
                  statusCode,
                  message: errorMessage,
                  responseData: error.response?.data as unknown,
                },
              );
              throw new InternalServerErrorException(
                'Failed to delete P2P release record.',
              );
            }),
          ),
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            this.logger.error(
              `Hard timeout: Request to lens-manager exceeded ${this.httpTimeout}ms while deleting release ${releaseId}. Aborting.`,
            );
            reject(new TimeoutError());
          }, this.httpTimeout + 100),
        ),
      ]);
      this.logger.log(
        `Successfully deleted release ${releaseId} in lens-manager`,
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new InternalServerErrorException(
          'Request to lens-manager timed out. The service may be overloaded or unavailable.',
        );
      }
      throw error;
    }
  }
}
