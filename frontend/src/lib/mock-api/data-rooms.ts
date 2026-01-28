/**
 * Mock Data Rooms API
 */

import { delay, mockResponse, mockError } from './index';
import type { DataRoom, DataRoomDocument } from '@shared/schema';
import { mockAssets } from '../mock-data';
import { getMockAssetsStore } from './assets';

let mockDataRoomsStore: (DataRoom & { documents: DataRoomDocument[] })[] = [];
let nextDataRoomId = 1;
let initialized = false;

function generateDataRoomId(): string {
  return `dataroom-${nextDataRoomId++}`;
}

/**
 * Create a data room directly (used by assets API)
 */
export function createDataRoomForAsset(assetId: string, assetName: string, category: 'A' | 'B' | 'C') {
  const dataRoom: DataRoom & { documents: DataRoomDocument[] } = {
    id: generateDataRoomId(),
    name: `${assetName} - Data Room`,
    assetId: assetId,
    tier: category === 'C' ? 'simple' : category === 'B' ? 'standard' : 'premium',
    access: 'restricted',
    status: 'complete',
    documents: [
      {
        id: `doc-${assetId}-1`,
        name: 'Title Opinion',
        type: 'legal',
        size: '2.1 MB',
        uploadedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `doc-${assetId}-2`,
        name: 'Production Report',
        type: 'production',
        size: '850 KB',
        uploadedAt: new Date().toISOString().split('T')[0],
      },
    ],
    accessLog: [],
  };
  
  mockDataRoomsStore.push(dataRoom);
  return dataRoom;
}

/**
 * Initialize data rooms for all existing mock assets
 */
function initializeDataRoomsForMockAssets() {
  if (initialized) return;
  
  // Create a data room for each mock asset
  mockAssets.forEach((asset) => {
    const dataRoom: DataRoom & { documents: DataRoomDocument[] } = {
      id: generateDataRoomId(),
      name: `${asset.name} - Data Room`,
      assetId: asset.id,
      tier: asset.category === 'C' ? 'simple' : asset.category === 'B' ? 'standard' : 'premium',
      access: 'restricted',
      status: 'complete',
      documents: [
        {
          id: `doc-${asset.id}-1`,
          name: 'Title Opinion',
          type: 'legal',
          size: '2.1 MB',
          uploadedAt: asset.createdAt || '2024-12-01',
        },
        {
          id: `doc-${asset.id}-2`,
          name: 'Production Report',
          type: 'production',
          size: '850 KB',
          uploadedAt: asset.createdAt || '2024-12-01',
        },
      ],
      accessLog: [],
    };
    
    mockDataRoomsStore.push(dataRoom);
  });
  
  initialized = true;
}

/**
 * Ensure all user assets have data rooms
 */
function ensureDataRoomsForUserAssets(userId?: string) {
  try {
    const allAssets = getMockAssetsStore();
    // If userId is provided, filter to user's assets, otherwise check 'current-user'
    const effectiveUserId = userId || 'current-user';
    
    // Match multiple possible user ID formats
    // - Direct match: ownerId === userId
    // - 'dev-user-1' should match 'dev-user-1' or 'current-user'
    // - 'current-user' should match assets with ownerId 'current-user' or any user ID if no specific user
    const userAssets = allAssets.filter(a => {
      // Direct match
      if (a.ownerId === effectiveUserId) return true;
      
      // If userId is 'current-user', match assets with 'current-user' ownerId
      if (effectiveUserId === 'current-user' && a.ownerId === 'current-user') return true;
      
      // If userId is 'dev-user-1' (common dev user), match 'dev-user-1' assets
      if (effectiveUserId === 'dev-user-1' && a.ownerId === 'dev-user-1') return true;
      
      // If no userId specified, include unassigned assets
      if (!userId && !a.ownerId) return true;
      
      return false;
    });
    
    // Create data rooms for assets that don't have one
    let createdCount = 0;
    userAssets.forEach((asset) => {
      const existingDataRoom = mockDataRoomsStore.find(dr => dr.assetId === asset.id);
      if (!existingDataRoom) {
        createDataRoomForAsset(asset.id, asset.name, asset.category);
        createdCount++;
      }
    });
    
    if (createdCount > 0) {
      console.log(`Created ${createdCount} data room(s) for user assets (userId: ${effectiveUserId})`);
      console.log(`User assets found: ${userAssets.map(a => `${a.name} (${a.id})`).join(', ')}`);
    } else if (userAssets.length > 0) {
      console.log(`Found ${userAssets.length} user assets, all already have data rooms (userId: ${effectiveUserId})`);
    } else {
      console.log(`No user assets found for userId: ${effectiveUserId}`);
      console.log(`Available assets with ownerIds: ${allAssets.map(a => `${a.name} (ownerId: ${a.ownerId})`).join(', ')}`);
    }
  } catch (error) {
    // Log error instead of silently failing
    console.error('Could not ensure data rooms for user assets:', error);
  }
}

