/**
 * Revenue Distribution API Service
 * Handles all revenue-related API calls
 */

import { api } from '../api';

// ==================== Types ====================

export interface RevenueSplit {
  totalAmount: number;
  creatorAmount: number;
  hauskaFee: number;
  integratorFee: number;
  hauskaFeePercentage: number;
  integratorFeePercentage: number;
  isFreeListing: boolean;
  category: 'A' | 'B' | 'C';
}

export interface CalculateRevenueSplitRequest {
  amount: number;
  category: 'A' | 'B' | 'C';
  orgContractAddress: string;
  assetOwnerAddress: string;
  integrationPartnerAddress?: string;
}

export interface FeeStructure {
  orgContractAddress: string;
  hauskaFeePercentage: number;
  integratorFeePercentage: number;
  hasCustomFees: boolean;
}

export interface RevenueStatistics {
  orgContractAddress: string;
  totalRevenue: number;
  creatorRevenue: number;
  hauskaRevenue: number;
  integratorRevenue: number;
  pendingCreatorEarnings: number;
  pendingHauskaEarnings: number;
  pendingIntegratorEarnings: number;
  distributedCreatorEarnings: number;
  distributedHauskaEarnings: number;
  distributedIntegratorEarnings: number;
}

export interface OrganizationEarnings {
  organizationId: string;
  totalEarnings: number;
  pendingEarnings: number;
  distributedEarnings: number;
  earnings: Array<{
    id: string;
    transactionId: string;
    amount: number;
    status: 'pending' | 'distributed';
    createdAt: string;
    distributedAt?: string;
  }>;
}

// ==================== API Functions ====================

/**
 * Calculate revenue split for a transaction amount
 */
export async function calculateRevenueSplit(
  data: CalculateRevenueSplitRequest
): Promise<RevenueSplit> {
  return api.post<RevenueSplit>('/revenue/calculate-split', data);
}

/**
 * Get fee structure for an organization
 */
export async function getFeeStructure(
  orgContractAddress: string
): Promise<FeeStructure> {
  return api.get<FeeStructure>(`/revenue/fee-structure/${orgContractAddress}`);
}

/**
 * Get revenue statistics for an organization
 */
export async function getRevenueStatistics(
  orgContractAddress: string
): Promise<RevenueStatistics> {
  return api.get<RevenueStatistics>(`/revenue/stats/${orgContractAddress}`);
}

/**
 * Get organization earnings
 */
export async function getOrganizationEarnings(
  organizationId: string,
  options?: {
    page?: number;
    pageSize?: number;
    status?: 'pending' | 'distributed';
  }
): Promise<OrganizationEarnings> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
  if (options?.status) params.append('status', options.status);

  const query = params.toString();
  return api.get<OrganizationEarnings>(
    `/revenue/earnings/${organizationId}${query ? `?${query}` : ''}`
  );
}

