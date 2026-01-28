import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '@app/database';
import { ConfigModule as AppConfigModule } from '@app/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { HttpModule } from '@nestjs/axios';
import { RpcModule } from './rpc/rpc.module';
import { JobsModule } from './jobs/jobs.module';
import { ProcessingModule } from './processing/processing.module';
import { HealthController } from './health.controller';

const logger = new Logger('BlockchainServiceModule');
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST', 'localhost');
        const port = Number(config.get('REDIS_PORT')) || 6379;
        const username = config.get<string>('REDIS_USERNAME') || 'default';
        const password = config.get<string>('REDIS_PASSWORD') || undefined;
        const useTls =
          port === 6380 ||
          `${config.get('REDIS_TLS')}`.toLowerCase() === 'true';

        logger.log(
          `[BullModule] Connecting to Redis at ${host}:${port} (TLS: ${useTls})`,
        );

        return {
          connection: {
            host,
            port,
            username,
            password,
            ...(useTls ? { tls: { servername: host } } : {}),
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: 'blockchain-jobs',
    }),
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
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 60000), // Default 60 seconds
        maxRedirects: 5,
      }),
    }),
    RpcModule,
    JobsModule,
    ProcessingModule,
  ],
  controllers: [HealthController],
})
export class BlockchainServiceModule {}
