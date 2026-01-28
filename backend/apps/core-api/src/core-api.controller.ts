import {
  Controller,
  Get,
  Query,
  Inject,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { CoreApiService } from './core-api.service';
import { PrismaService } from '@app/database';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Controller()
export class CoreApiController {
  constructor(
    private readonly coreApiService: CoreApiService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Get('/health')
  async health() {
    const startTime = Date.now();
    const checks: Record<
      string,
      {
        status: 'healthy' | 'unhealthy';
        message?: string;
        responseTime?: number;
      }
    > = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Database health check
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const dbTime = Date.now() - dbStart;
      checks.database = {
        status: 'healthy',
        message: 'Connected',
        responseTime: dbTime,
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
      overallStatus = 'unhealthy';
    }

    // Redis health check
    try {
      const redisStart = Date.now();
      const testKey = `health:check:${Date.now()}`;
      await this.cacheManager.set(testKey, 'ok', 1);
      const value = await this.cacheManager.get(testKey);
      await this.cacheManager.del(testKey);
      const redisTime = Date.now() - redisStart;

      if (value === 'ok') {
        checks.redis = {
          status: 'healthy',
          message: 'Connected',
          responseTime: redisTime,
        };
      } else {
        checks.redis = {
          status: 'unhealthy',
          message: 'Read/write test failed',
        };
        overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
      }
    } catch (error) {
      checks.redis = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
      overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
    }

    // RabbitMQ health check
    try {
      const rabbitStart = Date.now();
      // Check if connection manager exists and has a connection
      const connectionManager = this.amqpConnection.managedConnection;
      const isConnected =
        connectionManager && connectionManager.isConnected?.() === true;
      const rabbitTime = Date.now() - rabbitStart;

      if (isConnected) {
        checks.rabbitmq = {
          status: 'healthy',
          message: 'Connected',
          responseTime: rabbitTime,
        };
      } else {
        checks.rabbitmq = {
          status: 'unhealthy',
          message: 'Connection not established',
        };
        overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
      }
    } catch (error) {
      checks.rabbitmq = {
        status: 'unhealthy',
        message:
          error instanceof Error ? error.message : 'Connection check failed',
      };
      overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
    }

    const totalTime = Date.now() - startTime;
    const response = {
      status: overallStatus,
      service: 'core-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      responseTime: totalTime,
    };

    // Return appropriate HTTP status based on health
    const statusCode =
      overallStatus === 'healthy'
        ? HttpStatus.OK
        : overallStatus === 'degraded'
          ? HttpStatus.OK // Still return 200 but with degraded status
          : HttpStatus.SERVICE_UNAVAILABLE;

    if (overallStatus === 'unhealthy') {
      throw new HttpException(response, statusCode);
    }

    return response;
  }

  @Get('/platform/fees')
  getPlatformFees(@Query('organizationId') organizationId?: string) {
    return this.coreApiService.getPlatformFees(organizationId);
  }
}
