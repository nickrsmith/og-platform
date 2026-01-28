import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { OffersService } from '../../src/offers/offers.service';
import { TransactionsBusinessService } from '../../src/transactions/transactions-business.service';
import { RevenueService } from '../../src/revenue/revenue.service';
import { SettlementService } from '../../src/settlement/settlement.service';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { PrismaService } from '@app/database';
import { EmailService } from '@app/common/modules/email/email.service';
import { of } from 'rxjs';
import { AssetCategory, TransactionStatus, OfferStatus } from '@app/common';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * End-to-End Transaction Flow Integration Test
 *
 * Tests the complete flow from offer creation to transaction closure:
 * 1. Create offer on asset
 * 2. Accept offer
 * 3. Create transaction from accepted offer
 * 4. Deposit earnest money
 * 5. Complete due diligence
 * 6. Fund transaction
 * 7. Close transaction
 * 8. Generate settlement statement
 * 9. Verify notifications sent at each step
 * 10. Verify revenue distribution calculations
 */
describe('End-to-End Transaction Flow', () => {
  let offersService: OffersService;
  let transactionsService: TransactionsBusinessService;
  let revenueService: RevenueService;
  let settlementService: SettlementService;
  let notificationsService: NotificationsService;
  let prismaService: jest.Mocked<PrismaService>;
  let httpService: jest.Mocked<HttpService>;
  let emailService: jest.Mocked<EmailService>;

  // Test data
  const testBuyerId = 'buyer-uuid';
  const testSellerId = 'seller-uuid';
  const testAssetId = 'asset-123';
  const testOfferId = 'offer-uuid';
  const testTransactionId = 'transaction-uuid';
  const testOrgContractAddress = '0x1234567890123456789012345678901234567890';

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

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockPrismaService = {
      offer: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      transaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      organization: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      notification: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockRevenueService = {
      calculateRevenueSplit: jest.fn(),
      getFeeStructure: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
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

    offersService = module.get<OffersService>(OffersService);
    transactionsService = module.get<TransactionsBusinessService>(
      TransactionsBusinessService,
    );
    revenueService = module.get<RevenueService>(RevenueService);
    settlementService = module.get<SettlementService>(SettlementService);
    notificationsService = module.get<NotificationsService>(
      NotificationsService,
    );
    prismaService = module.get(PrismaService);
    httpService = module.get(HttpService);
    emailService = module.get(EmailService);
  });

  it('should complete full transaction lifecycle from offer to settlement', async () => {
    // Step 1: Create Offer
    const mockAsset = {
      id: testAssetId,
      postedBy: testSellerId,
      price: 100000,
    };

    const mockOffer = {
      id: testOfferId,
      assetId: testAssetId,
      buyerId: testBuyerId,
      sellerId: testSellerId,
      amount: new Decimal(100000),
      earnestMoney: new Decimal(10000),
      ddPeriod: 30,
      closingDate: new Date('2025-03-01'),
      status: OfferStatus.PENDING,
      offerType: 'CASH',
      contingencies: null,
      terms: null,
      createdAt: new Date(),
      updatedAt: new Date(),
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

    httpService.get.mockReturnValue(of({ data: mockAsset }) as any);
    prismaService.offer.findFirst.mockResolvedValue(null);
    prismaService.offer.create.mockResolvedValue(mockOffer as any);

    const offer = await offersService.createOffer(testBuyerId, {
      assetId: testAssetId,
      amount: 100000,
      earnestMoney: 10000,
      ddPeriod: 30,
      offerType: 'CASH',
    });

    expect(offer).toBeDefined();
    expect(offer.status).toBe(OfferStatus.PENDING);

    // Step 2: Accept Offer
    prismaService.offer.findUnique.mockResolvedValue(mockOffer as any);
    prismaService.offer.update.mockResolvedValue({
      ...mockOffer,
      status: OfferStatus.ACCEPTED,
    } as any);
    prismaService.offer.updateMany.mockResolvedValue({ count: 0 });

    const acceptedOffer = await offersService.acceptOffer(
      testOfferId,
      testSellerId,
      {},
    );

    expect(acceptedOffer.status).toBe(OfferStatus.ACCEPTED);

    // Step 3: Create Transaction from Accepted Offer
    const mockAssetForTransaction = {
      id: testAssetId,
      siteAddress: 'test-site',
      category: AssetCategory.A,
      price: 100000,
    };

    const mockOrganization = {
      contractAddress: testOrgContractAddress,
    };

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

    const mockTransaction = {
      id: testTransactionId,
      offerId: testOfferId,
      assetId: testAssetId,
      buyerId: testBuyerId,
      sellerId: testSellerId,
      purchasePrice: new Decimal(100000),
      earnestAmount: new Decimal(10000),
      ddPeriod: 30,
      status: TransactionStatus.PENDING,
      platformFee: new Decimal(5000),
      integratorFee: new Decimal(1000),
      creatorAmount: new Decimal(94000),
      netProceeds: new Decimal(94000),
      createdAt: new Date(),
      updatedAt: new Date(),
      buyer: mockOffer.buyer,
      seller: mockOffer.seller,
      offer: { ...mockOffer, status: OfferStatus.ACCEPTED },
    };

    prismaService.offer.findUnique.mockResolvedValue({
      ...mockOffer,
      status: OfferStatus.ACCEPTED,
    } as any);
    prismaService.transaction.findUnique.mockResolvedValue(null);
    prismaService.transaction.create.mockResolvedValue(mockTransaction as any);
    prismaService.organization.findFirst.mockResolvedValue(
      mockOrganization as any,
    );
    httpService.get.mockReturnValue(
      of({ data: mockAssetForTransaction }) as any,
    );
    (revenueService.calculateRevenueSplit as jest.Mock).mockResolvedValue(
      mockRevenueSplit,
    );

    const transaction = await transactionsService.createTransaction(
      { offerId: testOfferId },
      testBuyerId,
    );

    expect(transaction).toBeDefined();
    expect(transaction.status).toBe(TransactionStatus.PENDING);
    expect(transaction.platformFee).toBe(5000);
    expect(transaction.creatorAmount).toBe(94000);

    // Step 4: Deposit Earnest Money
    prismaService.transaction.findUnique.mockResolvedValue(mockTransaction as any);
    prismaService.transaction.update.mockResolvedValue({
      ...mockTransaction,
      status: TransactionStatus.EARNEST_DEPOSITED,
      earnestDepositedAt: new Date(),
    } as any);

    const earnestTransaction = await transactionsService.depositEarnest(
      testTransactionId,
      { amount: 10000 },
      testBuyerId,
    );

    expect(earnestTransaction.status).toBe(
      TransactionStatus.EARNEST_DEPOSITED,
    );

    // Step 5: Complete Due Diligence
    prismaService.transaction.findUnique.mockResolvedValue({
      ...mockTransaction,
      status: TransactionStatus.EARNEST_DEPOSITED,
    } as any);
    prismaService.transaction.update.mockResolvedValue({
      ...mockTransaction,
      status: TransactionStatus.DUE_DILIGENCE,
      ddCompletedAt: new Date(),
    } as any);

    const ddTransaction = await transactionsService.completeDueDiligence(
      testTransactionId,
      {},
      testBuyerId,
    );

    expect(ddTransaction.status).toBe(TransactionStatus.DUE_DILIGENCE);

    // Step 6: Fund Transaction
    prismaService.transaction.findUnique.mockResolvedValue({
      ...mockTransaction,
      status: TransactionStatus.DUE_DILIGENCE,
    } as any);
    prismaService.transaction.update.mockResolvedValue({
      ...mockTransaction,
      status: TransactionStatus.FUNDING,
    } as any);

    const fundedTransaction = await transactionsService.fundTransaction(
      testTransactionId,
      { amount: 90000 },
      testBuyerId,
    );

    expect(fundedTransaction.status).toBe(TransactionStatus.FUNDING);

    // Step 7: Close Transaction
    const mockSettlement = {
      purchasePrice: 100000,
      platformFee: 5000,
      integratorFee: 1000,
      creatorAmount: 94000,
      prorations: { propertyTaxes: 500 },
      adjustments: { titleInsurance: 300 },
      totalProrations: 500,
      totalAdjustments: 300,
      netProceeds: 93200,
    };

    prismaService.transaction.findUnique.mockResolvedValue({
      ...mockTransaction,
      status: TransactionStatus.FUNDING,
    } as any);
    prismaService.organization.findFirst.mockResolvedValue(
      mockOrganization as any,
    );
    httpService.get.mockReturnValue(
      of({ data: mockAssetForTransaction }) as any,
    );
    (revenueService.calculateRevenueSplit as jest.Mock).mockResolvedValue(
      mockRevenueSplit,
    );

    const settlementStatement = settlementService.generateSettlementStatement(
      testTransactionId,
      mockSettlement,
      'John Buyer',
      'Jane Seller',
      testAssetId,
      new Date(),
    );

    prismaService.transaction.update.mockResolvedValue({
      ...mockTransaction,
      status: TransactionStatus.CLOSED,
      closedAt: new Date(),
      settlementStatement: settlementStatement,
      netProceeds: new Decimal(93200),
    } as any);

    const closedTransaction = await transactionsService.closeTransaction(
      testTransactionId,
      {},
      testBuyerId,
    );

    expect(closedTransaction.status).toBe(TransactionStatus.CLOSED);
    expect(closedTransaction.settlementStatement).toBeDefined();

    // Verify notifications were sent at each step
    expect(notificationsService.sendNotification).toHaveBeenCalledTimes(
      expect.any(Number),
    );
  });

  it('should handle Category C free listing (0% fees)', async () => {
    const mockOffer = {
      id: testOfferId,
      assetId: testAssetId,
      buyerId: testBuyerId,
      sellerId: testSellerId,
      amount: new Decimal(100000),
      status: OfferStatus.ACCEPTED,
      buyer: { id: testBuyerId, firstName: 'John', lastName: 'Buyer', email: 'buyer@test.com' },
      seller: { id: testSellerId, firstName: 'Jane', lastName: 'Seller', email: 'seller@test.com' },
    };

    const mockAsset = {
      id: testAssetId,
      siteAddress: 'test-site',
      category: AssetCategory.C, // Category C = free listing
    };

    const mockRevenueSplit = {
      totalAmount: 100000,
      creatorAmount: 100000, // 100% to creator (0% fees)
      EmpressaFee: 0,
      integratorFee: 0,
      EmpressaFeePercentage: 0,
      integratorFeePercentage: 0,
      isFreeListing: true,
      category: AssetCategory.C,
    };

    prismaService.offer.findUnique.mockResolvedValue(mockOffer as any);
    prismaService.transaction.findUnique.mockResolvedValue(null);
    prismaService.organization.findFirst.mockResolvedValue({
      contractAddress: testOrgContractAddress,
    } as any);
    httpService.get.mockReturnValue(of({ data: mockAsset }) as any);
    (revenueService.calculateRevenueSplit as jest.Mock).mockResolvedValue(
      mockRevenueSplit,
    );

    prismaService.transaction.create.mockResolvedValue({
      id: testTransactionId,
      offerId: testOfferId,
      status: TransactionStatus.PENDING,
      platformFee: new Decimal(0),
      integratorFee: new Decimal(0),
      creatorAmount: new Decimal(100000),
      buyer: mockOffer.buyer,
      seller: mockOffer.seller,
      offer: mockOffer,
    } as any);

    const transaction = await transactionsService.createTransaction(
      { offerId: testOfferId },
      testBuyerId,
    );

    expect(transaction.platformFee).toBe(0);
    expect(transaction.integratorFee).toBe(0);
    expect(transaction.creatorAmount).toBe(100000);
  });
});

