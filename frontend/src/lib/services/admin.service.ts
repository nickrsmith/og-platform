/**
 * Admin Service
 * Handles all admin panel API calls to admin-service backend
 * Separate from user services to maintain authentication isolation
 */

import { adminApi, type AdminApiError } from '@/lib/api-admin';

// ==================== Types ====================

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  email?: string;
  website?: string;
  isActive: boolean;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: 'Principal' | 'Manager' | 'AssetManager' | 'Compliance';
  isActiveMember: boolean;
  joinedAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface OrganizationRequest {
  id: string;
  organizationName: string;
  requesterEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Release {
  id: string;
  title: string;
  description?: string;
  status: string;
  verificationStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingVerification {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
  };
}

// ==================== Organization Methods ====================

/**
 * List all organizations
 */
export async function getOrganizations(): Promise<Organization[]> {
  try {
    return await adminApi.get<Organization[]>('/organizations');
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch organizations');
  }
}

/**
 * Get organization details
 */
export async function getOrgDetails(orgId: string): Promise<Organization> {
  try {
    return await adminApi.get<Organization>(`/organizations/${orgId}`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch organization details');
  }
}

/**
 * Create organization by admin
 */
export async function createOrganization(data: {
  name: string;
  email?: string;
  website?: string;
}): Promise<Organization> {
  try {
    return await adminApi.post<Organization>('/organizations', data);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to create organization');
  }
}

// ==================== Organization Requests ====================

/**
 * List pending organization requests
 */
export async function getPendingOrgRequests(): Promise<OrganizationRequest[]> {
  try {
    return await adminApi.get<OrganizationRequest[]>('/organizations/requests');
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch pending requests');
  }
}

/**
 * Approve organization request
 */
export async function approveOrgRequest(requestId: string): Promise<void> {
  try {
    await adminApi.post(`/organizations/requests/${requestId}/approve`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to approve request');
  }
}

/**
 * Reject organization request
 */
export async function rejectOrgRequest(
  requestId: string,
  reason?: string
): Promise<void> {
  try {
    await adminApi.post(`/organizations/requests/${requestId}/reject`, {
      reason,
    });
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to reject request');
  }
}

// ==================== Organization Members ====================

/**
 * List organization members
 */
export async function listOrgMembers(
  orgId: string
): Promise<OrganizationMember[]> {
  try {
    return await adminApi.get<OrganizationMember[]>(
      `/organizations/${orgId}/members`
    );
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch members');
  }
}

/**
 * Invite member to organization
 */
export async function inviteOrgMember(
  orgId: string,
  data: {
    email: string;
    role: 'Principal' | 'Manager' | 'AssetManager' | 'Compliance';
  }
): Promise<void> {
  try {
    await adminApi.post(`/organizations/${orgId}/members/invite`, data);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to invite member');
  }
}

/**
 * Update member role
 */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: 'Principal' | 'Manager' | 'AssetManager' | 'Compliance'
): Promise<void> {
  try {
    await adminApi.patch(`/organizations/${orgId}/members/${userId}`, {
      role,
    });
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to update member role');
  }
}

/**
 * Remove member from organization
 */
export async function removeOrgMember(
  orgId: string,
  userId: string
): Promise<void> {
  try {
    await adminApi.delete(`/organizations/${orgId}/members/${userId}`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to remove member');
  }
}

// ==================== Releases/Assets ====================

/**
 * Get pending verifications
 */
export async function getPendingVerifications(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{ data: PendingVerification[]; total: number; page: number; pageSize: number }> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    const query = queryParams.toString();
    return await adminApi.get(`/releases/pending-verifications${query ? `?${query}` : ''}`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch pending verifications');
  }
}

/**
 * Approve asset verification
 */
export async function approveVerification(releaseId: string): Promise<void> {
  try {
    await adminApi.post(`/releases/${releaseId}/approve-verification`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to approve verification');
  }
}

/**
 * Reject asset verification
 */
export async function rejectVerification(
  releaseId: string,
  reason?: string
): Promise<void> {
  try {
    await adminApi.post(`/releases/${releaseId}/reject-verification`, {
      reason,
    });
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to reject verification');
  }
}

/**
 * Delete release/asset
 */
export async function deleteRelease(releaseId: string): Promise<void> {
  try {
    await adminApi.delete(`/releases/${releaseId}`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to delete release');
  }
}

// ==================== User Management ====================

export interface AdminUsersResponse {
  items: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * List all users
 */
export async function getUsers(query?: { page?: number; limit?: number; status?: string; search?: string }): Promise<AdminUsersResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (query?.page) queryParams.append('page', query.page.toString());
    if (query?.limit) queryParams.append('limit', query.limit.toString());
    if (query?.status) queryParams.append('status', query.status);
    if (query?.search) queryParams.append('search', query.search);
    
    const queryString = queryParams.toString();
    return await adminApi.get<AdminUsersResponse>(`/users${queryString ? `?${queryString}` : ''}`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch users');
  }
}

/**
 * Update user
 */
export async function updateUser(userId: string, data: { firstName?: string; lastName?: string; category?: 'A' | 'B' | 'C' }): Promise<void> {
  try {
    await adminApi.patch(`/users/${userId}`, data);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to update user');
  }
}

/**
 * Suspend user
 */
export async function suspendUser(userId: string): Promise<void> {
  try {
    await adminApi.patch(`/users/${userId}/suspend`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to suspend user');
  }
}

/**
 * Reactivate user
 */
export async function reactivateUser(userId: string): Promise<void> {
  try {
    await adminApi.patch(`/users/${userId}/reactivate`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to reactivate user');
  }
}

// ==================== Content Management ====================

/**
 * Get flagged listings
 */
export async function getFlaggedListings(query?: { page?: number; limit?: number }): Promise<{ items: any[]; total: number }> {
  try {
    const queryParams = new URLSearchParams();
    if (query?.page) queryParams.append('page', query.page.toString());
    if (query?.limit) queryParams.append('limit', query.limit.toString());
    
    const queryString = queryParams.toString();
    return await adminApi.get(`/releases/flagged${queryString ? `?${queryString}` : ''}`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch flagged listings');
  }
}

/**
 * Flag a listing
 */
export async function flagListing(releaseId: string, reason?: string): Promise<void> {
  try {
    await adminApi.post(`/releases/${releaseId}/flag`, { reason });
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to flag listing');
  }
}

/**
 * Unflag a listing
 */
export async function unflagListing(releaseId: string): Promise<void> {
  try {
    await adminApi.post(`/releases/${releaseId}/unflag`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to unflag listing');
  }
}

/**
 * Get featured listings
 */
export async function getFeaturedListings(query?: { page?: number; limit?: number }): Promise<{ items: any[]; total: number }> {
  try {
    const queryParams = new URLSearchParams();
    if (query?.page) queryParams.append('page', query.page.toString());
    if (query?.limit) queryParams.append('limit', query.limit.toString());
    
    const queryString = queryParams.toString();
    return await adminApi.get(`/releases/featured${queryString ? `?${queryString}` : ''}`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch featured listings');
  }
}

/**
 * Feature a listing
 */
export async function featureListing(releaseId: string): Promise<void> {
  try {
    await adminApi.post(`/releases/${releaseId}/feature`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to feature listing');
  }
}

/**
 * Unfeature a listing
 */
export async function unfeatureListing(releaseId: string): Promise<void> {
  try {
    await adminApi.post(`/releases/${releaseId}/unfeature`);
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to unfeature listing');
  }
}

// ==================== Analytics ====================

/**
 * Get platform metrics
 */
export async function getPlatformMetrics(): Promise<any> {
  try {
    return await adminApi.get('/analytics/metrics');
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch platform metrics');
  }
}

/**
 * Get revenue data
 */
export async function getRevenueData(): Promise<any> {
  try {
    return await adminApi.get('/analytics/revenue');
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch revenue data');
  }
}

/**
 * Get funnel data
 */
export async function getFunnelData(): Promise<any> {
  try {
    return await adminApi.get('/analytics/funnel');
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch funnel data');
  }
}

/**
 * Get users by category
 */
export async function getUsersByCategory(): Promise<any> {
  try {
    return await adminApi.get('/analytics/users-by-category');
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Failed to fetch users by category');
  }
}
