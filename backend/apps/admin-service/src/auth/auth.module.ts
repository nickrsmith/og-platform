import { Module, Logger } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from '@app/database';
import { ConfigModule } from '@app/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

const logger = new Logger('AuthModule');

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PassportModule,

    // TLS-aware Redis cache
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST');
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

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminJwtStrategy, AdminJwtAuthGuard],
  exports: [AdminJwtAuthGuard],
})
export class AuthModule {}
