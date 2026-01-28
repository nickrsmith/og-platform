import { Module } from '@nestjs/common';
import { SimplifyController } from './simplify.controller';
import { SimplifyService } from './simplify.service';
import { DatabaseModule } from '@app/database';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    TransactionsModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 60000),
        maxRedirects: 5,
      }),
    }),
  ],
  controllers: [SimplifyController],
  providers: [SimplifyService],
  exports: [SimplifyService],
})
export class SimplifyModule {}
