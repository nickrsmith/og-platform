# Idempotency Key Support

This module provides idempotency key support for mutation endpoints, preventing duplicate processing of the same request.

## Overview

Idempotency keys allow clients to safely retry requests without causing duplicate side effects. When a client sends a request with an idempotency key, the server:

1. Checks if the key has been used before
2. If found, returns the cached response
3. If not found, processes the request and caches the response

## Components

### IdempotencyService
Service for managing idempotency keys in the database.

### IdempotencyGuard
Guard that validates idempotency keys and checks for existing records.

### IdempotencyInterceptor
Interceptor that caches responses for idempotent requests.

### IdempotencyRequired Decorator
Decorator to mark endpoints as requiring idempotency.

## Usage

### 1. Enable Idempotency on an Endpoint

```typescript
import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { 
  IdempotencyGuard, 
  IdempotencyInterceptor, 
  IdempotencyRequired,
  JwtAuthGuard 
} from '@app/common';

@Controller('organizations')
@UseGuards(JwtAuthGuard, IdempotencyGuard)
@UseInterceptors(IdempotencyInterceptor)
export class OrganizationsController {
  @Post()
  @IdempotencyRequired()
  async create(@Body() dto: CreateOrganizationDto) {
    // This endpoint now requires idempotency key
    // Client must send 'idempotency-key' header
  }
}
```

### 2. Client Usage

Clients must send an idempotency key in the `idempotency-key` header:

```bash
curl -X POST https://api.example.com/api/v1/organizations \
  -H "Authorization: Bearer <token>" \
  -H "idempotency-key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Organization", ...}'
```

### 3. Idempotency Key Format

- **Recommended**: UUID v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **Also accepted**: Alphanumeric strings with hyphens/underscores (1-255 characters)

### 4. Response Behavior

**First Request:**
- Request is processed normally
- Response is cached with the idempotency key
- Response includes the idempotency key in headers (optional)

**Subsequent Requests (same key):**
- Request is NOT processed again
- Cached response is returned immediately
- Same status code and body as original request

## Configuration

### TTL (Time To Live)

Idempotency keys expire after 24 hours by default. To customize:

```typescript
// In your service
await this.idempotencyService.storeKey(
  idempotencyKey,
  method,
  path,
  statusCode,
  responseBody,
  requestBody,
  userId,
  48, // TTL in hours (optional, default: 24)
);
```

### Cleanup

Expired keys are automatically cleaned up. You can also manually clean up:

```typescript
// Clean up expired keys
const deletedCount = await idempotencyService.cleanupExpiredKeys();
```

## Security Considerations

1. **User Scoping**: Idempotency keys can be scoped to users to prevent cross-user key reuse
2. **Request Validation**: Request body hash is validated to ensure same request
3. **Method/Path Validation**: Keys are validated against HTTP method and path
4. **Expiration**: Keys expire after TTL to prevent indefinite storage

## Database Schema

The `idempotency_keys` table stores:
- `idempotency_key` (primary key)
- `user_id` (optional, for user-scoped keys)
- `method` (HTTP method)
- `path` (endpoint path)
- `request_hash` (SHA-256 hash of request body)
- `response_status` (HTTP status code)
- `response_body` (cached response as JSONB)
- `expires_at` (expiration timestamp)
- `created_at` (creation timestamp)

## Best Practices

1. **Use UUID v4**: Generate unique keys using UUID v4
2. **Key Per Request**: Generate a new key for each unique request
3. **Retry Same Key**: Use the same key when retrying a failed request
4. **Key Scope**: Consider user-scoped keys for user-specific operations
5. **Cleanup**: Regularly clean up expired keys (automatic cleanup runs periodically)

## Error Handling

### Missing Idempotency Key
```
400 Bad Request
{
  "message": "Idempotency key required. Provide 'idempotency-key' header."
}
```

### Invalid Key Format
```
400 Bad Request
{
  "message": "Invalid idempotency key format"
}
```

### Key Mismatch
```
409 Conflict
{
  "message": "Idempotency key already used with different request"
}
```

## Testing

```typescript
describe('Idempotency', () => {
  it('should return cached response for duplicate request', async () => {
    const idempotencyKey = 'test-key-123';
    
    // First request
    const response1 = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('idempotency-key', idempotencyKey)
      .send({ name: 'Test Org' })
      .expect(201);
    
    // Second request with same key
    const response2 = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('idempotency-key', idempotencyKey)
      .send({ name: 'Test Org' })
      .expect(201);
    
    // Should return same response
    expect(response1.body).toEqual(response2.body);
  });
});
```

## Migration

To add idempotency support to your database:

```bash
cd backend/og-backend
npx prisma migrate deploy
npx prisma generate
```

## References

- [Stripe Idempotency Keys](https://stripe.com/docs/api/idempotent_requests)
- [RFC 7231 - Idempotent Methods](https://tools.ietf.org/html/rfc7231#section-4.2.2)

