import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { DatabaseModule } from '@app/database';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: 'blockchain-jobs',
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
