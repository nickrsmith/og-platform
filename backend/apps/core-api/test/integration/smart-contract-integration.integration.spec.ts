import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ReleasesService } from '../../src/releases/releases.service';
import { PrismaService } from '@app/database';
import { TransactionsService } from '../../src/transactions/transactions.service';
import { ValidationService } from '../../src/validation/validation.service';
import { of } from 'rxjs';
import { AssetCategory, AssetType, ProductionStatus } from '@app/common';

/**
 * Smart Contract Integration Tests
 *
 * Tests that O&G fields are correctly passed from backend to smart contracts
 * through the blockchain job processor.
 */
describe('Smart Contract O&G Integration', () => {
  let releasesService: ReleasesService;
  let httpService: jest.Mocked<HttpService>;
  let prismaService: jest.Mocked<PrismaService>;
  let transactionService: jest.Mocked<TransactionsService>;
  let validationService: jest.Mocked<ValidationService>;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          INDEXER_API_URL: 'http://indexer-api',
          BLOCKCHAIN_SERVICE_URL: 'http://blockchain-service',
          IPFS_SERVICE_URL: 'http://ipfs-service',
          LENS_MANAGER_URL: 'http://lens-manager',
        };
        return config[key] || '';
      }),
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'HTTP_TIMEOUT') return 100000;
        return defaultValue;
      }),
    };

    const mockPrismaService = {
      organization: {
        findFirst: jest.fn(),
      },
    };

    const mockTransactionService = {
      indexTransaction: jest.fn(),
    };

    const mockValidationService = {
      validateAsset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReleasesService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionService,
        },
        {
          provide: ValidationService,
          useValue: mockValidationService,
        },
      ],
    }).compile();

    releasesService = module.get<ReleasesService>(ReleasesService);
    httpService = module.get(HttpService);
    prismaService = module.get(PrismaService);
    transactionService = module.get(TransactionsService);
    validationService = module.get(ValidationService);
  });

  describe('O&G Fields in Blockchain Job Payload', () => {
    it('should include all O&G fields in CreateAssetPayload', async () => {
      // Mock organization with contract
      (prismaService.organization.findFirst as jest.Mock).mockResolvedValue({
        id: 'org-123',
        contractAddress: '0x1234567890abcdef',
      });

      // Mock indexer-api response with O&G fields
      httpService.get.mockReturnValue(
        of({
          data: {
            id: 'release-123',
            name: 'Test Mineral Asset',
            siteAddress: 'test-site',
            price: '100000',
            isEncrypted: false,
            createdAt: new Date().toISOString(),
            // O&G fields
            category: AssetCategory.C,
            assetType: AssetType.Mineral,
            productionStatus: ProductionStatus.Producing,
            basin: 'PERMIAN',
            acreage: 40.5,
            state: 'TX',
            county: 'REEVES',
            location: 'Section 10, Block 10',
            projectedROI: 15.5,
          },
        }),
      );

      // Mock validation (non-blocking)
      (validationService.validateAsset as jest.Mock).mockResolvedValue({
        overallStatus: 'PASSED',
        canProceed: true,
        overallScore: 85,
        issues: [],
        warnings: [],
        errors: [],
      });

      // Mock blockchain service
      httpService.post.mockReturnValue(
        of({
          data: {
            jobId: 'job-123',
            status: 'QUEUED',
          },
        }),
      );

      // Mock transaction indexing
      (transactionService.indexTransaction as jest.Mock).mockResolvedValue(undefined);

      // Call initiateAssetOnChainCreation
      await releasesService.initiateAssetOnChainCreation(
        {
          releaseId: 'release-123',
          userId: 'user-123',
          actorPeerId: 'peer-123',
          organizationId: 'org-123',
          siteAddress: 'test-site',
        },
        {
          contentCID: 'QmTest123',
          thumbnailManifestCID: 'QmThumb123',
          assetHash: '0xhash123',
        },
      );

      // Verify blockchain service was called with O&G fields
      expect(httpService.post).toHaveBeenCalled();
      const callArgs = (httpService.post as jest.Mock).mock.calls[0];
      const payload = callArgs[1].payload;

      // Verify all O&G fields are present
      expect(payload.category).toBe(AssetCategory.C);
      expect(payload.assetType).toBe(AssetType.Mineral);
      expect(payload.productionStatus).toBe(ProductionStatus.Producing);
      expect(payload.basin).toBe('PERMIAN');
      expect(payload.acreage).toBe(40.5);
      expect(payload.state).toBe('TX');
      expect(payload.county).toBe('REEVES');
      expect(payload.location).toBe('Section 10, Block 10');
      expect(payload.projectedROI).toBe(15.5);
    });

    it('should handle missing O&G fields gracefully (backward compatibility)', async () => {
      (prismaService.organization.findFirst as jest.Mock).mockResolvedValue({
        id: 'org-123',
        contractAddress: '0x1234567890abcdef',
      });

      // Mock indexer-api response WITHOUT O&G fields (old release)
      httpService.get.mockReturnValue(
        of({
          data: {
            id: 'release-123',
            name: 'Legacy Asset',
            siteAddress: 'test-site',
            price: '100000',
            isEncrypted: false,
            createdAt: new Date().toISOString(),
            // No O&G fields
          },
        }),
      );

      (validationService.validateAsset as jest.Mock).mockResolvedValue({
        overallStatus: 'PASSED',
        canProceed: true,
      });

      httpService.post.mockReturnValue(
        of({
          data: { jobId: 'job-123', status: 'QUEUED' },
        }),
      );

      (transactionService.indexTransaction as jest.Mock).mockResolvedValue(undefined);

      await releasesService.initiateAssetOnChainCreation(
        {
          releaseId: 'release-123',
          userId: 'user-123',
          actorPeerId: 'peer-123',
          organizationId: 'org-123',
          siteAddress: 'test-site',
        },
        {
          contentCID: 'QmTest123',
          thumbnailManifestCID: 'QmThumb123',
          assetHash: '0xhash123',
        },
      );

      // Should still work without O&G fields
      expect(httpService.post).toHaveBeenCalled();
      const payload = (httpService.post as jest.Mock).mock.calls[0][1].payload;
      
      // O&G fields should be undefined (not cause errors)
      expect(payload.category).toBeUndefined();
      expect(payload.assetType).toBeUndefined();
    });
  });

  describe('Category C Free Listing Validation', () => {
    it('should validate Category C assets for free listing', async () => {
      (prismaService.organization.findFirst as jest.Mock).mockResolvedValue({
        id: 'org-123',
        contractAddress: '0x1234567890abcdef',
      });

      httpService.get.mockReturnValue(
        of({
          data: {
            id: 'release-123',
            name: 'Category C Asset',
            siteAddress: 'test-site',
            price: '100000',
            category: AssetCategory.C,
            assetType: AssetType.Mineral,
            county: 'REEVES',
            state: 'TX',
            createdAt: new Date().toISOString(),
          },
        }),
      );

      // Mock validation with Category C check
      (validationService.validateAsset as jest.Mock).mockResolvedValue({
        overallStatus: 'PASSED',
        canProceed: true,
        issues: [
          {
            type: 'CATEGORY',
            severity: 'info',
            message: 'Category C: Free listing (no platform fees will be charged)',
          },
        ],
      });

      httpService.post.mockReturnValue(
        of({
          data: { jobId: 'job-123', status: 'QUEUED' },
        }),
      );

      (transactionService.indexTransaction as jest.Mock).mockResolvedValue(undefined);

      await releasesService.initiateAssetOnChainCreation(
        {
          releaseId: 'release-123',
          userId: 'user-123',
          actorPeerId: 'peer-123',
          organizationId: 'org-123',
          siteAddress: 'test-site',
        },
        {
          contentCID: 'QmTest123',
          thumbnailManifestCID: 'QmThumb123',
          assetHash: '0xhash123',
        },
      );

      // Verify validation was called with Category C
      expect(validationService.validateAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          category: AssetCategory.C,
        }),
      );
    });
  });
});

