import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Role } from '../enums/roles.enum';

/**
 * Authorization service that provides reusable authorization logic.
 * 
 * This service can be used by guards, middleware, and controllers
 * to perform authorization checks consistently across the application.
 */
@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  /**
   * Check if a user has one of the required roles
   */
  hasRole(user: JwtPayload, requiredRoles: Role[]): boolean {
    if (!user.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }

  /**
   * Check if a user has a specific role
   */
  hasSpecificRole(user: JwtPayload, requiredRole: Role): boolean {
    return user.role === requiredRole;
  }

  /**
   * Check if a user is a member of an organization
   */
  isOrganizationMember(user: JwtPayload, organizationId?: string): boolean {
    if (!user.organizationId) {
      return false;
    }

    // If no specific organization ID provided, check if user has any organization
    if (!organizationId) {
      return !!user.organizationId;
    }

    // Check if user's organization matches the required one
    return user.organizationId === organizationId;
  }

  /**
   * Check if a user owns a resource (by comparing user ID with resource owner ID)
   */
  ownsResource(user: JwtPayload, resourceOwnerId: string): boolean {
    return user.sub === resourceOwnerId;
  }

  /**
   * Check if a user can access a resource based on organization membership
   */
  canAccessOrganizationResource(
    user: JwtPayload,
    resourceOrganizationId: string,
  ): boolean {
    // Manager can access any organization's resources
    if (user.role === Role.Manager) {
      return true;
    }

    // User must be a member of the organization
    return this.isOrganizationMember(user, resourceOrganizationId);
  }

  /**
   * Require that a user has one of the specified roles (throws if not)
   */
  requireRole(user: JwtPayload, requiredRoles: Role[]): void {
    if (!this.hasRole(user, requiredRoles)) {
      this.logger.warn('Role requirement not met', {
        userId: user.sub,
        userRole: user.role,
        requiredRoles,
      });
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  /**
   * Require that a user is a member of an organization (throws if not)
   */
  requireOrganizationMember(user: JwtPayload, organizationId?: string): void {
    if (!this.isOrganizationMember(user, organizationId)) {
      this.logger.warn('Organization membership required', {
        userId: user.sub,
        userOrganizationId: user.organizationId,
        requiredOrganizationId: organizationId,
      });
      throw new ForbiddenException(
        'This action requires organization membership',
      );
    }
  }

  /**
   * Require that a user owns a resource (throws if not)
   */
  requireResourceOwnership(user: JwtPayload, resourceOwnerId: string): void {
    if (!this.ownsResource(user, resourceOwnerId)) {
      this.logger.warn('Resource ownership required', {
        userId: user.sub,
        resourceOwnerId,
      });
      throw new ForbiddenException('You do not have permission to access this resource');
    }
  }

  /**
   * Check if a user can perform an action on a resource
   * Combines role, organization membership, and ownership checks
   */
  canPerformAction(
    user: JwtPayload,
    options: {
      requiredRoles?: Role[];
      requiredOrganizationId?: string;
      resourceOwnerId?: string;
      allowAdmin?: boolean;
    },
  ): boolean {
    const {
      requiredRoles,
      requiredOrganizationId,
      resourceOwnerId,
      allowAdmin = true,
    } = options;

    // Manager bypass (if allowed)
    if (allowAdmin && user.role === Role.Manager) {
      return true;
    }

    // Check role requirements
    if (requiredRoles && !this.hasRole(user, requiredRoles)) {
      return false;
    }

    // Check organization membership
    if (requiredOrganizationId) {
      if (!this.canAccessOrganizationResource(user, requiredOrganizationId)) {
        return false;
      }
    }

    // Check resource ownership (if specified and not admin)
    if (resourceOwnerId && (!allowAdmin || user.role !== Role.Manager)) {
      if (!this.ownsResource(user, resourceOwnerId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Require that a user can perform an action (throws if not)
   */
  requireAction(
    user: JwtPayload,
    options: {
      requiredRoles?: Role[];
      requiredOrganizationId?: string;
      resourceOwnerId?: string;
      allowAdmin?: boolean;
    },
  ): void {
    if (!this.canPerformAction(user, options)) {
      this.logger.warn('Action not permitted', {
        userId: user.sub,
        userRole: user.role,
        options,
      });
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }
}

