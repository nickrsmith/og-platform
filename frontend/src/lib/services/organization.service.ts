import { api } from '../api';

export type OrganizationRole = 'Principal' | 'Manager' | 'AssetManager' | 'Compliance';

export interface OrganizationMember {
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
    isActive: boolean;
  };
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: OrganizationRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(): Promise<OrganizationMember[]> {
  try {
    return await api.get<OrganizationMember[]>('/api/organizations/me/members');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch organization members');
  }
}

/**
 * Invite a member to the organization
 */
export async function inviteMember(email: string, role: OrganizationRole): Promise<void> {
  try {
    await api.post('/api/organizations/me/invites', { email, role });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to invite member');
  }
}

/**
 * Update member role (requires Principal or Manager role)
 * Note: This endpoint may need to be added to core-api
 * For now, it's only available in admin-service
 */
export async function updateMemberRole(userId: string, role: OrganizationRole): Promise<void> {
  try {
    // TODO: Add PATCH /organizations/me/members/:userId endpoint to core-api
    // For now, this will fail - endpoint needs to be added
    const org = await api.get('/api/organizations/me');
    await api.patch(`/api/organizations/${org.id}/members/${userId}`, { role });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update member role');
  }
}

/**
 * Remove member from organization (requires Principal or Manager role)
 * Note: This endpoint may need to be added to core-api
 */
export async function removeMember(userId: string): Promise<void> {
  try {
    // TODO: Add DELETE /organizations/me/members/:userId endpoint to core-api
    const org = await api.get('/api/organizations/me');
    await api.delete(`/api/organizations/${org.id}/members/${userId}`);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to remove member');
  }
}
