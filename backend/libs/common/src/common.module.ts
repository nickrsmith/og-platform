import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { IdempotencyService } from './idempotency/idempotency.service';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [DatabaseModule],
  providers: [CommonService, IdempotencyService],
  exports: [CommonService, IdempotencyService],
})
export class CommonModule {}
