import { Module } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@app/database';
import { BullModule } from '@nestjs/bullmq';
import { TransactionsModule } from '../transactions/transactions.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ValidationModule } from '../validation/validation.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 60000), // Default 60 seconds
        maxRedirects: 5,
      }),
    }),
    AuthModule,
    JwtModule,
    DatabaseModule,
    BullModule.registerQueue({
      name: 'ipfs-pinning',
    }),
    TransactionsModule,
    ValidationModule,
  ],
  controllers: [ReleasesController],
  providers: [ReleasesService],
  exports: [ReleasesService],
})
export class ReleasesModule {}
