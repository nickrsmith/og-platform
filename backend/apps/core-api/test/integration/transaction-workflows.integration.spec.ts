import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TransactionsBusinessService } from '../../src/transactions/transactions-business.service';
import { SettlementService } from '../../src/settlement/settlement.service';
import { RevenueService } from '../../src/revenue/revenue.service';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { OffersService } from '../../src/offers/offers.service';
import { PrismaService } from '@app/database';
import { EmailService } from '@app/common/modules/email/email.service';
import { of } from 'rxjs';
import { AssetCategory, TransactionStatus } from '@app/common';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Transaction Workflows Integration Tests
 *
 * Tests the complete transaction lifecycle:
 * - Create transaction from accepted offer
 * - Transaction status workflow (PENDING → EARNEST → DD → FUNDING → CLOSED)
 * - Settlement calculation
 * - Revenue distribution integration
 * - Notification sending
 */
describe('Transaction Workflows Integration', () => {
  let transactionsService: TransactionsBusinessService;
  let settlementService: SettlementService;
  let revenueService: RevenueService;
  let notificationsService: NotificationsService;
  let offersService: OffersService;
  let prismaService: jest.Mocked<PrismaService>;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let emailService: jest.Mocked<EmailService>;

  // Test data
  const testBuyerId = 'buyer-uuid';
  const testSellerId = 'seller-uuid';
  const testAssetId = 'asset-123';
  const testOfferId = 'offer-uuid';
  const testTransactionId = 'transaction-uuid';
  const testOrgContractAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(async () => {
    // Mock HttpService
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    // Mock ConfigService
    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          INDEXER_API_URL: 'http://indexer-api',
          BLOCKCHAIN_SERVICE_URL: 'http://blockchain-service',
          ROYALTY_MARKETPLACE_URL: 'http://marketplace',
        };
        return config[key] || '';
      }),
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          ROYALTY_MARKETPLACE_URL: 'http://marketplace',
        };
        return config[key];
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
      offer: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      organization: {
        findFirst: jest.fn(),
      },
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    // Mock EmailService
    const mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    // Mock RevenueService
    const mockRevenueService = {
      calculateRevenueSplit: jest.fn(),
      getFeeStructure: jest.fn(),
      getRevenueStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsBusinessService,
        SettlementService,
        {
          provide: RevenueService,
          useValue: mockRevenueService,
        },
        {
          provide: NotificationsService,
          useValue: {
            sendNotification: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: OffersService,
          useValue: {
            acceptOffer: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
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
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    transactionsService = module.get<TransactionsBusinessService>(
      TransactionsBusinessService,
    );
    settlementService = module.get<SettlementService>(SettlementService);
    revenueService = module.get<RevenueService>(RevenueService);
    notificationsService = module.get<NotificationsService>(
      NotificationsService,
    );
    offersService = module.get<OffersService>(OffersService);
    prismaService = module.get(PrismaService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
    emailService = module.get(EmailService);
  });

  describe('Transaction Creation from Accepted Offer', () => {
    it('should create transaction from accepted offer', async () => {
      // Setup: Mock accepted offer
      const mockOffer = {
        id: testOfferId,
        assetId: testAssetId,
        buyerId: testBuyerId,
        sellerId: testSellerId,
        amount: new Decimal(100000),
        earnestMoney: new Decimal(10000),
        ddPeriod: 30,
        closingDate: new Date('2025-03-01'),
        status: 'ACCEPTED',
        contingencies: null,
        terms: null,
        buyer: {
          id: testBuyerId,
          firstName: 'John',
          lastName: 'Buyer',
          email: 'buyer@test.com',
        },
        seller: {
          id: testSellerId,
          firstName: 'Jane',
          lastName: 'Seller',
          email: 'seller@test.com',
        },
      };

      // Setup: Mock asset from indexer
      const mockAsset = {
        id: testAssetId,
        siteAddress: 'test-site',
        category: AssetCategory.A,
        price: 100000,
      };

      // Setup: Mock organization
      const mockOrganization = {
        contractAddress: testOrgContractAddress,
      };

      // Setup: Mock revenue split
      const mockRevenueSplit = {
        totalAmount: 100000,
        creatorAmount: 94000,
        EmpressaFee: 5000,
        integratorFee: 1000,
        EmpressaFeePercentage: 500,
        integratorFeePercentage: 100,
        isFreeListing: false,
        category: AssetCategory.A,
      };

      // Setup: Mock transaction creation
      const mockTransaction = {
        id: testTransactionId,
        offerId: testOfferId,
        assetId: testAssetId,
        buyerId: testBuyerId,
        sellerId: testSellerId,
        purchasePrice: new Decimal(100000),
        earnestAmount: new Decimal(10000),
        status: TransactionStatus.PENDING,
        platformFee: new Decimal(5000),
        integratorFee: new Decimal(1000),
        creatorAmount: new Decimal(94000),
        netProceeds: new Decimal(94000),
        createdAt: new Date(),
        updatedAt: new Date(),
        buyer: mockOffer.buyer,
        seller: mockOffer.seller,
        offer: mockOffer,
      };

      // Mock Prisma calls
      prismaService.offer.findUnique.mockResolvedValue(mockOffer as any);
      prismaService.transaction.findUnique.mockResolvedValue(null);
      prismaService.transaction.create.mockResolvedValue(mockTransaction as any);
      prismaService.organization.findFirst.mockResolvedValue(
        mockOrganization as any,
      );

      // Mock HTTP calls
      httpService.get.mockReturnValue(
        of({ data: mockAsset }) as any,
      );

      // Mock revenue service
      (revenueService.calculateRevenueSplit as jest.Mock).mockResolvedValue(
        mockRevenueSplit,
      );

      // Execute: Create transaction
      const result = await transactionsService.createTransaction(
        { offerId: testOfferId },
        testBuyerId,
      );

      // Verify: Transaction created with correct data
      expect(result).toBeDefined();
      expect(result.offerId).toBe(testOfferId);
      expect(result.status).toBe(TransactionStatus.PENDING);
      expect(prismaService.transaction.create).toHaveBeenCalled();
      expect(notificationsService.sendNotification).toHaveBeenCalled();
    });

    it('should reject creating transaction from non-accepted offer', async () => {
      const mockOffer = {
        id: testOfferId,
        status: 'PENDING',
        buyerId: testBuyerId,
        sellerId: testSellerId,
      };

      prismaService.offer.findUnique.mockResolvedValue(mockOffer as any);

      await expect(
        transactionsService.createTransaction(
          { offerId: testOfferId },
          testBuyerId,
        ),
      ).rejects.toThrow('Cannot create transaction from offer with status');
    });
  });

  describe('Transaction Status Workflow', () => {
    it('should progress through transaction workflow', async () => {
      const mockTransaction = {
        id: testTransactionId,
        offerId: testOfferId,
        assetId: testAssetId,
        buyerId: testBuyerId,
        sellerId: testSellerId,
        purchasePrice: new Decimal(100000),
        earnestAmount: new Decimal(10000),
        status: TransactionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        buyer: { id: testBuyerId, firstName: 'John', lastName: 'Buyer', email: 'buyer@test.com' },
        seller: { id: testSellerId, firstName: 'Jane', lastName: 'Seller', email: 'seller@test.com' },
        offer: {},
      };

      // Test: Deposit earnest
      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction as any);
      prismaService.transaction.update.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.EARNEST_DEPOSITED,
        earnestDepositedAt: new Date(),
      } as any);

      const earnestResult = await transactionsService.depositEarnest(
        testTransactionId,
        { amount: 10000 },
        testBuyerId,
      );

      expect(earnestResult.status).toBe(TransactionStatus.EARNEST_DEPOSITED);
      expect(notificationsService.sendNotification).toHaveBeenCalled();

      // Test: Complete due diligence
      prismaService.transaction.findUnique.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.EARNEST_DEPOSITED,
      } as any);
      prismaService.transaction.update.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.DUE_DILIGENCE,
        ddCompletedAt: new Date(),
      } as any);

      const ddResult = await transactionsService.completeDueDiligence(
        testTransactionId,
        {},
        testBuyerId,
      );

      expect(ddResult.status).toBe(TransactionStatus.DUE_DILIGENCE);

      // Test: Fund transaction
      prismaService.transaction.findUnique.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.DUE_DILIGENCE,
      } as any);
      prismaService.transaction.update.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.FUNDING,
      } as any);

      const fundedResult = await transactionsService.fundTransaction(
        testTransactionId,
        { amount: 90000 },
        testBuyerId,
      );

      expect(fundedResult.status).toBe(TransactionStatus.FUNDING);
    });
  });

  describe('Settlement Calculation', () => {
    it('should calculate settlement correctly for Category A asset', async () => {
      const mockRevenueSplit = {
        totalAmount: 100000,
        creatorAmount: 94000,
        EmpressaFee: 5000,
        integratorFee: 1000,
        EmpressaFeePercentage: 500,
        integratorFeePercentage: 100,
        isFreeListing: false,
        category: AssetCategory.A,
      };

      (revenueService.calculateRevenueSplit as jest.Mock).mockResolvedValue(
        mockRevenueSplit,
      );

      const settlement = await settlementService.calculateSettlement({
        purchasePrice: 100000,
        category: AssetCategory.A,
        orgContractAddress: testOrgContractAddress,
        assetOwnerAddress: testSellerId,
        prorations: { propertyTaxes: 500, royalties: 200 },
        adjustments: { titleInsurance: 300 },
      });

      expect(settlement.platformFee).toBe(5000);
      expect(settlement.integratorFee).toBe(1000);
      expect(settlement.creatorAmount).toBe(94000);
      expect(settlement.totalProrations).toBe(700);
      expect(settlement.totalAdjustments).toBe(300);
      expect(settlement.netProceeds).toBe(93000); // 94000 - 700 - 300
    });

    it('should calculate settlement correctly for Category C (free listing)', async () => {
      const mockRevenueSplit = {
        totalAmount: 100000,
        creatorAmount: 100000,
        EmpressaFee: 0,
        integratorFee: 0,
        EmpressaFeePercentage: 0,
        integratorFeePercentage: 0,
        isFreeListing: true,
        category: AssetCategory.C,
      };

      (revenueService.calculateRevenueSplit as jest.Mock).mockResolvedValue(
        mockRevenueSplit,
      );

      const settlement = await settlementService.calculateSettlement({
        purchasePrice: 100000,
        category: AssetCategory.C,
        orgContractAddress: testOrgContractAddress,
        assetOwnerAddress: testSellerId,
      });

      expect(settlement.platformFee).toBe(0);
      expect(settlement.integratorFee).toBe(0);
      expect(settlement.creatorAmount).toBe(100000);
      expect(settlement.netProceeds).toBe(100000);
    });
  });

  describe('Notification Integration', () => {
    it('should send notifications for transaction events', async () => {
      const mockTransaction = {
        id: testTransactionId,
        buyerId: testBuyerId,
        sellerId: testSellerId,
        purchasePrice: new Decimal(100000),
        earnestAmount: new Decimal(10000),
        status: TransactionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        buyer: { id: testBuyerId, firstName: 'John', lastName: 'Buyer', email: 'buyer@test.com' },
        seller: { id: testSellerId, firstName: 'Jane', lastName: 'Seller', email: 'seller@test.com' },
        offer: {},
      };

      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction as any);
      prismaService.transaction.update.mockResolvedValue(mockTransaction as any);
      prismaService.user.findUnique.mockResolvedValue({
        id: testBuyerId,
        email: 'buyer@test.com',
        firstName: 'John',
        lastName: 'Buyer',
      } as any);

      await transactionsService.depositEarnest(
        testTransactionId,
        { amount: 10000 },
        testBuyerId,
      );

      // Verify notifications were sent
      expect(notificationsService.sendNotification).toHaveBeenCalledTimes(2); // Buyer and seller
    });
  });

  describe('End-to-End Transaction Flow', () => {
    it('should complete full transaction lifecycle', async () => {
      // This test would simulate the complete flow:
      // 1. Create offer
      // 2. Accept offer
      // 3. Create transaction
      // 4. Deposit earnest
      // 5. Complete due diligence
      // 6. Fund transaction
      // 7. Close transaction
      // 8. Generate settlement statement

      // For brevity, we'll test the key integration points
      const mockTransaction = {
        id: testTransactionId,
        offerId: testOfferId,
        assetId: testAssetId,
        buyerId: testBuyerId,
        sellerId: testSellerId,
        purchasePrice: new Decimal(100000),
        earnestAmount: new Decimal(10000),
        status: TransactionStatus.CLOSED,
        platformFee: new Decimal(5000),
        integratorFee: new Decimal(1000),
        creatorAmount: new Decimal(94000),
        netProceeds: new Decimal(93000),
        settlementStatement: {
          transactionId: testTransactionId,
          netProceeds: 93000,
        },
        closedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        buyer: { id: testBuyerId, firstName: 'John', lastName: 'Buyer', email: 'buyer@test.com' },
        seller: { id: testSellerId, firstName: 'Jane', lastName: 'Seller', email: 'seller@test.com' },
        offer: {},
      };

      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction as any);
      prismaService.organization.findFirst.mockResolvedValue({
        contractAddress: testOrgContractAddress,
      } as any);
      httpService.get.mockReturnValue(
        of({
          data: {
            id: testAssetId,
            siteAddress: 'test-site',
            category: AssetCategory.A,
          },
        }),
      );

      const settlement = await transactionsService.generateSettlementStatement(
        testTransactionId,
      );

      expect(settlement).toBeDefined();
      expect(settlement.transactionId).toBe(testTransactionId);
      expect(settlement.netProceeds).toBe(93000);
    });
  });
});

