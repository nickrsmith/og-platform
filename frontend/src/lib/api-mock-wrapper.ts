/**
 * API Mock Wrapper
 * Intercepts API calls and returns mock data when USE_MOCK_API is enabled
 */

import { USE_MOCK_API } from './mock-api';
import * as mockAssets from './mock-api/assets';
import * as mockDataRooms from './mock-api/data-rooms';
import * as mockEnverus from './mock-api/enverus';

/**
 * Wrapper for assets service
 */
export const mockAssetsService = {
  listAssets: (options?: any) => USE_MOCK_API ? mockAssets.mockListAssets(options) : null,
  getAsset: (id: string) => USE_MOCK_API ? mockAssets.mockGetAsset(id) : null,
  createAsset: (data: any) => USE_MOCK_API ? mockAssets.mockCreateAsset(data) : null,
  updateAsset: (id: string, data: any) => USE_MOCK_API ? mockAssets.mockUpdateAsset(id, data) : null,
  deleteAsset: (id: string) => USE_MOCK_API ? mockAssets.mockDeleteAsset(id) : null,
  getPortfolio: (userId?: string) => USE_MOCK_API ? mockAssets.mockGetPortfolio(userId) : null,
  getAssetMetrics: (id: string) => USE_MOCK_API ? mockAssets.mockGetAssetMetrics(id) : null,
};

/**
 * Wrapper for data rooms service
 */
export const mockDataRoomsService = {
  listDataRooms: (options?: any) => USE_MOCK_API ? mockDataRooms.mockListDataRooms(options) : null,
  getDataRoom: (id: string) => USE_MOCK_API ? mockDataRooms.mockGetDataRoom(id) : null,
  getDataRoomByAsset: (assetId: string) => USE_MOCK_API ? mockDataRooms.mockGetDataRoomByAsset(assetId) : null,
  createDataRoom: (data: any) => USE_MOCK_API ? mockDataRooms.mockCreateDataRoom(data) : null,
  updateDataRoom: (id: string, data: any) => USE_MOCK_API ? mockDataRooms.mockUpdateDataRoom(id, data) : null,
  deleteDataRoom: (id: string) => USE_MOCK_API ? mockDataRooms.mockDeleteDataRoom(id) : null,
  uploadDocument: (id: string, file: File, additionalData?: any) => USE_MOCK_API ? mockDataRooms.mockUploadDocument(id, file, additionalData) : null,
  deleteDocument: (dataRoomId: string, documentId: string) => USE_MOCK_API ? mockDataRooms.mockDeleteDocument(dataRoomId, documentId) : null,
};

/**
 * Wrapper for Enverus service
 */
export const mockEnverusService = {
  verify: (request: any) => USE_MOCK_API ? mockEnverus.mockEnverusVerify(request) : null,
  getProductionData: (assetId: string) => USE_MOCK_API ? mockEnverus.mockEnverusProductionData(assetId) : null,
  getWellData: (county: string, state: string) => USE_MOCK_API ? mockEnverus.mockEnverusWellData(county, state) : null,
};

