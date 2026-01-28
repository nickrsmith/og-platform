import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { EmailService } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

export enum NotificationType {
  OFFER_CREATED = 'OFFER_CREATED',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_DECLINED = 'OFFER_DECLINED',
  OFFER_COUNTERED = 'OFFER_COUNTERED',
  OFFER_WITHDRAWN = 'OFFER_WITHDRAWN',
  OFFER_EXPIRED = 'OFFER_EXPIRED',
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_EARNEST_DEPOSITED = 'TRANSACTION_EARNEST_DEPOSITED',
  TRANSACTION_DUE_DILIGENCE_COMPLETE = 'TRANSACTION_DUE_DILIGENCE_COMPLETE',
  TRANSACTION_FUNDED = 'TRANSACTION_FUNDED',
  TRANSACTION_CLOSED = 'TRANSACTION_CLOSED',
  TRANSACTION_CANCELLED = 'TRANSACTION_CANCELLED',
  SETTLEMENT_STATEMENT_READY = 'SETTLEMENT_STATEMENT_READY',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  SMS = 'SMS',
}

interface NotificationData {
  userId: string;
  type: NotificationType;
  channel?: NotificationChannel;
  subject?: string;
  message?: string;
  metadata?: Record<string, any>;
  transactionId?: string;
  offerId?: string;
}

