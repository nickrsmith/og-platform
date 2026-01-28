/**
 * Data Rooms Hooks
 * React hooks for data room-related API calls using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createDataRoom,
  getDataRoom,
  getDataRoomByListing,
  getDataRoomByAsset,
  listDataRooms,
  updateDataRoom,
  deleteDataRoom,
  uploadDocument,
  deleteDocument,
  type CreateDataRoomRequest,
  type UpdateDataRoomRequest,
  type DataRoomWithDocuments,
} from '@/lib/services/data-rooms.service';

/**
 * Hook to get a single data room
 */
export function useDataRoom(dataRoomId: string | null) {
  return useQuery<DataRoomWithDocuments>({
    queryKey: ['data-rooms', dataRoomId],
    queryFn: () => getDataRoom(dataRoomId!),
    enabled: !!dataRoomId,
  });
}

/**
 * Hook to get data room by listing ID
 */
export function useDataRoomByListing(listingId: string | null) {
  return useQuery<DataRoomWithDocuments | null>({
    queryKey: ['data-rooms', 'listing', listingId],
    queryFn: () => getDataRoomByListing(listingId!),
    enabled: !!listingId,
  });
}

/**
 * Hook to get data room by asset ID
 */
export function useDataRoomByAsset(assetId: string | null) {
  return useQuery<DataRoomWithDocuments | null>({
    queryKey: ['data-rooms', 'asset', assetId],
    queryFn: () => getDataRoomByAsset(assetId!),
    enabled: !!assetId,
  });
}

/**
 * Hook to list all data rooms
 */
export function useDataRooms(options?: {
  listingId?: string;
  assetId?: string;
  status?: 'incomplete' | 'complete' | 'pending_review';
  userId?: string;
}) {
  return useQuery<DataRoomWithDocuments[]>({
    queryKey: ['data-rooms', 'list', options],
    queryFn: () => listDataRooms(options),
    // Use cached data even if query fails (for development mode)
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to create a data room
 */
export function useCreateDataRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDataRoomRequest) => createDataRoom(data),
    onSuccess: (newDataRoom) => {
      // Optimistically add to cache
      queryClient.setQueryData<DataRoomWithDocuments[]>(
        ['data-rooms', 'list'],
        (old) => {
          const newDataRoomWithDocs: DataRoomWithDocuments = {
            ...newDataRoom,
            documents: [],
          };
          return old ? [newDataRoomWithDocs, ...old] : [newDataRoomWithDocs];
        }
      );
      
      // Set individual data room in cache
      const newDataRoomWithDocs: DataRoomWithDocuments = {
        ...newDataRoom,
        documents: [],
      };
      queryClient.setQueryData(['data-rooms', newDataRoom.id], newDataRoomWithDocs);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['data-rooms'] });
      if (newDataRoom.listingId) {
        queryClient.invalidateQueries({ queryKey: ['data-rooms', 'listing', newDataRoom.listingId] });
      }
      if (newDataRoom.assetId) {
        queryClient.invalidateQueries({ queryKey: ['data-rooms', 'asset', newDataRoom.assetId] });
      }
    },
  });
}

/**
 * Hook to update a data room
 */
export function useUpdateDataRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dataRoomId, data }: { dataRoomId: string; data: UpdateDataRoomRequest }) =>
      updateDataRoom(dataRoomId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms', variables.dataRoomId] });
      queryClient.invalidateQueries({ queryKey: ['data-rooms', 'list'] });
    },
  });
}

/**
 * Hook to delete a data room
 */
export function useDeleteDataRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dataRoomId: string) => deleteDataRoom(dataRoomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms'] });
    },
  });
}

/**
 * Hook to upload a document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dataRoomId,
      file,
      additionalData,
    }: {
      dataRoomId: string;
      file: File;
      additionalData?: { name?: string; type?: string; folderId?: string };
    }) => uploadDocument(dataRoomId, file, additionalData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms', variables.dataRoomId] });
      queryClient.invalidateQueries({ queryKey: ['data-rooms', 'list'] });
    },
  });
}

/**
 * Hook to delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dataRoomId, documentId }: { dataRoomId: string; documentId: string }) =>
      deleteDocument(dataRoomId, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms', variables.dataRoomId] });
      queryClient.invalidateQueries({ queryKey: ['data-rooms', 'list'] });
    },
  });
}

