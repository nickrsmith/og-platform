import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
export const IDEMPOTENCY_REQUIRED_KEY = 'idempotencyRequired';

/**
 * Decorator to mark an endpoint as requiring idempotency
 * 
 * Usage:
 * @IdempotencyRequired()
 * @Post('/endpoint')
 * async createResource(@Body() dto: CreateDto) {
 *   // ...
 * }
 */
export const IdempotencyRequired = () =>
  SetMetadata(IDEMPOTENCY_REQUIRED_KEY, true);

