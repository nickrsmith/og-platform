import { Module, Logger } from '@nestjs/common';
import { CoreApiController } from './core-api.controller';
import { CoreApiService } from './core-api.service';
import { DatabaseModule } from '@app/database';
import { ConfigModule } from '@app/config';
import { AuthModule } from './auth/auth.module';
import { ReleasesModule } from './releases/releases.module';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

const logger = new Logger('CoreApiModule');
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ProcessorsModule } from './processors/processors.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { EmailModule } from '@app/common/modules/email/email.module';
import { EnverusModule } from './enverus/enverus.module';
import { AiModule } from './ai/ai.module';
import { ValidationModule } from './validation/validation.module';
import { RevenueModule } from './revenue/revenue.module';
import { OffersModule } from './offers/offers.module';
import { DivisionOrdersModule } from './division-orders/division-orders.module';
import { VerificationModule } from './verification/verification.module';
import { SimplifyModule } from './simplify/simplify.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DataRoomsModule } from './data-rooms/data-rooms.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 60000), // Default 60 seconds
        maxRedirects: 5,
      }),
    }),
    AuthModule,
    ReleasesModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST', 'localhost');
        const port = Number(config.get('REDIS_PORT')) || 6379;
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
            password,
            ...(useTls ? { tls: { servername: host } } : {}),
          },
        };
      },
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    // TLS-aware Redis cache
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST', 'localhost');
        const port = Number(config.get('REDIS_PORT')) || 6379;
        const password = config.get<string>('REDIS_PASSWORD') || undefined;
        const useTls =
          port === 6380 ||
          `${config.get('REDIS_TLS')}`.toLowerCase() === 'true';
        const ttl = Number(config.get('REDIS_TTL')) || 300000; // Default: 5 min

        logger.log(
          `[CacheModule] Connecting to Redis at ${host}:${port} (TLS: ${useTls}, TTL: ${ttl}ms)`,
        );

        return {
          store: redisStore,
          socket: {
            host,
            port,
            ...(useTls ? { tls: { servername: host } } : {}),
          },
          password,
          ttl,
        };
      },
    }),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'empressa.events.topic',
            type: 'topic',
          },
        ],
        uri: configService.getOrThrow<string>('RABBITMQ_URL'),
        connectionInitOptions: { wait: false },
      }),
    }),
    UsersModule,
    TransactionsModule,
    ProcessorsModule,
    OrganizationsModule,
    EmailModule,
    EnverusModule,
    AiModule,
    ValidationModule,
    RevenueModule,
    OffersModule,
    DivisionOrdersModule,
    VerificationModule,
    SimplifyModule,
    NotificationsModule,
    DataRoomsModule,
  ],
  controllers: [CoreApiController],
  providers: [CoreApiService],
})
export class CoreApiModule {}
