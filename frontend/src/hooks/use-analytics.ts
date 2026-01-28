/**
 * Analytics Hooks
 * React hooks for analytics and KPI-related API calls using TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import {
  getKPIs,
  getTrends,
  getCharts,
  type KPIData,
  type AnalyticsTrends,
  type AnalyticsCharts,
} from '@/lib/services/analytics.service';

/**
 * Hook to get KPI data
 */
export function useKPIs(options?: {
  startDate?: string;
  endDate?: string;
  organizationId?: string;
}) {
  return useQuery<KPIData>({
    queryKey: ['analytics', 'kpis', options],
    queryFn: () => getKPIs(options),
  });
}

/**
 * Hook to get trend data
 */
export function useTrends(options?: {
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  metric?: 'revenue' | 'transactions' | 'assets';
}) {
  return useQuery<AnalyticsTrends>({
    queryKey: ['analytics', 'trends', options],
    queryFn: () => getTrends(options),
  });
}

/**
 * Hook to get chart data
 */
export function useCharts(options?: {
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  chartType?: 'revenue' | 'transactions' | 'assets';
}) {
  return useQuery<AnalyticsCharts>({
    queryKey: ['analytics', 'charts', options],
    queryFn: () => getCharts(options),
  });
}