export async function mockListDataRooms(options?: {
  listingId?: string;
  assetId?: string;
  status?: 'incomplete' | 'complete' | 'pending_review';
  userId?: string;
}) {
  await delay();
  
  // Initialize data rooms for all mock assets on first call
  initializeDataRoomsForMockAssets();
  
  // Always ensure all user assets have data rooms (unless querying for a specific asset)
  // This ensures any newly created assets get data rooms
  if (!options?.assetId) {
    ensureDataRoomsForUserAssets(options?.userId);
  }
  
  // Also ensure data rooms exist for all assets (in case some were accessed via getDataRoomByAsset)
  // This catches any data rooms that were created on-the-fly but should be in the main list
  const allAssets = getMockAssetsStore();
  const effectiveUserId = options?.userId || 'current-user';
  
  // Check for any assets that might have data rooms accessed but not yet in store
  allAssets.forEach(asset => {
    // Skip if filtering by specific asset
    if (options?.assetId && asset.id !== options.assetId) return;
    
    // Only check user's assets if userId is provided
    if (options?.userId) {
      const isUserAsset = asset.ownerId === effectiveUserId || 
                         asset.ownerId === 'current-user' ||
                         (effectiveUserId === 'dev-user-1' && asset.ownerId === 'dev-user-1');
      if (!isUserAsset) return;
    }
    
    // Check if data room exists, if not, create it
    const existingDataRoom = mockDataRoomsStore.find(dr => dr.assetId === asset.id);
    if (!existingDataRoom) {
      createDataRoomForAsset(asset.id, asset.name, asset.category);
    }
  });
  
  let filtered = [...mockDataRoomsStore];
  
  // Filter by assetId if specified
  if (options?.assetId) {
    filtered = filtered.filter(dr => dr.assetId === options.assetId);
  }
  
  // Filter by listingId if specified
  if (options?.listingId) {
    filtered = filtered.filter(dr => (dr as any).listingId === options.listingId);
  }
  
  // Filter by status if specified
  if (options?.status) {
    filtered = filtered.filter(dr => dr.status === options.status);
  }
  
  // Note: We don't filter by userId here - the UI handles ownership filtering
  // This ensures all data rooms are available, and the UI can determine ownership
  // based on asset ownership relationships
  
  console.log(`[mockListDataRooms] Returning ${filtered.length} data rooms (userId: ${options?.userId || 'none'}, assetId: ${options?.assetId || 'none'})`);
  if (filtered.length > 0) {
    console.log(`[mockListDataRooms] Data room assetIds: ${filtered.map(dr => dr.assetId || 'none').join(', ')}`);
  }
  
  return mockResponse(filtered);
}

export async function mockGetDataRoom(dataRoomId: string) {
  await delay();
  
  const dataRoom = mockDataRoomsStore.find(dr => dr.id === dataRoomId);
  
  if (!dataRoom) {
    return mockError('Data room not found', 404);
  }
  
  return mockResponse(dataRoom);
}

