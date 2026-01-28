import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DatabaseModule } from '@app/database';
import { EmailModule } from '@app/common/modules/email/email.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, EmailModule, ConfigModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

