import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationChannel } from '../notifications.service';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ enum: NotificationType, description: 'Notification type' })
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel, description: 'Notification channel' })
  channel: NotificationChannel;

  @ApiProperty({ description: 'Notification subject', nullable: true })
  subject: string | null;

  @ApiProperty({ description: 'Notification message', nullable: true })
  message: string | null;

  @ApiProperty({ description: 'Notification metadata', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'Transaction ID (if related)', nullable: true })
  transactionId: string | null;

  @ApiProperty({ description: 'Offer ID (if related)', nullable: true })
  offerId: string | null;

  @ApiProperty({ description: 'Notification status' })
  status: string;

  @ApiProperty({ description: 'Read timestamp', nullable: true })
  readAt: Date | null;

  @ApiProperty({ description: 'Sent timestamp', nullable: true })
  sentAt: Date | null;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Related transaction (if applicable)', nullable: true })
  transaction?: {
    id: string;
    status: string;
    purchasePrice: number;
  } | null;

  @ApiProperty({ description: 'Related offer (if applicable)', nullable: true })
  offer?: {
    id: string;
    status: string;
    amount: number;
  } | null;
}

export class NotificationsListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto], description: 'List of notifications' })
  notifications: NotificationResponseDto[];

  @ApiProperty({ description: 'Total number of notifications' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Page size' })
  pageSize: number;

  @ApiProperty({ description: 'Total number of unread notifications' })
  unreadCount: number;
}
