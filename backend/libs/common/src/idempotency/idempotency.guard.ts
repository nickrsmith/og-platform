import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IdempotencyService } from './idempotency.service';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { IDEMPOTENCY_KEY_HEADER, IDEMPOTENCY_REQUIRED_KEY } from './idempotency.decorator';

/**
 * Guard that enforces idempotency for mutation endpoints
 * 
 * Usage:
 * @UseGuards(IdempotencyGuard)
 * @IdempotencyRequired()
 * @Post('/endpoint')
 */
@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private readonly idempotencyService: IdempotencyService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if idempotency is required for this endpoint
    const isRequired = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENCY_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isRequired) {
      // Idempotency not required, allow request
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const idempotencyKey = request.headers[IDEMPOTENCY_KEY_HEADER] as string;

    if (!idempotencyKey) {
      throw new BadRequestException(
        `Idempotency key required. Provide '${IDEMPOTENCY_KEY_HEADER}' header.`,
      );
    }

    // Validate idempotency key format (UUID v4 recommended)
    if (!this.isValidIdempotencyKey(idempotencyKey)) {
      throw new BadRequestException('Invalid idempotency key format');
    }

    const method = request.method;
    const path = request.route?.path || request.path;
    const requestBody = request.body;
    const userId = request.user?.sub;

    // Check if key already exists
    const existingRecord = await this.idempotencyService.checkKey(
      idempotencyKey,
      method,
      path,
      requestBody,
      userId,
    );

    if (existingRecord) {
      // Key exists, return cached response
      request['idempotencyRecord'] = existingRecord;
      request['idempotencyKey'] = idempotencyKey;
      return true; // Allow request to proceed, but response will be cached
    }

    // Key doesn't exist, store it for later (after response)
    request['idempotencyKey'] = idempotencyKey;
    request['idempotencyMethod'] = method;
    request['idempotencyPath'] = path;
    request['idempotencyRequestBody'] = requestBody;
    request['idempotencyUserId'] = userId;

    return true;
  }

  /**
   * Validate idempotency key format
   * Accepts UUID v4 or any string of reasonable length
   */
  private isValidIdempotencyKey(key: string): boolean {
    if (!key || key.length < 1 || key.length > 255) {
      return false;
    }

    // UUID v4 format (recommended)
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidV4Regex.test(key)) {
      return true;
    }

    // Allow alphanumeric with hyphens/underscores
    const alphanumericRegex = /^[a-zA-Z0-9_-]+$/;
    return alphanumericRegex.test(key);
  }
}

