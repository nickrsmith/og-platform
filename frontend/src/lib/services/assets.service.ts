/**
 * Assets & Portfolio API Service
 * Handles all asset and portfolio-related API calls
 */

import { api } from '../api';
import { USE_MOCK_API } from '../mock-api';
import * as mockAssets from '../mock-api/assets';
import type { Asset, AssetType, Category } from '@shared/schema';

// ==================== Types ====================

export interface Portfolio {
  totalAssets: number;
  totalValue: number;
  activeListings: number;
  pendingListings: number;
  assets: Asset[];
}

export interface AssetMetrics {
  assetId: string;
  totalRevenue: number;
  monthlyRevenue: number;
  roi: number;
  productionData: {
    date: string;
    production: number;
  }[];
  revenueData: {
    date: string;
    revenue: number;
  }[];
}

export interface AssetSummary {
  assetId: string;
  name: string;
  type: string;
  status: string;
  currentValue: number;
  totalRevenue: number;
  roi: number;
  lastUpdated: string;
}

// ==================== API Functions ====================

/**
 * Get user portfolio
 */
export async function getPortfolio(
  userId?: string
): Promise<Portfolio> {
  if (USE_MOCK_API) {
    return mockAssets.mockGetPortfolio(userId);
  }
  
  try {
    const endpoint = userId 
      ? `/assets/portfolio?userId=${userId}`
      : '/assets/portfolio';
    return await api.get<Portfolio>(endpoint);
  } catch (error: any) {
    // Always fall back to mock data for development when API fails
    console.warn('[Assets Service] Backend unavailable, using mock data');
    return mockAssets.mockGetPortfolio(userId);
  }
}

/**
 * Get asset metrics
 */
export async function getAssetMetrics(
  assetId: string,
  options?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<AssetMetrics> {
  if (USE_MOCK_API) {
    return mockAssets.mockGetAssetMetrics(assetId);
  }
  
  try {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const query = params.toString();
    return await api.get<AssetMetrics>(
      `/assets/metrics/${assetId}${query ? `?${query}` : ''}`
    );
  } catch (error: any) {
    // Always fall back to mock data for development when API fails
    console.warn('[Assets Service] Backend unavailable, using mock data');
    return mockAssets.mockGetAssetMetrics(assetId);
  }
}

/**
 * Get asset summary
 */
export async function getAssetSummary(assetId: string): Promise<AssetSummary> {
  return api.get<AssetSummary>(`/assets/summary/${assetId}`);
}

/**
 * Get asset by ID
 */
export async function getAsset(assetId: string): Promise<Asset> {
  if (USE_MOCK_API) {
    return mockAssets.mockGetAsset(assetId);
  }
  
  return api.get<Asset>(`/assets/${assetId}`);
}

/**
 * List assets with optional filters
 */
export async function listAssets(options?: {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  category?: 'A' | 'B' | 'C';
  basin?: string;
  state?: string;
  userId?: string; // Filter by owner
}): Promise<{
  assets: Asset[];
  total: number;
  page: number;
  pageSize: number;
}> {
  // Use mock API if enabled
  if (USE_MOCK_API) {
    return mockAssets.mockListAssets(options);
  }
  
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
    if (options?.type) params.append('type', options.type);
    if (options?.status) params.append('status', options.status);
    if (options?.category) params.append('category', options.category);
    if (options?.basin) params.append('basin', options.basin);
    if (options?.state) params.append('state', options.state);
    if (options?.userId) params.append('userId', options.userId);

    const query = params.toString();
    return await api.get<{
      assets: Asset[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/assets${query ? `?${query}` : ''}`);
  } catch (error: any) {
    // Always fall back to mock data for development when API fails
    console.warn('[Assets Service] Backend unavailable, using mock data');
    return mockAssets.mockListAssets(options);
  }
}

/**
 * Create a new asset/listing
 */
export async function createAsset(data: {
  name: string;
  type: AssetType;
  category: Category;
  basin: string;
  county: string;
  state: string;
  acreage: number;
  netMineralAcres?: number;
  price: number;
  projectedROI?: number;
  description: string;
  highlights?: string[];
  listingMode?: 'sale' | 'lease';
  workingInterestPercent?: number;
  netRevenueInterest?: number;
  overridePercent?: number;
  legalDescription?: string;
}): Promise<Asset> {
  if (USE_MOCK_API) {
    return mockAssets.mockCreateAsset(data);
  }
  
  return api.post<Asset>('/assets', data);
}

/**
 * Update an asset
 */
export async function updateAsset(assetId: string, data: Partial<Asset>): Promise<Asset> {
  return api.patch<Asset>(`/assets/${assetId}`, data);
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  return api.delete(`/assets/${assetId}`);
}

