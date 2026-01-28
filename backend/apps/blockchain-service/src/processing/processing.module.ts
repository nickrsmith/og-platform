import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BlockchainJobProcessor } from './blockchain-job.processor';
import { EventPublisherService } from './event-publisher.service';
import { EthersJSProvider } from './ethersjs.provider';
import { ContractAddressManager } from './contract-address.manager';
import { DatabaseModule } from '@app/database';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'Empressa.events.topic',
            type: 'topic',
          },
        ],
        uri: configService.getOrThrow<string>('RABBITMQ_URL'),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  providers: [
    BlockchainJobProcessor,
    EventPublisherService,
    EthersJSProvider,
    ContractAddressManager,
  ],
  exports: [EthersJSProvider, ContractAddressManager],
})
export class ProcessingModule {}
