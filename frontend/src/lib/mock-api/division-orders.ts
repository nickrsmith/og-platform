/**
 * Mock Division Orders API
 * Provides comprehensive mock data for division orders endpoints
 */

import { delay, mockResponse } from './index';
import type {
  DivisionOrder,
  DivisionOrderStatus,
  OwnerType,
  ListDivisionOrdersResponse,
  CreateDivisionOrder,
  UpdateDivisionOrder,
  OwnershipTransfer,
  CreateOwnershipTransfer,
  RevenueSplit,
  CalculateRevenueSplit,
} from '../services/division-orders.service';

// Mock division orders data
const mockDivisionOrders: DivisionOrder[] = [
  {
    id: '1',
    wellId: 'well-1',
    wellName: 'Permian Basin Unit #42',
    operatorOrgId: 'org-1',
    operatorOrgName: 'Pioneer Natural Resources',
    status: 'APPROVED' as DivisionOrderStatus,
    productionStartDate: '2024-01-01',
    totalDecimalInterest: 100,
    notes: 'Fully approved and active',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    approvedAt: '2024-01-15T00:00:00Z',
    approvedBy: 'admin-1',
    owners: [
      {
        id: 'owner-1',
        ownerType: 'WORKING_INTEREST' as OwnerType,
        userId: 'user-1',
        decimalInterest: 75.5,
        nri: 56.625,
        wi: 75.5,
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
      {
        id: 'owner-2',
        ownerType: 'MINERAL' as OwnerType,
        externalName: 'Smith Family Trust',
        externalEmail: 'smith@example.com',
        decimalInterest: 24.5,
        nri: 19.6,
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
    ],
  },
  {
    id: '2',
    wellId: 'well-2',
    wellName: 'Eagle Ford A-1H',
    operatorOrgId: 'org-2',
    operatorOrgName: 'EOG Resources',
    status: 'SUBMITTED' as DivisionOrderStatus,
    productionStartDate: '2024-02-01',
    totalDecimalInterest: 100,
    notes: 'Pending review',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    owners: [
      {
        id: 'owner-3',
        ownerType: 'WORKING_INTEREST' as OwnerType,
        userId: 'user-2',
        decimalInterest: 100,
        nri: 75,
        wi: 100,
        isActive: true,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      },
    ],
  },
  {
    id: '3',
    wellId: 'well-3',
    wellName: 'Bakken North 14-22H',
    operatorOrgId: 'org-3',
    operatorOrgName: 'ConocoPhillips',
    status: 'PENDING' as DivisionOrderStatus,
    productionStartDate: undefined,
    totalDecimalInterest: 100,
    notes: 'Awaiting title opinion',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    owners: [
      {
        id: 'owner-4',
        ownerType: 'OVERRIDE' as OwnerType,
        externalName: 'Johnson Interests',
        externalEmail: 'johnson@example.com',
        decimalInterest: 3.5,
        nri: 3.5,
        isActive: true,
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z',
      },
    ],
  },
  {
    id: '4',
    wellId: 'well-4',
    wellName: 'Delaware Basin 7H',
    operatorOrgId: 'org-4',
    operatorOrgName: 'Devon Energy',
    status: 'APPROVED' as DivisionOrderStatus,
    productionStartDate: '2023-12-01',
    totalDecimalInterest: 100,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
    approvedAt: '2024-01-08T00:00:00Z',
    approvedBy: 'admin-2',
    owners: [
      {
        id: 'owner-5',
        ownerType: 'MINERAL' as OwnerType,
        userId: 'user-3',
        decimalInterest: 50,
        nri: 40,
        isActive: true,
        createdAt: '2024-01-08T00:00:00Z',
        updatedAt: '2024-01-08T00:00:00Z',
      },
      {
        id: 'owner-6',
        ownerType: 'MINERAL' as OwnerType,
        externalName: 'Brown Minerals LLC',
        externalEmail: 'brown@example.com',
        decimalInterest: 50,
        nri: 40,
        isActive: true,
        createdAt: '2024-01-08T00:00:00Z',
        updatedAt: '2024-01-08T00:00:00Z',
      },
    ],
  },
  {
    id: '5',
    wellId: 'well-5',
    wellName: 'Midland Basin 12-1H',
    operatorOrgId: 'org-5',
    operatorOrgName: 'Diamondback Energy',
    status: 'REJECTED' as DivisionOrderStatus,
    productionStartDate: undefined,
    totalDecimalInterest: 100,
    notes: 'Decimal interest discrepancy',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
    owners: [
      {
        id: 'owner-7',
        ownerType: 'WORKING_INTEREST' as OwnerType,
        userId: 'user-4',
        decimalInterest: 100,
        nri: 75,
        wi: 100,
        isActive: false,
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z',
      },
    ],
  },
];

let mockDivisionOrdersStore: DivisionOrder[] = [...mockDivisionOrders];
let nextDivisionOrderId = 1000;

/**
 * Generate a new division order ID
 */
function generateDivisionOrderId(): string {
  return `do-${nextDivisionOrderId++}`;
}

/**
 * Mock list division orders
 */
export async function mockListDivisionOrders(options?: {
  operatorOrgId?: string;
  status?: DivisionOrderStatus;
  wellId?: string;
  page?: number;
  limit?: number;
}): Promise<ListDivisionOrdersResponse> {
  await delay();

  let filtered = [...mockDivisionOrdersStore];

  // Apply filters
  if (options?.operatorOrgId) {
    filtered = filtered.filter((do_) => do_.operatorOrgId === options.operatorOrgId);
  }
  if (options?.status) {
    filtered = filtered.filter((do_) => do_.status === options.status);
  }
  if (options?.wellId) {
    filtered = filtered.filter((do_) => do_.wellId === options.wellId);
  }

  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  return mockResponse({
    data: filtered.slice(start, end),
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
  });
}

/**
 * Mock get division order by ID
 */
export async function mockGetDivisionOrder(id: string): Promise<DivisionOrder> {
  await delay();

  const divisionOrder = mockDivisionOrdersStore.find((do_) => do_.id === id);

  if (!divisionOrder) {
    throw new Error('Division order not found');
  }

  return mockResponse(divisionOrder);
}

/**
 * Mock create division order
 */
export async function mockCreateDivisionOrder(
  data: CreateDivisionOrder
): Promise<DivisionOrder> {
  await delay(500);

  const newDivisionOrder: DivisionOrder = {
    id: generateDivisionOrderId(),
    wellId: data.wellId,
    wellName: data.wellName,
    operatorOrgId: data.operatorOrgId,
    operatorOrgName: 'Mock Operator',
    status: 'PENDING' as DivisionOrderStatus,
    productionStartDate: data.productionStartDate,
    totalDecimalInterest: data.owners.reduce((sum, owner) => sum + owner.decimalInterest, 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owners: data.owners.map((owner, index) => ({
      id: `owner-${Date.now()}-${index}`,
      ownerType: owner.ownerType,
      userId: owner.userId,
      externalName: owner.externalName,
      externalEmail: owner.externalEmail,
      decimalInterest: owner.decimalInterest,
      nri: owner.nri,
      wi: owner.wi,
      paymentAddress: owner.paymentAddress,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  };

  mockDivisionOrdersStore.push(newDivisionOrder);

  return mockResponse(newDivisionOrder);
}

/**
 * Mock update division order
 */
export async function mockUpdateDivisionOrder(
  id: string,
  data: UpdateDivisionOrder
): Promise<DivisionOrder> {
  await delay(400);

  const index = mockDivisionOrdersStore.findIndex((do_) => do_.id === id);

  if (index === -1) {
    throw new Error('Division order not found');
  }

  mockDivisionOrdersStore[index] = {
    ...mockDivisionOrdersStore[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return mockResponse(mockDivisionOrdersStore[index]);
}

/**
 * Mock approve division order
 */
export async function mockApproveDivisionOrder(id: string): Promise<DivisionOrder> {
  await delay(400);

  const index = mockDivisionOrdersStore.findIndex((do_) => do_.id === id);

  if (index === -1) {
    throw new Error('Division order not found');
  }

  mockDivisionOrdersStore[index] = {
    ...mockDivisionOrdersStore[index],
    status: 'APPROVED' as DivisionOrderStatus,
    approvedAt: new Date().toISOString(),
    approvedBy: 'mock-admin',
    updatedAt: new Date().toISOString(),
  };

  return mockResponse(mockDivisionOrdersStore[index]);
}

/**
 * Mock reject division order
 */
export async function mockRejectDivisionOrder(
  id: string,
  rejectedReason: string
): Promise<DivisionOrder> {
  await delay(400);

  const index = mockDivisionOrdersStore.findIndex((do_) => do_.id === id);

  if (index === -1) {
    throw new Error('Division order not found');
  }

  mockDivisionOrdersStore[index] = {
    ...mockDivisionOrdersStore[index],
    status: 'REJECTED' as DivisionOrderStatus,
    notes: rejectedReason,
    updatedAt: new Date().toISOString(),
  };

  return mockResponse(mockDivisionOrdersStore[index]);
}
