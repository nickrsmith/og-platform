/**
 * Admin Authentication Service
 * Handles admin login, logout, and session management
 * Separate from user authentication to maintain isolation
 */

import { adminApi, type AdminApiError } from '@/lib/api-admin';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
}

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

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// Backend DTOs match
export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AdminChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Admin login
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<AdminLoginResponse> {
  try {
    const response = await adminApi.post<AdminLoginResponse>('/auth/login', {
      email,
      password,
    });

    // Store admin token separately from user token
    if (typeof window !== 'undefined' && response.accessToken) {
      localStorage.setItem('admin_access_token', response.accessToken);
    }

    return response;
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Login failed');
  }
}

/**
 * Admin logout
 */
export async function adminLogout(): Promise<void> {
  try {
    await adminApi.post('/auth/logout');
  } catch (error) {
    // Even if logout fails, clear tokens
    console.error('Admin logout error:', error);
  } finally {
    // Clear admin tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_access_token');
    }
  }
}

/**
 * Get current admin user
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    return await adminApi.get<AdminUser>('/auth/me');
  } catch (error) {
    const apiError = error as AdminApiError;
    if (apiError.status === 401) {
      // Token invalid, clear it
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_access_token');
      }
      return null;
    }
    throw error;
  }
}

/**
 * Change admin password
 */
export async function changeAdminPassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  try {
    // Backend expects currentPassword and newPassword
    await adminApi.post('/auth/change-password', {
      currentPassword: oldPassword,
      newPassword: newPassword,
    });
  } catch (error) {
    const apiError = error as AdminApiError;
    throw new Error(apiError.message || 'Password change failed');
  }
}

/**
 * Check if admin is authenticated
 */
export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return !!localStorage.getItem('admin_access_token');
}

/**
 * Get admin token
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('admin_access_token');
}
