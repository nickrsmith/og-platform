import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly amqpConnection: AmqpConnection,
    @InjectQueue('blockchain-jobs') private readonly blockchainQueue: Queue,
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

    // Redis (via BullMQ) health check
    try {
      const redisStart = Date.now();
      const client = await this.blockchainQueue.client;
      await client.ping();
      const redisTime = Date.now() - redisStart;
      checks.redis = {
        status: 'healthy',
        message: 'Connected',
        responseTime: redisTime,
      };
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
      service: 'blockchain-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      responseTime: totalTime,
    };

    const statusCode =
      overallStatus === 'healthy'
        ? HttpStatus.OK
        : overallStatus === 'degraded'
          ? HttpStatus.OK
          : HttpStatus.SERVICE_UNAVAILABLE;

    if (overallStatus === 'unhealthy') {
      throw new HttpException(response, statusCode);
    }

    return response;
  }
}
