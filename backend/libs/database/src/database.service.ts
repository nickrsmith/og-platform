// libs/database/src/lib/database.service.ts

import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('Attempting to connect to database...');
    try {
      // Add timeout wrapper for database connection
      const connectPromise = this.$connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(new Error('Database connection timeout after 10 seconds')),
          10000,
        );
      });

      await Promise.race([connectPromise, timeoutPromise]);
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error(
        `Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.logger.error(
        'Please check your DATABASE_URL environment variable and ensure the database is accessible',
      );
      throw error; // Re-throw to prevent service from starting with broken DB
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
