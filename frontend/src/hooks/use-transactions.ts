/**
 * Transactions Hooks
 * React hooks for transaction-related API calls using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTransaction,
  getTransaction,
  listTransactions,
  depositEarnest,
  completeDueDiligence,
  fundTransaction,
  closeTransaction,
  getSettlementStatement,
  type Transaction,
  type TransactionListResponse,
  type CreateTransactionRequest,
  type DepositEarnestRequest,
  type CompleteDueDiligenceRequest,
  type FundTransactionRequest,
  type CloseTransactionRequest,
  type SettlementStatement,
  type TransactionStatus,
} from '@/lib/services/transactions.service';

/**
 * Hook to get a single transaction
 */
export function useTransaction(id: string | null) {
  return useQuery<Transaction>({
    queryKey: ['transactions', id],
    queryFn: () => getTransaction(id!),
    enabled: !!id,
  });
}

/**
 * Hook to list transactions
 */
export function useTransactions(options?: {
  page?: number;
  pageSize?: number;
  buyerId?: string;
  sellerId?: string;
  assetId?: string;
  status?: TransactionStatus;
}) {
  return useQuery<TransactionListResponse>({
    queryKey: ['transactions', 'list', options],
    queryFn: () => listTransactions(options),
  });
}

/**
 * Hook to create a transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      idempotencyKey,
    }: {
      data: CreateTransactionRequest;
      idempotencyKey: string;
    }) => createTransaction(data, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

/**
 * Hook to deposit earnest money
 */
export function useDepositEarnest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      data,
      idempotencyKey,
    }: {
      transactionId: string;
      data: DepositEarnestRequest;
      idempotencyKey: string;
    }) => depositEarnest(transactionId, data, idempotencyKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', variables.transactionId],
      });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'list'] });
    },
  });
}

/**
 * Hook to complete due diligence
 */
export function useCompleteDueDiligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      data,
      idempotencyKey,
    }: {
      transactionId: string;
      data: CompleteDueDiligenceRequest;
      idempotencyKey: string;
    }) => completeDueDiligence(transactionId, data, idempotencyKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', variables.transactionId],
      });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'list'] });
    },
  });
}

/**
 * Hook to fund a transaction
 */
export function useFundTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      data,
      idempotencyKey,
    }: {
      transactionId: string;
      data: FundTransactionRequest;
      idempotencyKey: string;
    }) => fundTransaction(transactionId, data, idempotencyKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', variables.transactionId],
      });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'list'] });
    },
  });
}

/**
 * Hook to close a transaction
 */
export function useCloseTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      data,
      idempotencyKey,
    }: {
      transactionId: string;
      data: CloseTransactionRequest;
      idempotencyKey: string;
    }) => closeTransaction(transactionId, data, idempotencyKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', variables.transactionId],
      });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'list'] });
    },
  });
}

/**
 * Hook to get settlement statement
 */
export function useSettlementStatement(transactionId: string | null) {
  return useQuery<SettlementStatement>({
    queryKey: ['transactions', transactionId, 'settlement-statement'],
    queryFn: () => getSettlementStatement(transactionId!),
    enabled: !!transactionId,
  });
}

