import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IpfsServiceService } from './ipfs-service.service';
import type { IpfsJob } from '@app/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PersistenceStrategy } from './ipfs-persistence-stragegy';

@Controller()
export class IpfsServiceController {
  constructor(
    private readonly ipfsService: IpfsServiceService,
    @InjectQueue('ipfs-pinning') private readonly ipfsQueue: Queue,
    private readonly persistenceStrategy: PersistenceStrategy,
  ) {}

  @Get('health')
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

    // Redis (via BullMQ) health check
    try {
      const redisStart = Date.now();
      const client = await this.ipfsQueue.client;
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
      overallStatus = 'unhealthy';
    }

    // IPFS Provider health check
    try {
      const ipfsStart = Date.now();
      const provider = await this.persistenceStrategy.getPrimaryProvider();
      const ipfsTime = Date.now() - ipfsStart;

      checks.ipfs = {
        status: 'healthy',
        message: `Provider available: ${provider.name}`,
        responseTime: ipfsTime,
      };
    } catch (error) {
      checks.ipfs = {
        status: 'unhealthy',
        message:
          error instanceof Error
            ? error.message
            : 'No healthy IPFS providers available',
      };
      overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
    }

    const totalTime = Date.now() - startTime;
    const response = {
      status: overallStatus,
      service: 'ipfs-service',
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

  @Post('ipfs/pins')
  enqueuePin(@Body(new ValidationPipe({ transform: true })) job: IpfsJob) {
    return this.ipfsService.enqueuePinningJob(job);
  }
}
