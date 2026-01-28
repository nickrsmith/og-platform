/**
 * Analytics & KPIs API Service
 * Handles all analytics and KPI-related API calls
 */

import { api } from '../api';

// ==================== Types ====================

export interface KPI {
  id: string;
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon?: string;
}

export interface KPIData {
  kpis: KPI[];
  period: {
    start: string;
    end: string;
  };
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsTrends {
  revenue: TrendData[];
  transactions: TrendData[];
  assets: TrendData[];
  period: {
    start: string;
    end: string;
  };
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}

export interface AnalyticsCharts {
  revenueChart: ChartData;
  transactionChart: ChartData;
  assetChart: ChartData;
  period: {
    start: string;
    end: string;
  };
}

// ==================== API Functions ====================

/**
 * Get KPI data
 */
export async function getKPIs(options?: {
  startDate?: string;
  endDate?: string;
  organizationId?: string;
}): Promise<KPIData> {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.organizationId) params.append('organizationId', options.organizationId);

  const query = params.toString();
  return api.get<KPIData>(`/analytics/kpis${query ? `?${query}` : ''}`);
}

/**
 * Get trend data
 */
export async function getTrends(options?: {
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  metric?: 'revenue' | 'transactions' | 'assets';
}): Promise<AnalyticsTrends> {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.organizationId) params.append('organizationId', options.organizationId);
  if (options?.metric) params.append('metric', options.metric);

  const query = params.toString();
  return api.get<AnalyticsTrends>(`/analytics/trends${query ? `?${query}` : ''}`);
}

/**
 * Get chart data
 */
export async function getCharts(options?: {
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  chartType?: 'revenue' | 'transactions' | 'assets';
}): Promise<AnalyticsCharts> {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.organizationId) params.append('organizationId', options.organizationId);
  if (options?.chartType) params.append('chartType', options.chartType);

  const query = params.toString();
  return api.get<AnalyticsCharts>(`/analytics/charts${query ? `?${query}` : ''}`);
}

