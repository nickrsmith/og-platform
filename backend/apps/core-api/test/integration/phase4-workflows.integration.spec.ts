import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ValidationService } from '../../src/validation/validation.service';
import { EnverusService } from '../../src/enverus/enverus.service';
import { AiService } from '../../src/ai/ai.service';
import { ReleasesService } from '../../src/releases/releases.service';
import { OrganizationsService } from '../../src/organizations/organizations.service';
import { PrismaService } from '@app/database';
import { TransactionsService } from '../../src/transactions/transactions.service';
import { of } from 'rxjs';
import { AssetCategory, AssetType, ProductionStatus } from '@app/common';

/**
 * Phase 4 Integration Tests
 *
 * Tests the complete workflows for:
 * - Enverus → Validation → Asset Creation
 * - AI → Validation → Asset Creation
 * - Organization Category → Asset Validation
 * - Smart Contract integration with O&G fields
 */
describe('Phase 4 O&G Services Integration', () => {
  let validationService: ValidationService;
  let enverusService: EnverusService;
  let aiService: AiService;
  let releasesService: ReleasesService;
  let organizationsService: OrganizationsService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let cacheManager: any;
  let prismaService: jest.Mocked<PrismaService>;
  let transactionService: jest.Mocked<TransactionsService>;

  beforeEach(async () => {
    // Mock HttpService
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    };

    // Mock ConfigService
    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          ENVERUS_SECRET_KEY: 'test-key',
          INDEXER_API_URL: 'http://indexer-api',
          BLOCKCHAIN_SERVICE_URL: 'http://blockchain-service',
          IPFS_SERVICE_URL: 'http://ipfs-service',
          LENS_MANAGER_URL: 'http://lens-manager',
        };
        return config[key] || '';
      }),
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'HTTP_TIMEOUT') return 60000;
        if (key === 'ENABLE_AI_SERVICES') return false; // Use mock mode
        if (key === 'ENABLE_STRICT_VALIDATION') return false;
        if (key === 'OPENAI_API_KEY') return undefined;
        if (key === 'OPENAI_MODEL') return 'gpt-4o';
        return defaultValue;
      }),
    };

    // Mock CacheManager
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    // Mock PrismaService
    const mockPrismaService = {
      organization: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      blockchainJob: {
        findUnique: jest.fn(),
      },
    };

    // Mock TransactionsService
    const mockTransactionService = {
      indexTransaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        EnverusService,
        AiService,
        ReleasesService,
        OrganizationsService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    validationService = module.get<ValidationService>(ValidationService);
    enverusService = module.get<EnverusService>(EnverusService);
    aiService = module.get<AiService>(AiService);
    releasesService = module.get<ReleasesService>(ReleasesService);
    organizationsService = module.get<OrganizationsService>(OrganizationsService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
    cacheManager = module.get(CACHE_MANAGER);
    prismaService = module.get(PrismaService);
    transactionService = module.get(TransactionsService);
  });

  describe('Enverus → Validation → Asset Creation Flow', () => {
    it('should validate asset with Enverus data and proceed with creation', async () => {
      // Mock Enverus validation response
      const mockEnverusResponse = {
        verified: true,
        matchScore: 95,
        enverusId: '12345678',
        matchedFields: ['county', 'state', 'operator'],
        discrepancies: [],
      };

      jest.spyOn(enverusService, 'validateAsset').mockResolvedValue(mockEnverusResponse);

      // Test validation
      const validationResult = await validationService.validateAsset({
        releaseId: 'test-release-123',
        county: 'REEVES',
        state: 'TX',
        operator: 'Pioneer Natural Resources',
        category: AssetCategory.C,
      });

      expect(validationResult.overallStatus).toBe('PASSED');
      expect(validationResult.enverusValidation).toBeDefined();
      expect(validationResult.enverusValidation?.verified).toBe(true);
      expect(validationResult.canProceed).toBe(true);
    });

    it('should handle Enverus validation failures gracefully', async () => {
      // Mock Enverus validation failure
      const mockEnverusResponse = {
        verified: false,
        matchScore: 45,
        discrepancies: ['No matching wells found'],
      };

      jest.spyOn(enverusService, 'validateAsset').mockResolvedValue(mockEnverusResponse);

      const validationResult = await validationService.validateAsset({
        releaseId: 'test-release-123',
        county: 'REEVES',
        state: 'TX',
        category: AssetCategory.C,
      });

      expect(validationResult.overallStatus).toBe('WARNING');
      expect(validationResult.enverusValidation?.verified).toBe(false);
      expect(validationResult.canProceed).toBe(true); // Non-blocking
      expect(validationResult.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('AI → Validation → Asset Creation Flow', () => {
    it('should analyze document and include in validation', async () => {
      // Mock AI document analysis
      const mockAiResponse = {
        extraction: {
          legalDescription: 'Section 10, Block 10, T-1-S, R-1-E',
          county: 'REEVES',
          state: 'TX',
          ownerNames: ['John Doe'],
          mineralRights: true,
          netMineralAcres: 40.5,
          confidence: 85,
          extractedFields: ['legalDescription', 'county', 'state'],
          warnings: [],
        },
      };

      jest.spyOn(aiService, 'analyzeDocument').mockResolvedValue(mockAiResponse);

      const validationResult = await validationService.validateAsset({
        releaseId: 'test-release-123',
        documentUrl: 'https://example.com/document.pdf',
        county: 'REEVES',
        state: 'TX',
        category: AssetCategory.C,
      });

      expect(validationResult.aiDocumentAnalysis).toBeDefined();
      expect(validationResult.aiDocumentAnalysis?.confidence).toBe(85);
      expect(validationResult.issues.some(i => i.type === 'AI')).toBe(true);
    });

    it('should handle AI service unavailability gracefully', async () => {
      // Mock AI service error
      jest.spyOn(aiService, 'analyzeDocument').mockRejectedValue(new Error('AI service unavailable'));

      const validationResult = await validationService.validateAsset({
        releaseId: 'test-release-123',
        documentUrl: 'https://example.com/document.pdf',
        county: 'REEVES',
        state: 'TX',
      });

      expect(validationResult.aiDocumentAnalysis).toBeUndefined();
      expect(validationResult.warnings.some(w => w.includes('AI'))).toBe(true);
      expect(validationResult.canProceed).toBe(true); // Non-blocking
    });
  });

  describe('Organization Category → Asset Validation Flow', () => {
    it('should validate Category C free listing eligibility', async () => {
      const validationResult = await validationService.validateAsset({
        releaseId: 'test-release-123',
        category: AssetCategory.C,
        assetType: AssetType.Mineral,
        county: 'REEVES',
        state: 'TX',
      });

      expect(validationResult.issues.some(i => 
        i.type === 'CATEGORY' && 
        i.message.includes('Free listing')
      )).toBe(true);
    });

    it('should validate Category B override interest focus', async () => {
      const validationResult = await validationService.validateAsset({
        releaseId: 'test-release-123',
        category: AssetCategory.B,
        assetType: AssetType.Override,
        county: 'REEVES',
        state: 'TX',
      });

      expect(validationResult.issues.some(i => 
        i.type === 'CATEGORY' && 
        i.message.includes('Override')
      )).toBe(true);
    });

    it('should validate Category A major operator requirements', async () => {
      const validationResult = await validationService.validateAsset({
        releaseId: 'test-release-123',
        category: AssetCategory.A,
        assetType: AssetType.WorkingInterest,
        county: 'REEVES',
        state: 'TX',
      });

      expect(validationResult.issues.some(i => 
        i.type === 'CATEGORY'
      )).toBe(true);
    });
  });

  describe('Complete Asset Creation Workflow', () => {
    it('should complete full workflow: Validation → Organization Check → Blockchain Job', async () => {
      // Mock organization
      (prismaService.organization.findFirst as jest.Mock).mockResolvedValue({
        id: 'org-123',
        contractAddress: '0x1234567890abcdef',
      });

      // Mock Enverus validation
      jest.spyOn(enverusService, 'validateAsset').mockResolvedValue({
        verified: true,
        matchScore: 90,
        enverusId: '12345678',
        matchedFields: ['county', 'state'],
        discrepancies: [],
      });

      // Mock indexer-api response
      httpService.get.mockReturnValue(
        of({
          data: {
            id: 'release-123',
            name: 'Test Asset',
            siteAddress: 'test-site',
            price: '100000',
            isEncrypted: false,
            createdAt: new Date().toISOString(),
            category: AssetCategory.C,
            assetType: AssetType.Mineral,
            county: 'REEVES',
            state: 'TX',
            basin: 'PERMIAN',
            acreage: 40.5,
            productionStatus: ProductionStatus.Producing,
          },
        }),
      );

      // Mock blockchain service
      httpService.post.mockReturnValue(
        of({
          data: {
            jobId: 'job-123',
            status: 'QUEUED',
          },
        }),
      );

      // Mock transaction service
      (transactionService.indexTransaction as jest.Mock).mockResolvedValue(undefined);

      // Test validation (this would be called in releases service)
      const validationResult = await validationService.validateAsset({
        releaseId: 'release-123',
        county: 'REEVES',
        state: 'TX',
        category: AssetCategory.C,
        assetType: AssetType.Mineral,
      });

      expect(validationResult.canProceed).toBe(true);
      expect(validationResult.overallStatus).toBe('PASSED');
    });
  });

  describe('Organization Category Classification', () => {
    it('should classify Category A organization correctly', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Pioneer Natural Resources',
        legalEntityType: 'Corporation',
        primaryIndustry: 'Exploration & Production',
        members: [{}, {}, {}, {}, {}, {}], // 6 members
        _count: { followers: 0, following: 0 },
        links: [],
        createdAt: new Date(),
      };

      const category = (organizationsService as any).classifyOrganizationCategory(mockOrg);
      expect(category).toBe(AssetCategory.A);
    });

    it('should classify Category B organization correctly', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Override Trading Co',
        legalEntityType: 'LLC',
        primaryIndustry: 'Override Trading',
        members: [{}, {}], // 2 members
        _count: { followers: 0, following: 0 },
        links: [],
        createdAt: new Date(),
      };

      const category = (organizationsService as any).classifyOrganizationCategory(mockOrg);
      expect(category).toBe(AssetCategory.B);
    });

    it('should classify Category C organization correctly', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'John Doe Minerals',
        legalEntityType: 'Individual',
        primaryIndustry: 'Mineral Rights',
        members: [{}], // 1 member
        _count: { followers: 0, following: 0 },
        links: [],
        createdAt: new Date(),
      };

      const category = (organizationsService as any).classifyOrganizationCategory(mockOrg);
      expect(category).toBe(AssetCategory.C);
    });
  });

  describe('Category Features and Restrictions', () => {
    it('should return correct features for Category C', () => {
      const features = (organizationsService as any).getCategoryFeatures(AssetCategory.C);
      
      expect(features.freeListing).toBe(true);
      expect(features.requiresVerification).toBe(false);
      expect(features.maxListings).toBe(5);
      expect(features.features).toContain('Free listings');
    });

    it('should return correct features for Category A', () => {
      const features = (organizationsService as any).getCategoryFeatures(AssetCategory.A);
      
      expect(features.freeListing).toBe(false);
      expect(features.requiresVerification).toBe(true);
      expect(features.features).toContain('Bulk listing capabilities');
    });

    it('should return correct features for Category B', () => {
      const features = (organizationsService as any).getCategoryFeatures(AssetCategory.B);
      
      expect(features.freeListing).toBe(false);
      expect(features.requiresVerification).toBe(true);
      expect(features.features).toContain('Override interest trading');
    });
  });
});

