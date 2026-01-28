/**
 * Assets Hooks
 * React hooks for asset and portfolio-related API calls using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPortfolio,
  getAssetMetrics,
  getAssetSummary,
  getAsset,
  listAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  type Portfolio,
  type AssetMetrics,
  type AssetSummary,
} from '@/lib/services/assets.service';
import type { Asset } from '@shared/schema';

/**
 * Hook to get user portfolio
 */
export function usePortfolio(userId?: string) {
  return useQuery<Portfolio>({
    queryKey: ['assets', 'portfolio', userId],
    queryFn: () => getPortfolio(userId),
  });
}

/**
 * Hook to get asset metrics
 */
export function useAssetMetrics(
  assetId: string | null,
  options?: {
    startDate?: string;
    endDate?: string;
  }
) {
  return useQuery<AssetMetrics>({
    queryKey: ['assets', 'metrics', assetId, options],
    queryFn: () => getAssetMetrics(assetId!, options),
    enabled: !!assetId,
  });
}

/**
 * Hook to get asset summary
 */
export function useAssetSummary(assetId: string | null) {
  return useQuery<AssetSummary>({
    queryKey: ['assets', 'summary', assetId],
    queryFn: () => getAssetSummary(assetId!),
    enabled: !!assetId,
  });
}

/**
 * Hook to get a single asset
 */
export function useAsset(assetId: string | null) {
  return useQuery<Asset>({
    queryKey: ['assets', assetId],
    queryFn: () => getAsset(assetId!),
    enabled: !!assetId,
  });
}

/**
 * Hook to list assets
 */
export function useAssets(options?: {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  category?: 'A' | 'B' | 'C';
  basin?: string;
  state?: string;
  userId?: string; // Filter by owner
}) {
  return useQuery<{
    assets: Asset[];
    total: number;
    page: number;
    pageSize: number;
  }>({
    queryKey: ['assets', 'list', options],
    queryFn: () => listAssets(options),
    // Use cached data even if query fails (for development mode)
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to create an asset
 */
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof createAsset>[0]) => createAsset(data),
    onSuccess: (newAsset) => {
      // Ensure asset has required fields with defaults
      const assetWithDefaults: Asset = {
        ...newAsset,
        status: newAsset.status || 'active',
        verified: newAsset.verified || false,
        createdAt: newAsset.createdAt || new Date().toISOString().split('T')[0],
      };
      
      // Optimistically add to cache
      queryClient.setQueryData<{ assets: Asset[]; total: number; page: number; pageSize: number }>(
        ['assets', 'list'],
        (old) => {
          if (!old) {
            return { assets: [assetWithDefaults], total: 1, page: 1, pageSize: 10 };
          }
          return {
            ...old,
            assets: [assetWithDefaults, ...old.assets],
            total: old.total + 1,
          };
        }
      );
      // Set individual asset in cache
      queryClient.setQueryData(['assets', assetWithDefaults.id], assetWithDefaults);
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'list'] });
    },
  });
}

/**
 * Hook to update an asset
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, data }: { assetId: string; data: Partial<Asset> }) =>
      updateAsset(assetId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets', variables.assetId] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'list'] });
    },
  });
}

/**
 * Hook to delete an asset
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) => deleteAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'list'] });
    },
  });
}

