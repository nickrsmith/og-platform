import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [
    {
      provide: LoggerService,
      useFactory: () => {
        const serviceName = process.env.SERVICE_NAME || 'unknown';
        const logLevel = (process.env.LOG_LEVEL?.toUpperCase() ||
          'INFO') as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
        return new LoggerService(serviceName, logLevel as any);
      },
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}

