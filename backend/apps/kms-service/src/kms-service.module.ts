import { Module } from '@nestjs/common';
import { KmsServiceController } from './kms-service.controller';
import { KmsServiceService } from './kms-service.service';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { WalletsModule } from './wallets/wallets.module';
import { P2pIdentitiesModule } from './p2p-identities/p2p-identities.module';
import { AwsKmsModule } from './aws-kms/aws-kms.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    WalletsModule,
    P2pIdentitiesModule,
    AwsKmsModule,
  ],
  controllers: [KmsServiceController],
  providers: [KmsServiceService],
})
export class KmsServiceModule {}
