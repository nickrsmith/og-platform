/**
 * Revenue Hooks
 * React hooks for revenue-related API calls using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  calculateRevenueSplit,
  getFeeStructure,
  getRevenueStatistics,
  getOrganizationEarnings,
  type CalculateRevenueSplitRequest,
  type RevenueSplit,
  type FeeStructure,
  type RevenueStatistics,
  type OrganizationEarnings,
} from '@/lib/services/revenue.service';

/**
 * Hook to calculate revenue split
 */
export function useCalculateRevenueSplit() {
  return useMutation({
    mutationFn: (data: CalculateRevenueSplitRequest) =>
      calculateRevenueSplit(data),
  });
}

/**
 * Hook to get fee structure
 */
export function useFeeStructure(orgContractAddress: string | null) {
  return useQuery<FeeStructure>({
    queryKey: ['revenue', 'fee-structure', orgContractAddress],
    queryFn: () => getFeeStructure(orgContractAddress!),
    enabled: !!orgContractAddress,
  });
}

/**
 * Hook to get revenue statistics
 */
export function useRevenueStatistics(orgContractAddress: string | null) {
  return useQuery<RevenueStatistics>({
    queryKey: ['revenue', 'statistics', orgContractAddress],
    queryFn: () => getRevenueStatistics(orgContractAddress!),
    enabled: !!orgContractAddress,
  });
}

/**
 * Hook to get organization earnings
 */
export function useOrganizationEarnings(
  organizationId: string | null,
  options?: {
    page?: number;
    pageSize?: number;
    status?: 'pending' | 'distributed';
  }
) {
  return useQuery<OrganizationEarnings>({
    queryKey: ['revenue', 'earnings', organizationId, options],
    queryFn: () => getOrganizationEarnings(organizationId!, options),
    enabled: !!organizationId,
  });
}

