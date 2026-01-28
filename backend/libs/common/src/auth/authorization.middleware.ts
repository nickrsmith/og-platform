import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Authorization middleware that provides API-level security checks.
 * 
 * This middleware:
 * - Validates authenticated requests have proper context
 * - Logs authorization attempts for audit trails
 * - Checks organization membership when required
 * - Validates request structure and headers
 * 
 * Note: This runs BEFORE guards, so it doesn't require authentication.
 * Use JwtAuthGuard for authentication, then this middleware for additional checks.
 */
@Injectable()
export class AuthorizationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthorizationMiddleware.name);

  /**
   * Middleware handler that performs authorization checks
   */
  use(req: Request, res: Response, next: NextFunction): void {
    // Skip authorization checks for public endpoints (health checks, etc.)
    if (this.isPublicEndpoint(req.path)) {
      return next();
    }

    // If user is authenticated (set by JwtAuthGuard), perform additional checks
    const request = req as RequestWithUser;
    if (request.user) {
      this.validateAuthenticatedRequest(request);
      this.logAuthorizationAttempt(request);
    }

    // Add security headers
    this.addSecurityHeaders(res);

    next();
  }

  /**
   * Check if the endpoint is public and should skip authorization checks
   */
  private isPublicEndpoint(path: string): boolean {
    const publicPaths = [
      '/health',
      '/api/v1/health',
      '/metrics',
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
    ];

    return publicPaths.some((publicPath) => path.startsWith(publicPath));
  }

  /**
   * Validate that authenticated requests have proper context
   */
  private validateAuthenticatedRequest(request: RequestWithUser): void {
    const user = request.user as JwtPayload;

    // Validate user payload structure
    if (!user.sub || !user.email) {
      this.logger.warn('Invalid user payload structure', {
        path: request.path,
        method: request.method,
        userId: user.sub,
      });
      throw new UnauthorizedException('Invalid user context');
    }

    // Validate JWT hasn't expired (additional check beyond guard)
    if (user.exp && user.exp < Math.floor(Date.now() / 1000)) {
      this.logger.warn('Expired token detected in middleware', {
        path: request.path,
        method: request.method,
        userId: user.sub,
      });
      throw new UnauthorizedException('Token has expired');
    }

    // For organization-scoped endpoints, validate organization context
    if (this.isOrganizationScopedEndpoint(request.path)) {
      if (!user.organizationId) {
        this.logger.warn('Organization-scoped request without organization context', {
          path: request.path,
          method: request.method,
          userId: user.sub,
        });
        throw new ForbiddenException(
          'This endpoint requires organization membership',
        );
      }
    }
  }

  /**
   * Check if the endpoint requires organization context
   */
  private isOrganizationScopedEndpoint(path: string): boolean {
    const orgScopedPaths = [
      '/api/v1/organizations',
      '/api/v1/releases',
      '/api/v1/assets',
      '/api/v1/members',
    ];

    // Exclude public organization endpoints (like viewing public profiles)
    const publicOrgPaths = [
      '/api/v1/organizations/public',
      '/api/v1/organizations/:id/profile',
    ];

    const isOrgScoped = orgScopedPaths.some((orgPath) =>
      path.startsWith(orgPath),
    );
    const isPublic = publicOrgPaths.some((publicPath) =>
      path.match(publicPath.replace(':id', '[^/]+')),
    );

    return isOrgScoped && !isPublic;
  }

  /**
   * Log authorization attempts for audit trail
   */
  private logAuthorizationAttempt(request: RequestWithUser): void {
    const user = request.user as JwtPayload;
    const logContext = {
      userId: user.sub,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      path: request.path,
      method: request.method,
      ip: request.ip || request.socket.remoteAddress,
      userAgent: request.get('user-agent'),
    };

    // Log at debug level to avoid log flooding, but capture all attempts
    this.logger.debug('Authorization attempt', logContext);

    // For sensitive operations, log at info level
    if (this.isSensitiveOperation(request.method, request.path)) {
      this.logger.log('Sensitive operation authorization', logContext);
    }
  }

  /**
   * Check if the operation is sensitive and requires enhanced logging
   */
  private isSensitiveOperation(method: string, path: string): boolean {
    const sensitiveMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const sensitivePaths = [
      '/api/v1/organizations',
      '/api/v1/releases',
      '/api/v1/assets',
      '/api/v1/members',
      '/api/v1/wallets',
      '/api/v1/transactions',
    ];

    return (
      sensitiveMethods.includes(method) &&
      sensitivePaths.some((sensitivePath) => path.startsWith(sensitivePath))
    );
  }

  /**
   * Add security headers to responses
   */
  private addSecurityHeaders(res: Response): void {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy (basic)
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    );
  }
}

