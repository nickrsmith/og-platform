/**
 * Mock Authentication API
 * Provides mock authentication for beta testing without backend
 */

import { delay, mockResponse, mockError } from './index';
import type { User } from '@shared/schema';

// Mock users store (in-memory)
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'beta.tester@example.com',
    fullName: 'Beta Tester',
    firstName: 'Beta',
    lastName: 'Tester',
    userCategory: 'C',
    personaVerified: true, // Persona verification (replaces CLEAR)
    kycStatus: 'verified',
    company: 'Test Company',
    phone: '+1-555-0100',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    email: 'demo@example.com',
    fullName: 'Demo User',
    firstName: 'Demo',
    lastName: 'User',
    userCategory: 'B',
    personaVerified: true, // Persona verification (replaces CLEAR)
    kycStatus: 'verified',
    company: 'Demo Company',
    phone: '+1-555-0101',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Current session (in-memory)
let currentUser: User | null = null;

// Verification status (in-memory)
let identityVerified = false;

/**
 * Mock login
 */
export async function mockLogin(email: string, password: string): Promise<{ user: User; token: string }> {
  await delay(500);
  
  // For beta testing, accept any email/password or use demo credentials
  const user = mockUsers.find(u => u.email === email) || mockUsers[0];
  
  // In production mock mode, we'll accept any login
  currentUser = user;
  
  return mockResponse({
    user,
    token: `mock-token-${Date.now()}`,
  });
}

/**
 * Mock get current user
 */
export async function mockGetCurrentUser(): Promise<User | null> {
  await delay(200);
  
  return mockResponse(currentUser);
}

/**
 * Mock logout
 */
export async function mockLogout(): Promise<void> {
  await delay(200);
  currentUser = null;
  return mockResponse(undefined);
}

/**
 * Mock register
 */
export async function mockRegister(data: {
  email: string;
  password: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  userCategory: 'A' | 'B' | 'C';
  company?: string;
  phone?: string;
}): Promise<{ user: User; token: string }> {
  await delay(600);
  
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: data.email,
    fullName: data.fullName,
    firstName: data.firstName || data.fullName.split(' ')[0],
    lastName: data.lastName || data.fullName.split(' ').slice(1).join(' ') || '',
    userCategory: data.userCategory,
    personaVerified: false, // Persona verification (replaces CLEAR)
    kycStatus: 'pending',
    company: data.company,
    phone: data.phone,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockUsers.push(newUser);
  currentUser = newUser;
  
  return mockResponse({
    user: newUser,
    token: `mock-token-${Date.now()}`,
  });
}

/**
 * Set current user (for testing)
 */
export function setMockUser(user: User | null) {
  currentUser = user;
}

/**
 * Get all mock users (for admin/testing)
 */
export function getMockUsers(): User[] {
  return [...mockUsers];
}

/**
 * Check if current user is identity verified
 */
export function isIdentityVerified(): boolean {
  return identityVerified;
}

/**
 * Set identity verification status
 */
export function setIdentityVerified(verified: boolean) {
  identityVerified = verified;
  if (currentUser) {
    currentUser.personaVerified = verified; // Persona verification (replaces CLEAR)
    currentUser.kycStatus = verified ? 'verified' : 'pending';
  }
}

