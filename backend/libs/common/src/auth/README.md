# Authorization Middleware and Service

This module provides API-level authorization checks and reusable authorization logic.

## Components

### AuthorizationMiddleware

A NestJS middleware that provides:
- Request context validation
- Organization membership checks
- Authorization attempt logging for audit trails
- Security headers injection

### AuthorizationService

A service that provides reusable authorization logic:
- Role-based checks
- Organization membership validation
- Resource ownership verification
- Combined authorization checks

## Usage

### Applying the Middleware

The middleware can be applied globally or to specific routes:

```typescript
// In your app module (e.g., core-api.module.ts)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthorizationMiddleware } from '@app/common';

@Module({
  // ... your module config
})
export class CoreApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthorizationMiddleware)
      .forRoutes('*'); // Apply to all routes, or specify specific routes
  }
}
```

### Using the Authorization Service

Inject the service in your guards, controllers, or services:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@app/common';
import { RequestWithUser } from '@app/common';

@Injectable()
export class MyGuard implements CanActivate {
  constructor(private authService: AuthorizationService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Check if user has required role
    this.authService.requireRole(user, [Role.Principal, Role.Creator]);

    // Or check organization membership
    this.authService.requireOrganizationMember(user, organizationId);

    return true;
  }
}
```

### In Controllers

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, AuthorizationService, RequestWithUser } from '@app/common';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private authService: AuthorizationService) {}

  @Get(':id')
  async getResource(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Check authorization before accessing resource
    this.authService.requireAction(req.user, {
      requiredRoles: [Role.Creator],
      requiredOrganizationId: resource.organizationId,
    });

    // ... rest of handler
  }
}
```

## Security Features

- **Audit Logging**: All authorization attempts are logged
- **Context Validation**: Ensures authenticated requests have proper structure
- **Organization Scoping**: Validates organization membership for scoped endpoints
- **Security Headers**: Automatically adds security headers to responses
- **Token Expiration Check**: Additional validation beyond JWT guard

## Integration with Existing Guards

This middleware works alongside existing guards:
- `JwtAuthGuard` - Handles authentication (runs first)
- `RolesGuard` - Handles role-based authorization
- `MemberGuard` - Handles organization membership

The middleware provides additional API-level checks and audit logging.

