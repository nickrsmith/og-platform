import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RevenueService } from '../../src/revenue/revenue.service';
import { PrismaService } from '@app/database';
import { of } from 'rxjs';
import { AssetCategory } from '@app/common';

/**
 * Revenue Distribution Integration Tests
 *
 * Tests revenue distribution calculations:
 * - Fee structure reading from smart contracts
 * - Revenue split calculations
 * - Category C free listing (0% fees)
 * - Custom organization fees
 * - Revenue statistics tracking
 */
describe('Revenue Distribution Integration', () => {
  let revenueService: RevenueService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let prismaService: jest.Mocked<PrismaService>;

  const testOrgContractAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
    };

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          BLOCKCHAIN_SERVICE_URL: 'http://blockchain-service',
        };
        return config[key] || '';
      }),
    };

    const mockPrismaService = {
      organization: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueService,
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
      ],
    }).compile();

    revenueService = module.get<RevenueService>(RevenueService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
    prismaService = module.get(PrismaService);
  });

  describe('Revenue Split Calculation', () => {
    it('should calculate revenue split for Category A asset', async () => {
      // Mock fee structure from blockchain service
      httpService.get.mockReturnValue(
        of({
          data: {
            empressaFeePct: '500',
            integratorFeePct: '100',
            hasCustomFees: false,
          },
        }),
      );

      const result = await revenueService.calculateRevenueSplit({
        amount: 100000,
        category: AssetCategory.A,
        orgContractAddress: testOrgContractAddress,
        assetOwnerAddress: '0xowner',
      });

      expect(result.totalAmount).toBe(100000);
      expect(result.empressaFeePercentage).toBe(500); // 5%
      expect(result.integratorFeePercentage).toBe(100); // 1%
      expect(result.isFreeListing).toBe(false);
      expect(result.creatorAmount).toBeGreaterThan(0);
      expect(result.creatorAmount).toBeLessThan(100000);
    });

    it('should calculate revenue split for Category C (free listing)', async () => {
      const result = await revenueService.calculateRevenueSplit({
        amount: 100000,
        category: AssetCategory.C,
        orgContractAddress: testOrgContractAddress,
        assetOwnerAddress: '0xowner',
      });

      expect(result.totalAmount).toBe(100000);
      expect(result.creatorAmount).toBe(100000); // 100% to creator
      expect(result.empressaFee).toBe(0);
      expect(result.integratorFee).toBe(0);
      expect(result.empressaFeePercentage).toBe(0);
      expect(result.integratorFeePercentage).toBe(0);
      expect(result.isFreeListing).toBe(true);
    });

    it('should handle custom organization fees', async () => {
      // Mock custom fees
      httpService.get.mockReturnValue(
        of({
          data: {
            empressaFeePct: '300', // 3% custom
            integratorFeePct: '50', // 0.5% custom
            hasCustomFees: true,
          },
        }),
      );

      const result = await revenueService.calculateRevenueSplit({
        amount: 100000,
        category: AssetCategory.A,
        orgContractAddress: testOrgContractAddress,
        assetOwnerAddress: '0xowner',
      });

      expect(result.empressaFeePercentage).toBe(300);
      expect(result.integratorFeePercentage).toBe(50);
    });

    it('should fallback to default fees if contract unavailable', async () => {
      // Mock error from blockchain service
      httpService.get.mockReturnValue(
        of({
          data: null,
        }).pipe(() => {
          throw new Error('Service unavailable');
        }),
      );

      const result = await revenueService.calculateRevenueSplit({
        amount: 100000,
        category: AssetCategory.A,
        orgContractAddress: testOrgContractAddress,
        assetOwnerAddress: '0xowner',
      });

      // Should use default fees (5% Empressa, 1% Integrator)
      expect(result.empressaFeePercentage).toBe(500);
      expect(result.integratorFeePercentage).toBe(100);
    });
  });

  describe('Fee Structure Retrieval', () => {
    it('should get fee structure from smart contract', async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            empressaFeePct: '500',
            integratorFeePct: '100',
            hasCustomFees: false,
          },
        }),
      );

      const feeStructure = await revenueService.getFeeStructure(
        testOrgContractAddress,
      );

      expect(feeStructure.orgContractAddress).toBe(testOrgContractAddress);
      expect(feeStructure.empressaFeePercentage).toBe(500);
      expect(feeStructure.integratorFeePercentage).toBe(100);
      expect(feeStructure.hasCustomFees).toBe(false);
    });
  });

  describe('Revenue Statistics', () => {
    it('should get revenue statistics from smart contract', async () => {
      // Mock revenue stats
      httpService.get
        .mockReturnValueOnce(
          of({
            data: {
              total: '1000000',
              creatorTotal: '940000',
              empressaTotal: '50000',
              integratorTotal: '10000',
            },
          }),
        )
        .mockReturnValueOnce(
          of({
            data: {
              pendingEmpressa: '5000',
              pendingIntegrator: '1000',
              pendingCreators: '10000',
              distributedEmpressa: '45000',
              distributedIntegrator: '9000',
              distributedCreators: '930000',
            },
          }),
        );

      const stats = await revenueService.getRevenueStats(
        testOrgContractAddress,
      );

      expect(stats.totalRevenue).toBe(1000000);
      expect(stats.creatorRevenue).toBe(940000);
      expect(stats.empressaRevenue).toBe(50000);
      expect(stats.integratorRevenue).toBe(10000);
      expect(stats.pendingCreatorEarnings).toBe(10000);
    });
  });

  describe('Organization Earnings', () => {
    it('should get organization earnings', async () => {
      const testOrgId = 'org-uuid';

      prismaService.organization.findUnique.mockResolvedValue({
        id: testOrgId,
        contractAddress: testOrgContractAddress,
      } as any);

      httpService.get.mockReturnValue(
        of({
          data: {
            pendingEmpressa: '5000',
            pendingIntegrator: '1000',
            pendingCreators: '10000',
            distributedEmpressa: '45000',
            distributedIntegrator: '9000',
            distributedCreators: '930000',
          },
        }),
      );

      const earnings = await revenueService.getOrganizationEarnings(
        testOrgId,
      );

      expect(earnings.organizationId).toBe(testOrgId);
      expect(earnings.pendingTotal).toBe(16000); // 5000 + 1000 + 10000
      expect(earnings.distributedTotal).toBe(984000); // 45000 + 9000 + 930000
    });
  });
});

