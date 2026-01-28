import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { IpfsServiceController } from './ipfs-service.controller';
import { IpfsServiceService } from './ipfs-service.service';
import { ConfigModule as AppConfigModule } from '@app/config';
import { PinataProvider } from './providers/pinata.provider';
import { IpfsPersistenceProcessor } from './ipfs-persistence.processor';
import { PersistenceStrategy } from './ipfs-persistence-stragegy';

const logger = new Logger('IpfsServiceModule');
@Module({
  imports: [
    AppConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 60000), // Default 60 seconds
        maxRedirects: 5,
      }),
    }),
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
      name: 'ipfs-pinning',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with a 5-second delay
        },
      },
    }),
  ],
  controllers: [IpfsServiceController],
  providers: [
    IpfsServiceService,
    IpfsPersistenceProcessor,
    PinataProvider,
    PersistenceStrategy,
  ],
})
export class IpfsServiceModule {}
