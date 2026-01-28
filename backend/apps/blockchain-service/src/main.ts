// apps/blockchain-service/src/main.ts

import { NestFactory } from '@nestjs/core';
import { BlockchainServiceModule } from './blockchain-service.module';
import { standardValidationPipe } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(BlockchainServiceModule);
  app.enableShutdownHooks();

  const nodeEnv = process.env.NODE_ENV || 'not set';
  console.log(`[Blockchain Service] NODE_ENV: ${nodeEnv}`);

  const royaltyDashboardUrl =
    process.env.ROYALTY_MARKETPLACE_URL ?? 'http://localhost:5000';
  const adminDashboardUrl =
    process.env.ADMIN_DASHBOARD_URL ?? 'http://localhost:5175';

  // In development only, allow all localhost origins to handle Vite's dynamic port assignment
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowedOrigins = isDevelopment
    ? (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Allow any localhost origin in development
        if (
          !origin ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          callback(null, true);
        } else {
          // Also allow configured URLs
          const allowed = [royaltyDashboardUrl, adminDashboardUrl];
          callback(null, allowed.includes(origin));
        }
      }
    : [royaltyDashboardUrl, adminDashboardUrl];

  // Log CORS configuration for debugging
  if (isDevelopment) {
    console.log(
      `[Blockchain Service] CORS enabled for all localhost origins in development mode`,
    );
  } else {
    console.log(
      `[Blockchain Service] CORS enabled for origins: ${[royaltyDashboardUrl, adminDashboardUrl].join(', ')}`,
    );
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Apply standardized validation pipe with security-focused settings
  app.useGlobalPipes(standardValidationPipe);

  const port = process.env.BLOCKCHAIN_SERVICE_PORT || 3003;
  const host = process.env.BLOCKCHAIN_SERVICE_HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`[Blockchain Service] Service is listening on ${host}:${port}`);
  console.log(
    `[Blockchain Service] Health check endpoint: http://${host}:${port}/health`,
  );
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap Blockchain Service', err);
  process.exit(1);
});
