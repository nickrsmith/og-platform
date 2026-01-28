import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { api } from '../lib/api';

export type OrganizationRole = 'Principal' | 'Manager' | 'AssetManager' | 'Compliance';

interface OrganizationMember {
  id: string;
  userId: string;
  role: OrganizationRole;
  isActiveMember: boolean;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface OrganizationMembership {
  organizationId: string;
  role: OrganizationRole;
  isActiveMember: boolean;
}

/**
 * Hook to get the current user's role in their organization
 * Returns the user's role and helper functions for permission checks
 */
export function useOrganizationRole() {
  const { user } = useAuth();

  // Get user's organization membership
  const { data: membership, isLoading } = useQuery<OrganizationMembership | null>({
    queryKey: ['/api/organizations/me/membership', user?.id],
    queryFn: async () => {
      try {
        // Get user's organization members (includes current user)
        const members = await api.get<OrganizationMember[]>('/api/organizations/me/members');
        const userMembership = members.find(m => m.userId === user?.id);
        
        if (!userMembership) return null;

        // Get organization ID from first member or from org endpoint
        let organizationId = userMembership.organizationId;
        if (!organizationId) {
          const org = await api.get('/api/organizations/me');
          organizationId = org?.id || null;
        }

        return {
          organizationId: organizationId || '',
          role: userMembership.role,
          isActiveMember: userMembership.isActiveMember,
        };
      } catch (error) {
        console.error('Failed to fetch organization membership:', error);
        return null;
      }
    },
    enabled: !!user?.id,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const role = membership?.role || null;
  const organizationId = membership?.organizationId || null;
  const isActiveMember = membership?.isActiveMember || false;

  /**
   * Check if user has one of the required roles
   */
  const hasRole = (requiredRoles: OrganizationRole[]): boolean => {
    if (!role || !isActiveMember) return false;
    return requiredRoles.includes(role);
  };

  /**
   * Check if user has a specific role
   */
  const hasSpecificRole = (requiredRole: OrganizationRole): boolean => {
    return role === requiredRole && isActiveMember;
  };

  /**
   * Check if user can invite members
   * Principal and Manager can invite
   */
  const canInviteMembers = (): boolean => {
    return hasRole(['Principal', 'Manager']);
  };

  /**
   * Check if user can change member roles
   * Principal and Manager can change roles
   */
  const canChangeRoles = (): boolean => {
    return hasRole(['Principal', 'Manager']);
  };

  /**
   * Check if user can create assets
   * Principal, Manager, and AssetManager can create assets
   */
  const canCreateAssets = (): boolean => {
    return hasRole(['Principal', 'Manager', 'AssetManager']);
  };

  /**
   * Check if user can manage assets
   * Principal, Manager, and AssetManager can manage assets
   */
  const canManageAssets = (): boolean => {
    return hasRole(['Principal', 'Manager', 'AssetManager']);
  };

  /**
   * Check if user can verify assets
   * Principal, Manager, and Compliance can verify (if implemented)
   */
  const canVerifyAssets = (): boolean => {
    return hasRole(['Principal', 'Manager', 'Compliance']);
  };

  /**
   * Check if user has full access
   * Only Principal has full access
   */
  const isPrincipal = (): boolean => {
    return hasSpecificRole('Principal');
  };

  /**
   * Check if user is a manager
   */
  const isManager = (): boolean => {
    return hasSpecificRole('Manager');
  };

  return {
    role,
    organizationId,
    isActiveMember,
    isLoading,
    // Permission checks
    hasRole,
    hasSpecificRole,
    canInviteMembers,
    canChangeRoles,
    canCreateAssets,
    canManageAssets,
    canVerifyAssets,
    isPrincipal,
    isManager,
  };
}
