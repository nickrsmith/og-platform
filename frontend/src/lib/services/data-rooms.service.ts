/**
 * Data Rooms API Service
 * Handles all data room-related API calls
 */

import { api } from '../api';
import { USE_MOCK_API } from '../mock-api';
import * as mockDataRooms from '../mock-api/data-rooms';
import type { DataRoom, DataRoomDocument } from '@shared/schema';

// ==================== Types ====================

export interface CreateDataRoomRequest {
  name: string;
  listingId?: string;
  assetId?: string;
  tier?: 'simple' | 'standard' | 'premium';
  access?: 'public' | 'restricted';
}

export interface UpdateDataRoomRequest {
  name?: string;
  tier?: 'simple' | 'standard' | 'premium';
  access?: 'public' | 'restricted';
  status?: 'incomplete' | 'complete' | 'pending_review';
  assetId?: string | null; // null to unlink, string to link to asset
  listingId?: string | null; // null to unlink, string to link to listing
}

export interface UploadDocumentRequest {
  file: File;
  name?: string;
  type?: string;
  folderId?: string;
}

export interface DataRoomWithDocuments extends DataRoom {
  documents: DataRoomDocument[];
}

// ==================== API Functions ====================

/**
 * Create a new data room
 */
export async function createDataRoom(data: CreateDataRoomRequest): Promise<DataRoom> {
  if (USE_MOCK_API) {
    return mockDataRooms.mockCreateDataRoom(data);
  }
  
  return api.post<DataRoom>('/data-rooms', data);
}

/**
 * Get data room by ID
 */
export async function getDataRoom(dataRoomId: string): Promise<DataRoomWithDocuments> {
  if (USE_MOCK_API) {
    return mockDataRooms.mockGetDataRoom(dataRoomId);
  }
  
  try {
    return await api.get<DataRoomWithDocuments>(`/data-rooms/${dataRoomId}`);
  } catch (error: any) {
    // Always fall back to mock data for development when API fails
    if (error.status === 404) {
      return null;
    }
    console.warn('[Data Rooms Service] Backend unavailable, using mock data');
    return mockDataRooms.mockGetDataRoom(dataRoomId);
  }
}

/**
 * Get data room by listing ID
 */
export async function getDataRoomByListing(listingId: string): Promise<DataRoomWithDocuments | null> {
  if (USE_MOCK_API) {
    return mockDataRooms.mockGetDataRoomByAsset(listingId); // Use asset ID function as fallback
  }
  
  try {
    return await api.get<DataRoomWithDocuments>(`/data-rooms/listing/${listingId}`);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    // Always fall back to mock data for development when API fails
    console.warn('[Data Rooms Service] Backend unavailable, using mock data');
    return mockDataRooms.mockGetDataRoomByAsset(listingId);
  }
}

/**
 * Get data room by asset ID
 */
export async function getDataRoomByAsset(assetId: string): Promise<DataRoomWithDocuments | null> {
  if (USE_MOCK_API) {
    return mockDataRooms.mockGetDataRoomByAsset(assetId);
  }
  
  try {
    return await api.get<DataRoomWithDocuments>(`/data-rooms/asset/${assetId}`);
  } catch (error: any) {
    // Always fall back to mock data for development when API fails
    if (error.status === 404) {
      return null;
    }
    console.warn('[Data Rooms Service] Backend unavailable, using mock data');
    return mockDataRooms.mockGetDataRoomByAsset(assetId);
  }
}

/**
 * List all data rooms for the current user
 */
export async function listDataRooms(options?: {
  listingId?: string;
  assetId?: string;
  status?: 'incomplete' | 'complete' | 'pending_review';
  userId?: string;
}): Promise<DataRoomWithDocuments[]> {
  if (USE_MOCK_API) {
    return mockDataRooms.mockListDataRooms(options);
  }
  
  try {
    const params = new URLSearchParams();
    if (options?.listingId) params.append('listingId', options.listingId);
    if (options?.assetId) params.append('assetId', options.assetId);
    if (options?.status) params.append('status', options.status);
    if (options?.userId) params.append('userId', options.userId);

    const query = params.toString();
    return await api.get<DataRoomWithDocuments[]>(`/data-rooms${query ? `?${query}` : ''}`);
  } catch (error: any) {
    // Always fall back to mock data for development when API fails
    console.warn('[Data Rooms Service] Backend unavailable, using mock data');
    return mockDataRooms.mockListDataRooms(options);
  }
}

/**
 * Update data room
 */
export async function updateDataRoom(
  dataRoomId: string,
  data: UpdateDataRoomRequest
): Promise<DataRoom> {
  return api.patch<DataRoom>(`/data-rooms/${dataRoomId}`, data);
}

/**
 * Delete data room
 */
export async function deleteDataRoom(dataRoomId: string): Promise<void> {
  return api.delete(`/data-rooms/${dataRoomId}`);
}

/**
 * Upload document to data room
 */
export async function uploadDocument(
  dataRoomId: string,
  file: File,
  additionalData?: {
    name?: string;
    type?: string;
    folderId?: string;
  }
): Promise<DataRoomDocument> {
  return api.upload<DataRoomDocument>(
    `/data-rooms/${dataRoomId}/documents`,
    file,
    additionalData
  );
}

/**
 * Delete document from data room
 */
export async function deleteDocument(
  dataRoomId: string,
  documentId: string
): Promise<void> {
  return api.delete(`/data-rooms/${dataRoomId}/documents/${documentId}`);
}