/**
 * Notification Service
 *
 * Handles sending notifications for transaction and offer events.
 * Integrates with EmailService for email notifications.
 * Stores notification history in database.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly marketplaceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.marketplaceUrl =
      this.configService.get<string>('ROYALTY_MARKETPLACE_URL') || '';
  }

  /**
   * Send notification (creates record and sends via appropriate channel)
   */
  async sendNotification(data: NotificationData): Promise<void> {
    this.logger.log(
      `Sending ${data.type} notification to user ${data.userId}`,
    );

    try {
      // Create notification record
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type as any,
          channel: (data.channel || NotificationChannel.EMAIL) as any,
          subject: data.subject || null,
          message: data.message || null,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          transactionId: data.transactionId || null,
          offerId: data.offerId || null,
          status: 'PENDING' as any,
        },
      });

      // Send via appropriate channel
      if (data.channel === NotificationChannel.EMAIL || !data.channel) {
        await this.sendEmailNotification(notification.id, data);
      }

      // Update status to SENT
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT' as any,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send ${data.type} notification to user ${data.userId}`,
        error,
      );
      // Update status to FAILED if notification record exists
      if (data.userId) {
        await this.prisma.notification
          .updateMany({
            where: {
              userId: data.userId,
              type: data.type as any,
              status: 'PENDING' as any,
            },
            data: {
              status: 'FAILED' as any,
              errorMessage: error instanceof Error ? error.message : String(error),
            },
          })
          .catch(() => {
            // Ignore update errors
          });
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    notificationId: string,
    data: NotificationData,
  ): Promise<void> {
    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user || !user.email) {
      throw new Error(`User ${data.userId} not found or has no email`);
    }

    // Generate email content based on notification type
    const emailContent = this.generateEmailContent(data, user);

    // Send email using EmailService
    // Note: We'll need to extend EmailService or use a generic send method
    // For now, we'll use a simple approach
    await this.sendEmail(
      user.email,
      emailContent.subject,
      emailContent.html,
    );
  }

  /**
   * Generate email content based on notification type
   */
  private generateEmailContent(
    data: NotificationData,
    user: { email: string; firstName: string | null; lastName: string | null },
  ): { subject: string; html: string } {
    const userName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email;

    switch (data.type) {
      case NotificationType.OFFER_CREATED:
        return {
          subject: `New Offer Received on Your Asset`,
          html: this.generateOfferCreatedEmail(data, userName),
        };

      case NotificationType.OFFER_ACCEPTED:
        return {
          subject: `Your Offer Has Been Accepted!`,
          html: this.generateOfferAcceptedEmail(data, userName),
        };

      case NotificationType.OFFER_DECLINED:
        return {
          subject: `Update on Your Offer`,
          html: this.generateOfferDeclinedEmail(data, userName),
        };

      case NotificationType.TRANSACTION_CREATED:
        return {
          subject: `Transaction Created - Next Steps`,
          html: this.generateTransactionCreatedEmail(data, userName),
        };

      case NotificationType.TRANSACTION_EARNEST_DEPOSITED:
        return {
          subject: `Earnest Money Deposited`,
          html: this.generateEarnestDepositedEmail(data, userName),
        };

      case NotificationType.TRANSACTION_DUE_DILIGENCE_COMPLETE:
        return {
          subject: `Due Diligence Complete`,
          html: this.generateDueDiligenceCompleteEmail(data, userName),
        };

      case NotificationType.TRANSACTION_FUNDED:
        return {
          subject: `Transaction Funded`,
          html: this.generateTransactionFundedEmail(data, userName),
        };

      case NotificationType.TRANSACTION_CLOSED:
        return {
          subject: `Transaction Closed Successfully`,
          html: this.generateTransactionClosedEmail(data, userName),
        };

      case NotificationType.SETTLEMENT_STATEMENT_READY:
        return {
          subject: `Settlement Statement Ready`,
          html: this.generateSettlementStatementEmail(data, userName),
        };

      default:
        return {
          subject: data.subject || 'Notification from Empressa Platform',
          html: data.message || '<p>You have a new notification.</p>',
        };
    }
  }

  /**
   * Send email using EmailService
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    await this.emailService.sendEmail(to, subject, html);
  }

  // Email template generators
  private generateOfferCreatedEmail(
    data: NotificationData,
    userName: string,
  ): string {
    const offerAmount = data.metadata?.amount
      ? `$${Number(data.metadata.amount).toLocaleString()}`
      : 'N/A';
    const assetId = data.metadata?.assetId || 'N/A';
    const offerLink = `${this.marketplaceUrl}/offers/${data.offerId}`;

    return `
      <h2>New Offer Received</h2>
      <p>Hello ${userName},</p>
      <p>You have received a new offer on your asset.</p>
      <p><strong>Offer Amount:</strong> ${offerAmount}</p>
      <p><strong>Asset ID:</strong> ${assetId}</p>
      <p><a href="${offerLink}">View Offer Details</a></p>
    `;
  }

  private generateOfferAcceptedEmail(
    data: NotificationData,
    userName: string,
  ): string {
    const offerAmount = data.metadata?.amount
      ? `$${Number(data.metadata.amount).toLocaleString()}`
      : 'N/A';
    const transactionLink = data.transactionId
      ? `${this.marketplaceUrl}/transactions/${data.transactionId}`
      : '#';

    return `
      <h2>Your Offer Has Been Accepted!</h2>
      <p>Hello ${userName},</p>
      <p>Congratulations! Your offer of ${offerAmount} has been accepted.</p>
      <p>A transaction has been created and you can proceed with the next steps.</p>
      <p><a href="${transactionLink}">View Transaction</a></p>
    `;
  }

  private generateOfferDeclinedEmail(
    data: NotificationData,
    userName: string,
  ): string {
    return `
      <h2>Update on Your Offer</h2>
      <p>Hello ${userName},</p>
      <p>Unfortunately, your offer has been declined by the seller.</p>
      <p>You can continue browsing other assets or make a new offer.</p>
    `;
  }

  private generateTransactionCreatedEmail(
    data: NotificationData,
    userName: string,
  ): string {
    const transactionLink = `${this.marketplaceUrl}/transactions/${data.transactionId}`;
    const purchasePrice = data.metadata?.purchasePrice
      ? `$${Number(data.metadata.purchasePrice).toLocaleString()}`
      : 'N/A';

    return `
      <h2>Transaction Created</h2>
      <p>Hello ${userName},</p>
      <p>A new transaction has been created from your accepted offer.</p>
      <p><strong>Purchase Price:</strong> ${purchasePrice}</p>
      <p>Next step: Deposit earnest money to proceed.</p>
      <p><a href="${transactionLink}">View Transaction</a></p>
    `;
  }

  private generateEarnestDepositedEmail(
    data: NotificationData,
    userName: string,
  ): string {
    const transactionLink = `${this.marketplaceUrl}/transactions/${data.transactionId}`;
    const earnestAmount = data.metadata?.earnestAmount
      ? `$${Number(data.metadata.earnestAmount).toLocaleString()}`
      : 'N/A';

    return `
      <h2>Earnest Money Deposited</h2>
      <p>Hello ${userName},</p>
      <p>Earnest money of ${earnestAmount} has been deposited for this transaction.</p>
      <p>The due diligence period has now begun.</p>
      <p><a href="${transactionLink}">View Transaction</a></p>
    `;
  }

  private generateDueDiligenceCompleteEmail(
    data: NotificationData,
    userName: string,
  ): string {
    const transactionLink = `${this.marketplaceUrl}/transactions/${data.transactionId}`;

    return `
      <h2>Due Diligence Complete</h2>
      <p>Hello ${userName},</p>
      <p>Due diligence has been completed for this transaction.</p>
      <p>Next step: Proceed with funding the transaction.</p>
      <p><a href="${transactionLink}">View Transaction</a></p>
    `;
  }

  private generateTransactionFundedEmail(
    data: NotificationData,
    userName: string,
  ): string {
    const transactionLink = `${this.marketplaceUrl}/transactions/${data.transactionId}`;

    return `
      <h2>Transaction Funded</h2>
      <p>Hello ${userName},</p>
      <p>The transaction has been funded and is ready to close.</p>
      <p><a href="${transactionLink}">View Transaction</a></p>
    `;
  }

  private generateTransactionClosedEmail(
    data: NotificationData,
    userName: string,
  ): string {
    const transactionLink = `${this.marketplaceUrl}/transactions/${data.transactionId}`;

    return `
      <h2>Transaction Closed Successfully</h2>
      <p>Hello ${userName},</p>
      <p>Congratulations! Your transaction has been closed successfully.</p>
      <p>Your settlement statement is now available.</p>
      <p><a href="${transactionLink}">View Transaction & Settlement Statement</a></p>
    `;
  }

  private generateSettlementStatementEmail(
    data: NotificationData,
    userName: string,
  ): string {
    const transactionLink = `${this.marketplaceUrl}/transactions/${data.transactionId}`;
    const netProceeds = data.metadata?.netProceeds
      ? `$${Number(data.metadata.netProceeds).toLocaleString()}`
      : 'N/A';

    return `
      <h2>Settlement Statement Ready</h2>
      <p>Hello ${userName},</p>
      <p>Your settlement statement is now available.</p>
      <p><strong>Net Proceeds:</strong> ${netProceeds}</p>
      <p><a href="${transactionLink}">View Settlement Statement</a></p>
    `;
  }

  /**
   * Get user notifications with pagination and filters
   */
  async getUserNotifications(
    userId: string,
    query: {
      page?: number;
      pageSize?: number;
      type?: NotificationType;
      read?: boolean;
      unreadOnly?: boolean;
    },
  ): Promise<{
    notifications: any[];
    total: number;
    page: number;
    pageSize: number;
    unreadCount: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = { userId };

    // Filter by read status
    if (query.read !== undefined) {
      if (query.read) {
        where.status = 'READ';
      } else {
        where.status = { not: 'READ' };
      }
    } else if (query.unreadOnly) {
      where.status = { not: 'READ' };
    }

    // Filter by type
    if (query.type) {
      where.type = query.type;
    }

    // Get total count
    const total = await this.prisma.notification.count({ where });

    // Get unread count
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        status: { not: 'READ' },
      },
    });

    // Get notifications
    const notifications = await this.prisma.notification.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        transaction: {
          select: {
            id: true,
            status: true,
            purchasePrice: true,
          },
        },
        offer: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
    });

    return {
      notifications,
      total,
      page,
      pageSize,
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        status: 'READ' as any,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        status: { not: 'READ' },
      },
      data: {
        status: 'READ' as any,
        readAt: new Date(),
      },
    });
  }
}

