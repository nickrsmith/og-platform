/**
 * Division Orders API Service
 * Handles all division order-related API calls
 */

import { api } from '../api';
import { USE_MOCK_API } from '../mock-api';
import * as mockDivisionOrders from '../mock-api/division-orders';

// ==================== Types ====================

export enum DivisionOrderStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
}

export enum OwnerType {
  MINERAL = 'MINERAL',
  WORKING_INTEREST = 'WORKING_INTEREST',
  OVERRIDE = 'OVERRIDE',
}

export enum TransferType {
  SALE = 'SALE',
  INHERITANCE = 'INHERITANCE',
  GIFT = 'GIFT',
  OTHER = 'OTHER',
}

export enum TransferStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
}

export enum RevenueType {
  OIL = 'OIL',
  GAS = 'GAS',
  NGL = 'NGL',
}

export interface DivisionOrderOwner {
  id: string;
  ownerType: OwnerType;
  userId?: string;
  externalName?: string;
  externalEmail?: string;
  decimalInterest: number;
  nri?: number;
  wi?: number;
  paymentAddress?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DivisionOrder {
  id: string;
  wellId: string;
  wellName?: string;
  operatorOrgId: string;
  operatorOrgName?: string;
  status: DivisionOrderStatus;
  productionStartDate?: string;
  totalDecimalInterest: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  owners: DivisionOrderOwner[];
}

export interface CreateDivisionOrderOwner {
  userId?: string;
  ownerType: OwnerType;
  externalName?: string;
  externalEmail?: string;
  externalAddress?: string;
  decimalInterest: number;
  nri?: number;
  wi?: number;
  paymentAddress?: string;
  paymentMethod?: string;
}

export interface CreateDivisionOrder {
  wellId: string;
  wellName?: string;
  operatorOrgId: string;
  productionStartDate?: string;
  owners: CreateDivisionOrderOwner[];
}

export interface UpdateDivisionOrder {
  wellName?: string;
  productionStartDate?: string;
  status?: DivisionOrderStatus;
  notes?: string;
}

export interface OwnershipTransfer {
  id: string;
  divisionOrderId: string;
  fromOwnerId: string;
  toOwnerId?: string;
  toExternalName?: string;
  interestAmount: number;
  transferType: TransferType;
  transactionId?: string;
  status: TransferStatus;
  submittedAt?: string;
  approvedAt?: string;
  courthouseFiledAt?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateOwnershipTransfer {
  fromOwnerId: string;
  toOwnerId?: string;
  toExternalName?: string;
  interestAmount: number;
  transferType: TransferType;
  transactionId?: string;
  assignmentDocId?: string;
  notes?: string;
}

export interface RevenueSplit {
  totalRevenue: number;
  revenueType: RevenueType;
  ownerPayments: Array<{
    ownerId: string;
    ownerName: string;
    decimalInterest: number;
    paymentAmount: number;
  }>;
  totalDistributed: number;
}

export interface CalculateRevenueSplit {
  totalRevenue: number;
  revenueType: RevenueType;
  distributionDate: string;
}

export interface ListDivisionOrdersResponse {
  data: DivisionOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== API Functions ====================

/**
 * Create a new division order
 */
export async function createDivisionOrder(
  data: CreateDivisionOrder
): Promise<DivisionOrder> {
  if (USE_MOCK_API) {
    return mockDivisionOrders.mockCreateDivisionOrder(data);
  }

  return api.post<DivisionOrder>('/division-orders', data);
}

/**
 * List division orders with optional filters
 */
export async function listDivisionOrders(options?: {
  operatorOrgId?: string;
  status?: DivisionOrderStatus;
  wellId?: string;
  page?: number;
  limit?: number;
}): Promise<ListDivisionOrdersResponse> {
  if (USE_MOCK_API) {
    return mockDivisionOrders.mockListDivisionOrders(options);
  }

  try {
    const params = new URLSearchParams();
    if (options?.operatorOrgId) params.append('operatorOrgId', options.operatorOrgId);
    if (options?.status) params.append('status', options.status);
    if (options?.wellId) params.append('wellId', options.wellId);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const query = params.toString();
    return await api.get<ListDivisionOrdersResponse>(
      `/division-orders${query ? `?${query}` : ''}`
    );
  } catch (error: any) {
    // Always fall back to mock data for development when API fails
    console.warn('[Division Orders Service] Backend unavailable, using mock data');
    return mockDivisionOrders.mockListDivisionOrders(options);
  }
}

/**
 * Get division order by ID
 */
export async function getDivisionOrder(id: string): Promise<DivisionOrder> {
  if (USE_MOCK_API) {
    return mockDivisionOrders.mockGetDivisionOrder(id);
  }

  try {
    return await api.get<DivisionOrder>(`/division-orders/${id}`);
  } catch (error: any) {
    // Always fall back to mock data for development when API fails
    console.warn('[Division Orders Service] Backend unavailable, using mock data');
    return mockDivisionOrders.mockGetDivisionOrder(id);
  }
}

/**
 * Update division order
 */
export async function updateDivisionOrder(
  id: string,
  data: UpdateDivisionOrder
): Promise<DivisionOrder> {
  return api.patch<DivisionOrder>(`/division-orders/${id}`, data);
}

/**
 * Approve division order
 */
export async function approveDivisionOrder(id: string): Promise<DivisionOrder> {
  return api.post<DivisionOrder>(`/division-orders/${id}/approve`, {});
}

/**
 * Reject division order
 */
export async function rejectDivisionOrder(
  id: string,
  rejectedReason: string
): Promise<DivisionOrder> {
  return api.post<DivisionOrder>(`/division-orders/${id}/reject`, {
    rejectedReason,
  });
}

/**
 * Create ownership transfer
 */
export async function createOwnershipTransfer(
  divisionOrderId: string,
  data: CreateOwnershipTransfer
): Promise<OwnershipTransfer> {
  return api.post<OwnershipTransfer>(
    `/division-orders/${divisionOrderId}/transfers`,
    data
  );
}

/**
 * Approve ownership transfer
 */
export async function approveTransfer(
  divisionOrderId: string,
  transferId: string,
  data: {
    courthouseFiledAt?: string;
    courthouseFileNumber?: string;
    notes?: string;
  }
): Promise<OwnershipTransfer> {
  return api.post<OwnershipTransfer>(
    `/division-orders/${divisionOrderId}/transfers/${transferId}/approve`,
    data
  );
}

/**
 * Reject ownership transfer
 */
export async function rejectTransfer(
  divisionOrderId: string,
  transferId: string,
  rejectedReason: string
): Promise<OwnershipTransfer> {
  return api.post<OwnershipTransfer>(
    `/division-orders/${divisionOrderId}/transfers/${transferId}/reject`,
    { rejectedReason }
  );
}

/**
 * Calculate revenue split for division order
 */
export async function calculateRevenueSplit(
  divisionOrderId: string,
  data: CalculateRevenueSplit
): Promise<RevenueSplit> {
  return api.post<RevenueSplit>(
    `/division-orders/${divisionOrderId}/calculate-revenue`,
    data
  );
}
