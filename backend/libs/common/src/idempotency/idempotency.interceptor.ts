import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { IdempotencyService } from './idempotency.service';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

/**
 * Interceptor that caches responses for idempotent requests
 * 
 * This interceptor should run AFTER the controller handler
 * to capture the response and store it with the idempotency key
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();

    // Check if this is an idempotent request
    const idempotencyRecord = request['idempotencyRecord'] as
      | { responseStatus: number; responseBody: unknown }
      | undefined;

    // If we have a cached response, return it immediately
    if (idempotencyRecord) {
      response.status(idempotencyRecord.responseStatus);
      return new Observable((subscriber) => {
        subscriber.next(idempotencyRecord.responseBody);
        subscriber.complete();
      });
    }

    // No cached response, process request and cache the result
    const idempotencyKey = request['idempotencyKey'] as string | undefined;
    const method = request['idempotencyMethod'] as string | undefined;
    const path = request['idempotencyPath'] as string | undefined;
    const requestBody = request['idempotencyRequestBody'] as unknown | undefined;
    const userId = request['idempotencyUserId'] as string | undefined;

    if (!idempotencyKey || !method || !path) {
      // Not an idempotent request, proceed normally
      return next.handle();
    }

    // Intercept response to cache it
    return next.handle().pipe(
      tap({
        next: async (responseBody: unknown) => {
          const statusCode = response.statusCode || 200;
          await this.idempotencyService.storeKey(
            idempotencyKey,
            method,
            path,
            statusCode,
            responseBody,
            requestBody,
            userId,
          );
        },
        error: async (error: Error & { statusCode?: number }) => {
          // Also cache error responses for idempotency
          const statusCode = error.statusCode || 500;
          await this.idempotencyService.storeKey(
            idempotencyKey,
            method,
            path,
            statusCode,
            { error: error.message },
            requestBody,
            userId,
          );
        },
      }),
    );
  }
}

