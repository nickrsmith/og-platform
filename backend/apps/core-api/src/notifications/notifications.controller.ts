import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  JwtAuthGuard,
  type RequestWithUser,
} from '@app/common';
import { GetNotificationsQueryDto } from './dto/get-notifications.dto';
import {
  NotificationResponseDto,
  NotificationsListResponseDto,
} from './dto/notification-response.dto';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  private readonly logger = new Logger(NotificationsController.name);

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Get paginated list of notifications for the current user with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: NotificationsListResponseDto,
  })
  async getNotifications(
    @Request() req: RequestWithUser,
    @Query(validationPipe) query: GetNotificationsQueryDto,
  ): Promise<NotificationsListResponseDto> {
    this.logger.log(`Getting notifications for user ${req.user.sub}`);
    return this.notificationsService.getUserNotifications(req.user.sub, query);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Marks a specific notification as read for the current user',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Notification marked as read',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async markAsRead(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    this.logger.log(`Marking notification ${id} as read for user ${req.user.sub}`);
    await this.notificationsService.markAsRead(id, req.user.sub);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all unread notifications as read for the current user',
  })
  @ApiResponse({
    status: 204,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Request() req: RequestWithUser): Promise<void> {
    this.logger.log(`Marking all notifications as read for user ${req.user.sub}`);
    await this.notificationsService.markAllAsRead(req.user.sub);
  }
}
