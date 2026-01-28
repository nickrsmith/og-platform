import { Module } from '@nestjs/common';
import { P2pIdentitiesController } from './p2p-identities.controller';
import { P2pIdentitiesService } from './p2p-identities.service';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [DatabaseModule],
  controllers: [P2pIdentitiesController],
  providers: [P2pIdentitiesService],
})
export class P2pIdentitiesModule {}
