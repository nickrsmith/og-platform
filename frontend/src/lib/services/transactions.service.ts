/**
 * Transaction Management API Service
 * Handles all transaction-related API calls
 */

import { api } from '../api';

// ==================== Types ====================

export type TransactionStatus =
  | 'PENDING'
  | 'EARNEST_DEPOSITED'
  | 'DUE_DILIGENCE'
  | 'FUNDING'
  | 'CLOSED'
  | 'CANCELLED'
  | 'FAILED';

export interface Transaction {
  id: string;
  offerId: string;
  assetId: string;
  buyerId: string;
  sellerId: string;
  purchasePrice: number;
  earnestAmount: number;
  status: TransactionStatus;
  earnestDepositedAt?: string;
  ddCompletedAt?: string;
  fundedAt?: string;
  closedAt?: string;
  onChainTxHash?: string;
  platformFee: number;
  integratorFee: number;
  creatorAmount: number;
  netProceeds: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateTransactionRequest {
  offerId: string;
  notes?: string;
}

export interface DepositEarnestRequest {
  amount: number;
  depositedAt: string;
  notes?: string;
}

export interface CompleteDueDiligenceRequest {
  completedAt: string;
  notes?: string;
}

export interface FundTransactionRequest {
  amount: number;
  fundedAt: string;
  onChainTxHash?: string;
  notes?: string;
}

export interface CloseTransactionRequest {
  closedAt: string;
  onChainTxHash?: string;
  notes?: string;
}

export interface SettlementStatement {
  transactionId: string;
  buyerName: string;
  sellerName: string;
  assetId: string;
  closingDate: string;
  purchasePrice: number;
  earnestAmount: number;
  fees: {
    platformFee: number;
    integratorFee: number;
    totalFees: number;
  };
  prorations: {
    propertyTaxes: number;
    royalties: number;
  };
  adjustments: {
    titleInsurance: number;
  };
  totals: {
    totalProrations: number;
    totalAdjustments: number;
    grossProceeds: number;
    netProceeds: number;
  };
}

// ==================== API Functions ====================

/**
 * Create a transaction from an accepted offer
 */
export async function createTransaction(
  data: CreateTransactionRequest,
  idempotencyKey: string
): Promise<Transaction> {
  return api.post<Transaction>('/transactions', data, {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
}

/**
 * Get transaction by ID
 */
export async function getTransaction(id: string): Promise<Transaction> {
  return api.get<Transaction>(`/transactions/${id}`);
}

/**
 * List transactions with optional filters
 */
export async function listTransactions(options?: {
  page?: number;
  pageSize?: number;
  buyerId?: string;
  sellerId?: string;
  assetId?: string;
  status?: TransactionStatus;
}): Promise<TransactionListResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
  if (options?.buyerId) params.append('buyerId', options.buyerId);
  if (options?.sellerId) params.append('sellerId', options.sellerId);
  if (options?.assetId) params.append('assetId', options.assetId);
  if (options?.status) params.append('status', options.status);

  const query = params.toString();
  return api.get<TransactionListResponse>(
    `/transactions${query ? `?${query}` : ''}`
  );
}

/**
 * Deposit earnest money for a transaction
 */
export async function depositEarnest(
  transactionId: string,
  data: DepositEarnestRequest,
  idempotencyKey: string
): Promise<Transaction> {
  return api.post<Transaction>(
    `/transactions/${transactionId}/deposit-earnest`,
    data,
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
}

/**
 * Complete due diligence for a transaction
 */
export async function completeDueDiligence(
  transactionId: string,
  data: CompleteDueDiligenceRequest,
  idempotencyKey: string
): Promise<Transaction> {
  return api.post<Transaction>(
    `/transactions/${transactionId}/complete-due-diligence`,
    data,
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
}

/**
 * Fund a transaction
 */
export async function fundTransaction(
  transactionId: string,
  data: FundTransactionRequest,
  idempotencyKey: string
): Promise<Transaction> {
  return api.post<Transaction>(
    `/transactions/${transactionId}/fund`,
    data,
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
}

/**
 * Close a transaction
 */
export async function closeTransaction(
  transactionId: string,
  data: CloseTransactionRequest,
  idempotencyKey: string
): Promise<Transaction> {
  return api.post<Transaction>(
    `/transactions/${transactionId}/close`,
    data,
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
}

/**
 * Get settlement statement for a transaction
 */
export async function getSettlementStatement(
  transactionId: string
): Promise<SettlementStatement> {
  return api.get<SettlementStatement>(
    `/transactions/${transactionId}/settlement-statement`
  );
}

