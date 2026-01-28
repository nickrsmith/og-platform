import { NestFactory } from '@nestjs/core';
import { CoreApiModule } from './core-api.module';
import { standardValidationPipe } from '@app/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CoreApiController } from './core-api.controller';

async function bootstrap() {
  // Ensure temp-uploads directory exists with proper permissions
  const tempDir = process.env.TEMP_STORAGE_PATH || '/usr/src/app/temp-uploads';
  const absoluteTempDir = path.isAbsolute(tempDir)
    ? tempDir
    : path.resolve(process.cwd(), tempDir);

  try {
    await fs.mkdir(absoluteTempDir, { recursive: true, mode: 0o755 });
    console.log(
      `[Core API] Temp uploads directory ensured: ${absoluteTempDir}`,
    );
  } catch (error) {
    console.error(
      `[Core API] Failed to create temp uploads directory: ${absoluteTempDir}`,
      error,
    );
    // Don't exit - let the app start and fail on actual upload if needed
  }

  const app = await NestFactory.create(CoreApiModule);

  const nodeEnv = process.env.NODE_ENV || 'not set';
  console.log(`[Core API] NODE_ENV: ${nodeEnv}`);

  const royaltyDashboardUrl =
    process.env.ROYALTY_MARKETPLACE_URL ?? 'http://localhost:5000';
  const adminDashboardUrl =
    process.env.ADMIN_DASHBOARD_URL ?? 'http://localhost:5175';

  // In development, allow all localhost origins to handle Vite's dynamic port assignment
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
          // Also allow configured URLs (for staging and other non-production environments)
          const allowed = [royaltyDashboardUrl, adminDashboardUrl].filter(
            (url) => url,
          );
          callback(null, allowed.includes(origin));
        }
      }
    : (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // In production/staging, check against configured URLs
        const allowed = [royaltyDashboardUrl, adminDashboardUrl].filter(
          (url) => url,
        );
        if (!origin || allowed.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(
            `[Core API] CORS: Rejected origin ${origin}. Allowed: ${allowed.join(', ')}`,
          );
          callback(null, false);
        }
      };

  // Log CORS configuration for debugging
  const configuredUrls = [royaltyDashboardUrl, adminDashboardUrl].filter(
    (url) => url,
  );
  if (isDevelopment) {
    console.log(
      `[Core API] CORS enabled for all localhost origins in development mode`,
    );
    if (configuredUrls.length > 0) {
      console.log(
        `[Core API] CORS also allowing configured URLs: ${configuredUrls.join(', ')}`,
      );
    }
  } else {
    console.log(
      `[Core API] CORS enabled for origins: ${configuredUrls.join(', ')}`,
    );
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400, // 24 hours
  });
  // Apply standardized validation pipe with security-focused settings
  app.useGlobalPipes(standardValidationPipe);
  
  // Set global prefix for v1 API endpoints
  app.setGlobalPrefix('api/v1');
  
  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Empressa O&G Platform API')
    .setDescription(
      'API documentation for Empressa Oil & Gas Platform. Includes transaction management, revenue distribution, offers, notifications, and settlement services.',
    )
    .setVersion('1.0.0')
    .addTag('transactions', 'Transaction management and settlement')
    .addTag('revenue', 'Revenue distribution and fee calculations')
    .addTag('offers', 'Offer management for assets')
    .addTag('notifications', 'Notification system')
    .addTag('validation', 'Asset validation service')
    .addTag('enverus', 'Enverus API integration')
    .addTag('ai', 'AI model integration')
    .addTag('organizations', 'Organization management')
    .addTag('releases', 'Asset/release management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3002', 'Local Development')
    .addServer('https://api.Empressa.io', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Setup Swagger at /api/docs (without v1 prefix) as requested
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Empressa O&G Platform API',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  app.enableShutdownHooks();

  // Add /api/health endpoint (outside v1 prefix) before listening
  const coreApiController = app.get(CoreApiController);
  app.getHttpAdapter().get('/api/health', async (req, res) => {
    try {
      const result = await coreApiController.health();
      const statusCode = result.status === 'unhealthy' ? 503 : 200;
      res.status(statusCode).json(result);
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json(error.response || { message: error.message });
    }
  });

  const port = process.env.CORE_API_PORT || 3002;
  const host = process.env.CORE_API_HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`[Core API] Service is listening on ${host}:${port}`);
  console.log(
    `[Core API] Health check endpoint: http://${host}:${port}/api/health`,
  );
  console.log(
    `[Core API] Health check endpoint (v1): http://${host}:${port}/api/v1/health`,
  );
  console.log(
    `[Core API] Swagger documentation: http://${host}:${port}/api/docs`,
  );
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap Core API', err);
  process.exit(1);
});
