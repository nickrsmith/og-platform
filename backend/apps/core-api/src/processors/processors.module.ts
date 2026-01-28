import { Module } from '@nestjs/common';
import { ReconciliationProcessor } from './reconciliation.processor';
import { IpfsEventsProcessor } from './ipfs-events.processor';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { ReleasesModule } from '../releases/releases.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ipfs-pinning',
    }),
    HttpModule,
    ConfigModule,
    DatabaseModule,
    ReleasesModule,
    TransactionsModule,
  ],
  providers: [ReconciliationProcessor, IpfsEventsProcessor],
})
export class ProcessorsModule {}