export async function mockGetDataRoomByAsset(assetId: string) {
  await delay();
  
  // Initialize data rooms for all mock assets on first call
  initializeDataRoomsForMockAssets();
  
  let dataRoom = mockDataRoomsStore.find(dr => dr.assetId === assetId);
  
  // If no data room exists, create one automatically
  if (!dataRoom) {
    // Try to find the asset to get its name
    const allAssets = getMockAssetsStore();
    const asset = allAssets.find(a => a.id === assetId);
    const assetName = asset?.name || `Asset ${assetId}`;
    const assetCategory = asset?.category || 'C';
    
    dataRoom = {
      id: generateDataRoomId(),
      name: `${assetName} - Data Room`,
      assetId: assetId,
      tier: assetCategory === 'C' ? 'simple' : assetCategory === 'B' ? 'standard' : 'premium',
      access: 'restricted',
      status: 'complete',
      documents: [
        {
          id: `doc-${assetId}-1`,
          name: 'Title Opinion',
          type: 'legal',
          size: '2.1 MB',
          uploadedAt: new Date().toISOString().split('T')[0],
        },
        {
          id: `doc-${assetId}-2`,
          name: 'Production Report',
          type: 'production',
          size: '850 KB',
          uploadedAt: new Date().toISOString().split('T')[0],
        },
      ],
      accessLog: [],
    };
    mockDataRoomsStore.push(dataRoom);
    console.log(`[mockGetDataRoomByAsset] Auto-created data room for asset ${assetId}: ${dataRoom.name}`);
  }
  
  return mockResponse(dataRoom);
}

export async function mockCreateDataRoom(data: any) {
  await delay(400);
  
  const newDataRoom: DataRoom & { documents: DataRoomDocument[] } = {
    id: generateDataRoomId(),
    name: data.name,
    assetId: data.assetId,
    listingId: data.listingId,
    tier: data.tier || 'standard',
    access: data.access || 'restricted',
    status: 'incomplete',
    documents: [],
    accessLog: [],
  };
  
  mockDataRoomsStore.push(newDataRoom);
  
  return mockResponse(newDataRoom);
}

export async function mockUpdateDataRoom(dataRoomId: string, data: any) {
  await delay(300);
  
  const index = mockDataRoomsStore.findIndex(dr => dr.id === dataRoomId);
  
  if (index === -1) {
    return mockError('Data room not found', 404);
  }
  
  mockDataRoomsStore[index] = { ...mockDataRoomsStore[index], ...data };
  
  return mockResponse(mockDataRoomsStore[index]);
}

export async function mockDeleteDataRoom(dataRoomId: string) {
  await delay(300);
  
  const index = mockDataRoomsStore.findIndex(dr => dr.id === dataRoomId);
  
  if (index === -1) {
    return mockError('Data room not found', 404);
  }
  
  mockDataRoomsStore.splice(index, 1);
  
  return mockResponse(undefined);
}

export async function mockUploadDocument(dataRoomId: string, file: File, additionalData?: any) {
  await delay(800);
  
  const dataRoom = mockDataRoomsStore.find(dr => dr.id === dataRoomId);
  
  if (!dataRoom) {
    return mockError('Data room not found', 404);
  }
  
  const newDoc: DataRoomDocument = {
    id: `doc-${Date.now()}`,
    name: additionalData?.name || file.name,
    type: additionalData?.type || 'legal',
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    uploadedAt: new Date().toISOString().split('T')[0],
  };
  
  dataRoom.documents.push(newDoc);
  
  return mockResponse(newDoc);
}

export async function mockDeleteDocument(dataRoomId: string, documentId: string) {
  await delay(300);
  
  const dataRoom = mockDataRoomsStore.find(dr => dr.id === dataRoomId);
  
  if (!dataRoom) {
    return mockError('Data room not found', 404);
  }
  
  const docIndex = dataRoom.documents.findIndex(d => d.id === documentId);
  
  if (docIndex === -1) {
    return mockError('Document not found', 404);
  }
  
  dataRoom.documents.splice(docIndex, 1);
  
  return mockResponse(undefined);
}

