import { Prisma } from '@prisma/client';
import { ChainEventType } from '../enums/chain-event-type.enum';
import { ChainTransactionStatus } from '../enums/chain-transaction-status.enum';
import { StoragePool } from '../enums/ipfs-storage-pool.enum';
import { LicensePermissions } from '../enums/license-permissions.enum';
import { AssetType } from '../enums/asset-type.enum';
import { AssetCategory } from '../enums/asset-category.enum';
import { ProductionStatus } from '../enums/production-status.enum';

export interface CreateOrgContractPayload {
  txId: string;
  organizationId: string;
  principalUserId: string;
  principalWalletAddress: string;
  platformVerifierWalletAddress: string;
}

export interface FundUserWalletPayload {
  txId: string;
  recipientAddress: string;
}

export interface GrantAssetManagerRolePayload {
  organizationId: string;
  userWalletAddress: string;
}

export interface RevokeAssetManagerRolePayload {
  organizationId: string;
  userWalletAddress: string;
}

export interface CreateAssetPayload {
  txId: string;
  userId: string;
  releaseId: string;
  onChainAssetId: string;
  siteAddress: string;
  actorPeerId: string;
  assetCID: string;
  metadataHash: string;
  assetHash: string;
  price: string;
  isEncrypted: boolean;
  canBeLicensed: boolean;
  fxPool: StoragePool;
  timeStamp: string;
  // O&G-specific fields
  assetType?: AssetType;
  category?: AssetCategory;
  productionStatus?: ProductionStatus;
  basin?: string;
  acreage?: number;
  state?: string;
  county?: string;
  location?: string;
  projectedROI?: number;
}

export interface VerifyAssetPayload {
  releaseId: string;
  siteAddress: string;
  onChainAssetId: string;
}

export interface LicenseAssetPayload {
  txId: string;
  userId: string; // ID of the buyer, needed for KMS
  releaseId: string; // Off-chain ID for logging/reconciliation
  siteAddress: string;

  // --- On-Chain Data ---
  onChainAssetId: string; // The uint256 ID for the smart contract call
  price: string; // The full price (e.g., "1000000" for 1 USDC) for the approve() call

  // --- License Parameters ---
  permissions: LicensePermissions[];
  resellerFee: string;

  // --- Analytics Data (passed through for reconciliation) ---
  buyerPeerId: string;
  creatorPeerId: string;
}

export interface WithdrawOrgEarningsPayload {
  organizationId: string;
  principalUserId: string;
}

export type BlockchainJobPayload =
  | CreateOrgContractPayload
  | FundUserWalletPayload
  | CreateAssetPayload
  | VerifyAssetPayload
  | LicenseAssetPayload
  | GrantAssetManagerRolePayload
  | RevokeAssetManagerRolePayload
  | WithdrawOrgEarningsPayload;

export function getTypedPayload<T extends BlockchainJobPayload>(
  eventType: ChainEventType,
  payload: Prisma.JsonValue,
): T {
  // We can add more robust checks here in the future if needed,
  // for example, checking for the presence of specific keys.
  // For now, a direct cast after the switch provides type safety.
  return payload as unknown as T;
}

export interface TransactionFinalizedEvent {
  id: string;
  jobId: string;
  eventType: ChainEventType;
  finalStatus: ChainTransactionStatus.CONFIRMED | ChainTransactionStatus.FAILED;
  txHash: string;
  blockNumber: string;
  submittedAt: string;
  finalizedAt: string;
  originalPayload: Prisma.JsonValue;
  error: string | null;
  eventOutput?: Record<string, unknown>;
}
