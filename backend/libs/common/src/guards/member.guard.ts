import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

/**
 * A guard that checks if the authenticated user is a member of any organization.
 * It does this by verifying the presence of an `organizationId` in the JWT payload.
 * This guard should run AFTER the JwtAuthGuard.
 */
@Injectable()
export class MemberGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.organizationId) {
      throw new ForbiddenException(
        'This action requires organization membership.',
      );
    }

    return true;
  }
}
