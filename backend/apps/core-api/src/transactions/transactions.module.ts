import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsBusinessController } from './transactions-business.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsBusinessService } from './transactions-business.service';
import { ConfigModule } from '@app/config';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '@app/database';
import { RevenueModule } from '../revenue/revenue.module';
import { SettlementService } from '../settlement/settlement.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CommonModule,
    RevenueModule,
    NotificationsModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 60000), // Default 60 seconds
        maxRedirects: 5,
      }),
    }),
  ],
  controllers: [TransactionsController, TransactionsBusinessController],
  providers: [TransactionsService, TransactionsBusinessService, SettlementService],
  exports: [TransactionsService, TransactionsBusinessService],
})
export class TransactionsModule {}
