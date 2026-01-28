import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService, NotificationType } from '../../src/notifications/notifications.service';
import { EmailService } from '@app/common/modules/email/email.service';
import { PrismaService } from '@app/database';
import { AssetCategory } from '@app/common';

/**
 * Notification System Integration Tests
 *
 * Tests notification functionality:
 * - Notification creation and sending
 * - Email notification delivery
 * - Notification history tracking
 * - Multiple notification types
 */
describe('Notification System Integration', () => {
  let notificationsService: NotificationsService;
  let emailService: jest.Mocked<EmailService>;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  const testUserId = 'user-uuid';
  const testTransactionId = 'transaction-uuid';
  const testOfferId = 'offer-uuid';

  beforeEach(async () => {
    const mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockPrismaService = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    notificationsService = module.get<NotificationsService>(
      NotificationsService,
    );
    emailService = module.get(EmailService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  describe('Notification Sending', () => {
    it('should send transaction created notification', async () => {
      const mockNotification = {
        id: 'notification-uuid',
        userId: testUserId,
        type: NotificationType.TRANSACTION_CREATED,
        status: 'SENT',
        createdAt: new Date(),
      };

      const mockUser = {
        id: testUserId,
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
      };

      prismaService.notification.create.mockResolvedValue(
        mockNotification as any,
      );
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.notification.update.mockResolvedValue({
        ...mockNotification,
        sentAt: new Date(),
      } as any);

      await notificationsService.sendNotification({
        userId: testUserId,
        type: NotificationType.TRANSACTION_CREATED,
        transactionId: testTransactionId,
        metadata: {
          transactionId: testTransactionId,
          purchasePrice: 100000,
        },
      });

      expect(prismaService.notification.create).toHaveBeenCalled();
      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'user@test.com',
        expect.stringContaining('Transaction Created'),
        expect.any(String),
      );
    });

    it('should send offer accepted notification', async () => {
      const mockUser = {
        id: testUserId,
        email: 'buyer@test.com',
        firstName: 'Buyer',
        lastName: 'User',
      };

      prismaService.notification.create.mockResolvedValue({
        id: 'notification-uuid',
        userId: testUserId,
        type: NotificationType.OFFER_ACCEPTED,
        status: 'SENT',
      } as any);
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.notification.update.mockResolvedValue({} as any);

      await notificationsService.sendNotification({
        userId: testUserId,
        type: NotificationType.OFFER_ACCEPTED,
        offerId: testOfferId,
        metadata: {
          offerId: testOfferId,
          amount: 100000,
        },
      });

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'buyer@test.com',
        expect.stringContaining('Offer Has Been Accepted'),
        expect.any(String),
      );
    });

    it('should handle notification sending errors gracefully', async () => {
      const mockUser = {
        id: testUserId,
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
      };

      prismaService.notification.create.mockResolvedValue({
        id: 'notification-uuid',
        userId: testUserId,
        type: NotificationType.TRANSACTION_CREATED,
        status: 'PENDING',
      } as any);
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      emailService.sendEmail.mockRejectedValue(new Error('Email service error'));
      prismaService.notification.updateMany.mockResolvedValue({ count: 1 });

      // Should not throw, but log error
      await expect(
        notificationsService.sendNotification({
          userId: testUserId,
          type: NotificationType.TRANSACTION_CREATED,
          transactionId: testTransactionId,
        }),
      ).resolves.not.toThrow();

      expect(prismaService.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: testUserId,
            status: 'PENDING',
          }),
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        }),
      );
    });
  });

  describe('Notification History', () => {
    it('should retrieve user notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: testUserId,
          type: NotificationType.TRANSACTION_CREATED,
          status: 'SENT',
          createdAt: new Date(),
          transaction: {
            id: testTransactionId,
            status: 'PENDING',
            purchasePrice: new Decimal(100000),
          },
        },
        {
          id: 'notif-2',
          userId: testUserId,
          type: NotificationType.OFFER_ACCEPTED,
          status: 'READ',
          createdAt: new Date(),
          offer: {
            id: testOfferId,
            status: 'ACCEPTED',
            amount: new Decimal(100000),
          },
        },
      ];

      prismaService.notification.findMany.mockResolvedValue(
        mockNotifications as any,
      );

      const notifications = await notificationsService.getUserNotifications(
        testUserId,
        50,
      );

      expect(notifications).toHaveLength(2);
      expect(prismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: expect.any(Object),
      });
    });

    it('should mark notification as read', async () => {
      const notificationId = 'notification-uuid';

      prismaService.notification.updateMany.mockResolvedValue({ count: 1 });

      await notificationsService.markAsRead(notificationId, testUserId);

      expect(prismaService.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: notificationId,
          userId: testUserId,
        },
        data: {
          status: 'READ',
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('Email Content Generation', () => {
    it('should generate correct email content for transaction events', async () => {
      const mockUser = {
        id: testUserId,
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
      };

      prismaService.notification.create.mockResolvedValue({
        id: 'notification-uuid',
        userId: testUserId,
        type: NotificationType.TRANSACTION_CLOSED,
        status: 'SENT',
      } as any);
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.notification.update.mockResolvedValue({} as any);

      await notificationsService.sendNotification({
        userId: testUserId,
        type: NotificationType.TRANSACTION_CLOSED,
        transactionId: testTransactionId,
        metadata: {
          transactionId: testTransactionId,
          purchasePrice: 100000,
        },
      });

      const emailCall = emailService.sendEmail.mock.calls[0];
      const emailHtml = emailCall[2];

      expect(emailHtml).toContain('Transaction Closed Successfully');
      expect(emailHtml).toContain('Test User');
      expect(emailHtml).toContain(testTransactionId);
    });
  });
});

