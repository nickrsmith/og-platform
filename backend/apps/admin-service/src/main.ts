import { NestFactory } from '@nestjs/core';
import { AdminServiceModule } from './admin-service.module';
import { standardValidationPipe } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AdminServiceModule);
  
  // Apply standardized validation pipe with security-focused settings
  app.useGlobalPipes(standardValidationPipe);
  
  app.enableShutdownHooks();
  const nodeEnv = process.env.NODE_ENV || 'not set';
  console.log(`[Admin Service] NODE_ENV: ${nodeEnv}`);

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
          callback(null, adminDashboardUrl === origin);
        }
      }
    : [adminDashboardUrl];

  // Log CORS configuration for debugging
  if (isDevelopment) {
    console.log(
      `[Admin Service] CORS enabled for all localhost origins in development mode`,
    );
  } else {
    console.log(
      `[Admin Service] CORS enabled for origin: ${adminDashboardUrl}`,
    );
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  const port = process.env.ADMIN_SERVICE_PORT || 4243;
  const host = process.env.ADMIN_SERVICE_HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`[Admin Service] Service is listening on ${host}:${port}`);
  console.log(
    `[Admin Service] Health check endpoint: http://${host}:${port}/health`,
  );
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap Admin Service', err);
  process.exit(1);
});
