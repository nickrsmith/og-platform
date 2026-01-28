import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestWithUser, Role } from '@app/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the roles required for this specific handler (controller method)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // This guard runs after JwtAuthGuard, so 'user' is guaranteed to be present.
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userRole = request.user.role;
    // Check if the user's role is included in the list of required roles
    const hasRequiredRole = requiredRoles.some((role) => userRole === role);

    if (hasRequiredRole) {
      return true;
    }

    // If the user does not have the required role, deny access
    throw new ForbiddenException('Insufficient permissions');
  }
}
