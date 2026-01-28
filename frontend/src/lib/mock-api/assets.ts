/**
 * Mock Assets API
 * Provides comprehensive mock data for assets endpoints
 */

import { delay, mockResponse, mockError } from './index';
import type { Asset } from '@shared/schema';
import { mockAssets } from '../mock-data';

let mockAssetsStore: Asset[] = [...mockAssets];
let nextAssetId = 1000;

// Export function to get assets store for data rooms
export function getMockAssetsStore(): Asset[] {
  return mockAssetsStore;
}

/**
 * Generate a new mock asset ID
 */
function generateAssetId(): string {
  return `asset-${nextAssetId++}`;
}

/**
 * Mock list assets
 */
export async function mockListAssets(options?: {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  category?: 'A' | 'B' | 'C';
  basin?: string;
  state?: string;
  userId?: string;
}) {
  await delay();
  
  let filtered = [...mockAssetsStore];
  
  // Apply filters
  if (options?.type) {
    filtered = filtered.filter(a => a.type === options.type);
  }
  if (options?.status) {
    filtered = filtered.filter(a => a.status === options.status);
  }
  if (options?.category) {
    filtered = filtered.filter(a => a.category === options.category);
  }
  if (options?.basin) {
    filtered = filtered.filter(a => a.basin === options.basin);
  }
  if (options?.state) {
    filtered = filtered.filter(a => a.state === options.state);
  }
  if (options?.userId) {
    filtered = filtered.filter(a => a.ownerId === options.userId || a.ownerId === 'current-user');
  }
  
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return mockResponse({
    assets: filtered.slice(start, end),
    total: filtered.length,
    page,
    pageSize,
  });
}

/**
 * Mock get asset by ID
 */
export async function mockGetAsset(assetId: string) {
  await delay();
  
  const asset = mockAssetsStore.find(a => a.id === assetId);
  
  if (!asset) {
    return mockError('Asset not found', 404);
  }
  
  return mockResponse(asset);
}

/**
 * Mock create asset
 */
export async function mockCreateAsset(data: any): Promise<Asset> {
  await delay(500);
  
  const newAsset: Asset = {
    id: generateAssetId(),
    name: data.name,
    type: data.type,
    category: data.category,
    status: 'active',
    basin: data.basin,
    county: data.county,
    state: data.state,
    acreage: data.acreage,
    netMineralAcres: data.netMineralAcres,
    price: data.price,
    projectedROI: data.projectedROI,
    description: data.description,
    highlights: data.highlights || [],
    verified: false,
    ownerId: 'current-user',
    ownerName: 'Current User',
    createdAt: new Date().toISOString().split('T')[0],
    lifecycleStage: 'publish',
    listingMode: data.listingMode || 'sale',
    aiVerified: false,
  };
  
  mockAssetsStore.unshift(newAsset); // Add to beginning
  
  // Automatically create a data room for the new asset
  try {
    const { createDataRoomForAsset } = await import('./data-rooms');
    createDataRoomForAsset(newAsset.id, newAsset.name, newAsset.category);
  } catch (error) {
    console.warn('Failed to auto-create data room for asset:', error);
  }
  
  return mockResponse(newAsset);
}

/**
 * Mock update asset
 */
export async function mockUpdateAsset(assetId: string, data: Partial<Asset>): Promise<Asset> {
  await delay(400);
  
  const index = mockAssetsStore.findIndex(a => a.id === assetId);
  
  if (index === -1) {
    return mockError('Asset not found', 404);
  }
  
  mockAssetsStore[index] = { ...mockAssetsStore[index], ...data };
  
  return mockResponse(mockAssetsStore[index]);
}

/**
 * Mock delete asset
 */
export async function mockDeleteAsset(assetId: string): Promise<void> {
  await delay(300);
  
  const index = mockAssetsStore.findIndex(a => a.id === assetId);
  
  if (index === -1) {
    return mockError('Asset not found', 404);
  }
  
  mockAssetsStore.splice(index, 1);
  
  return mockResponse(undefined);
}

/**
 * Mock get portfolio
 */
export async function mockGetPortfolio(userId?: string) {
  await delay();
  
  const userAssets = userId 
    ? mockAssetsStore.filter(a => a.ownerId === userId || a.ownerId === 'current-user')
    : mockAssetsStore;
  
  return mockResponse({
    totalAssets: userAssets.length,
    totalValue: userAssets.reduce((sum, a) => sum + a.price, 0),
    activeListings: userAssets.filter(a => a.status === 'active').length,
    pendingListings: userAssets.filter(a => a.status === 'pending').length,
    assets: userAssets,
  });
}

/**
 * Mock get asset metrics
 */
export async function mockGetAssetMetrics(assetId: string) {
  await delay();
  
  const asset = mockAssetsStore.find(a => a.id === assetId);
  
  if (!asset) {
    return mockError('Asset not found', 404);
  }
  
  return mockResponse({
    assetId,
    totalRevenue: asset.price * 0.3,
    monthlyRevenue: asset.price * 0.025,
    roi: asset.projectedROI || 25,
    productionData: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      production: Math.floor(Math.random() * 500) + 1000,
    })),
    revenueData: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 50000) + 100000,
    })),
  });
}

