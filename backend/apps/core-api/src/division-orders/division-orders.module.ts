import { Module } from '@nestjs/common';
import { DivisionOrdersController } from './division-orders.controller';
import { DivisionOrdersService } from './division-orders.service';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [DatabaseModule],
  controllers: [DivisionOrdersController],
  providers: [DivisionOrdersService],
  exports: [DivisionOrdersService],
})
export class DivisionOrdersModule {}
