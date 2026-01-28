import { NestFactory } from '@nestjs/core';
import { IpfsServiceModule } from './ipfs-service.module';
import { standardValidationPipe } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(IpfsServiceModule);
  app.enableShutdownHooks();

  const nodeEnv = process.env.NODE_ENV || 'not set';
  console.log(`[IPFS Service] NODE_ENV: ${nodeEnv}`);

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
      `[IPFS Service] CORS enabled for all localhost origins in development mode`,
    );
  } else {
    console.log(
      `[IPFS Service] CORS enabled for origins: ${[royaltyDashboardUrl, adminDashboardUrl].join(', ')}`,
    );
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Apply standardized validation pipe with security-focused settings
  app.useGlobalPipes(standardValidationPipe);

  const port = process.env.IPFS_SERVICE_PORT || 3004;
  const host = process.env.IPFS_SERVICE_HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`[IPFS Service] Service is listening on ${host}:${port}`);
  console.log(
    `[IPFS Service] Health check endpoint: http://${host}:${port}/health`,
  );
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap the IPFS Service', err);
  process.exit(1);
});
