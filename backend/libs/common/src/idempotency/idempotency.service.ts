import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

export interface IdempotencyRecord {
  idempotencyKey: string;
  userId?: string;
  method: string;
  path: string;
  requestHash?: string;
  responseStatus: number;
  responseBody?: unknown;
  expiresAt: Date;
}

/**
 * Service for managing idempotency keys
 * Prevents duplicate processing of the same request
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly defaultTtlHours = 24; // Default TTL: 24 hours

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a hash of the request body for validation
   */
  private hashRequest(body: unknown): string {
    const bodyString = JSON.stringify(body || {});
    return createHash('sha256').update(bodyString).digest('hex');
  }

  /**
   * Check if an idempotency key exists and return cached response if found
   */
  async checkKey(
    idempotencyKey: string,
    method: string,
    path: string,
    requestBody?: unknown,
    userId?: string,
  ): Promise<IdempotencyRecord | null> {
    try {
      const record = await this.prisma.idempotencyKey.findUnique({
        where: { idempotencyKey },
      });

      if (!record) {
        return null;
      }

      // Check if key has expired
      if (record.expiresAt < new Date()) {
        this.logger.debug(`Idempotency key expired: ${idempotencyKey}`);
        // Clean up expired key
        await this.prisma.idempotencyKey.delete({
          where: { idempotencyKey },
        });
        return null;
      }

      // Validate method and path match
      if (record.method !== method || record.path !== path) {
        this.logger.warn(
          `Idempotency key method/path mismatch: ${idempotencyKey}`,
        );
        throw new ConflictException(
          'Idempotency key already used with different request',
        );
      }

      // Validate user if provided
      if (userId && record.userId && record.userId !== userId) {
        this.logger.warn(
          `Idempotency key user mismatch: ${idempotencyKey}`,
        );
        throw new ConflictException(
          'Idempotency key belongs to a different user',
        );
      }

      // Validate request body hash if provided
      if (requestBody !== undefined) {
        const requestHash = this.hashRequest(requestBody);
        if (record.requestHash && record.requestHash !== requestHash) {
          this.logger.warn(
            `Idempotency key request body mismatch: ${idempotencyKey}`,
          );
          throw new ConflictException(
            'Idempotency key already used with different request body',
          );
        }
      }

      return {
        idempotencyKey: record.idempotencyKey,
        userId: record.userId || undefined,
        method: record.method,
        path: record.path,
        requestHash: record.requestHash || undefined,
        responseStatus: record.responseStatus,
        responseBody: record.responseBody as unknown,
        expiresAt: record.expiresAt,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Error checking idempotency key: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Store an idempotency key with response
   */
  async storeKey(
    idempotencyKey: string,
    method: string,
    path: string,
    responseStatus: number,
    responseBody?: unknown,
    requestBody?: unknown,
    userId?: string,
    ttlHours?: number,
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (ttlHours || this.defaultTtlHours));

      const requestHash = requestBody !== undefined
        ? this.hashRequest(requestBody)
        : null;

      await this.prisma.idempotencyKey.create({
        data: {
          idempotencyKey,
          userId: userId || null,
          method,
          path,
          requestHash,
          responseStatus,
          responseBody: responseBody ? (responseBody as Prisma.InputJsonValue) : Prisma.JsonNull,
          expiresAt,
        },
      });

      this.logger.debug(`Stored idempotency key: ${idempotencyKey}`);
    } catch (error) {
      // If key already exists, it means concurrent request - this is expected
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        this.logger.debug(
          `Idempotency key already exists (concurrent request): ${idempotencyKey}`,
        );
        return;
      }

      this.logger.error(
        `Error storing idempotency key: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Clean up expired idempotency keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    try {
      const result = await this.prisma.idempotencyKey.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired idempotency keys`);
      return result.count;
    } catch (error) {
      this.logger.error(
        `Error cleaning up expired keys: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  /**
   * Delete a specific idempotency key (for testing/admin purposes)
   */
  async deleteKey(idempotencyKey: string): Promise<void> {
    try {
      await this.prisma.idempotencyKey.delete({
        where: { idempotencyKey },
      });
      this.logger.debug(`Deleted idempotency key: ${idempotencyKey}`);
    } catch (error) {
      this.logger.error(
        `Error deleting idempotency key: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}

