import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { WalletsKmsService } from './wallets-kms.service';
import { DatabaseModule } from '@app/database';
import { ConfigModule } from '@app/config';
import { AwsKmsModule } from '../aws-kms/aws-kms.module';

@Module({
  imports: [DatabaseModule, ConfigModule, AwsKmsModule],
  controllers: [WalletsController],
  providers: [WalletsService, WalletsKmsService],
  exports: [WalletsService, WalletsKmsService],
})
export class WalletsModule {}
