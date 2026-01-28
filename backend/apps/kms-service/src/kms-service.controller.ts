import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { KmsServiceService } from './kms-service.service';
import { AwsKmsService } from './aws-kms/aws-kms.service';
import { PrismaService } from '@app/database';

@Controller()
export class KmsServiceController {
  constructor(
    private readonly kmsServiceService: KmsServiceService,
    private readonly awsKmsService: AwsKmsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('/health')
  async health() {
    const startTime = Date.now();
    const checks: Record<
      string,
      {
        status: 'healthy' | 'unhealthy' | 'degraded';
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

    // AWS KMS health check
    try {
      const kmsStart = Date.now();
      const kmsStatus = this.awsKmsService.getKeyPoolStatus();
      const kmsTime = Date.now() - kmsStart;

      // Check if KMS has active keys
      const activeKeysCount = kmsStatus.currentActiveKeys.length;
      const hasAvailableKeys = activeKeysCount > 0;
      checks.kms = {
        status: hasAvailableKeys ? 'healthy' : 'degraded',
        message: hasAvailableKeys
          ? `Connected (${activeKeysCount} active keys available)`
          : 'Connected but no active keys available',
        responseTime: kmsTime,
      };

      if (!hasAvailableKeys) {
        overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
      }
    } catch (error) {
      checks.kms = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
      overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
    }

    const totalTime = Date.now() - startTime;
    const response = {
      status: overallStatus,
      service: 'kms-service',
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

  @Get()
  getHello(): string {
    return this.kmsServiceService.getHello();
  }

  @Get('kms/status')
  getKmsStatus() {
    return this.awsKmsService.getKeyPoolStatus();
  }
}
