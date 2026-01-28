import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsObject,
  IsDateString,
  Min,
  ValidateNested,
  IsBoolean,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from './pagination.dto';
import { FeeApplicationMode } from '../enums/fee-application-mode.enum';

export enum TransactionStatus {
  PENDING = 'PENDING',
  EARNEST_DEPOSITED = 'EARNEST_DEPOSITED',
  DUE_DILIGENCE = 'DUE_DILIGENCE',
  FUNDING = 'FUNDING',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export class TransactionDto {
  @ApiProperty({ description: 'Transaction ID', example: 'transaction-uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Offer ID that created this transaction', example: 'offer-uuid' })
  @IsUUID()
  offerId: string;

  @ApiProperty({ description: 'Asset/Release ID', example: 'asset-123' })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ description: 'Buyer user ID', example: 'buyer-uuid' })
  @IsUUID()
  buyerId: string;

  @ApiProperty({ description: 'Seller user ID', example: 'seller-uuid' })
  @IsUUID()
  sellerId: string;

  @ApiProperty({ description: 'Purchase price in USDC (6 decimals)', example: 100000 })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earnestAmount?: number;

  @IsOptional()
  @IsDateString()
  earnestDepositedAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ddPeriod?: number;

  @IsOptional()
  @IsDateString()
  ddCompletedAt?: string;

  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsNumber()
  platformFee?: number;

  @IsOptional()
  @IsNumber()
  integratorFee?: number;

  @IsOptional()
  @IsNumber()
  creatorAmount?: number;

  @IsOptional()
  @IsObject()
  prorations?: Record<string, any>;

  @IsOptional()
  @IsObject()
  adjustments?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  netProceeds?: number;

  @IsOptional()
  @IsObject()
  contingencies?: Record<string, any>;

  @IsOptional()
  @IsObject()
  terms?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  settlementStatement?: Record<string, any>;

  @IsOptional()
  @IsString()
  onChainTxHash?: string;

  @IsOptional()
  @IsString()
  escrowAddress?: string;

  @ApiPropertyOptional({
    description: 'Fee application mode: BUY_SIDE_ONLY, SELL_SIDE_ONLY, or SPLIT',
    enum: FeeApplicationMode,
    example: FeeApplicationMode.SELL_SIDE_ONLY,
  })
  @IsOptional()
  @IsEnum(FeeApplicationMode)
  feeApplicationMode?: FeeApplicationMode;

  @ApiPropertyOptional({
    description: 'Buyer side percentage for split mode (basis points, 0-10000)',
    example: 5000,
    minimum: 0,
    maximum: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  buySidePercentage?: number;

  @IsString()
  createdAt: string;

  @IsOptional()
  @IsString()
  updatedAt?: string;

  @IsOptional()
  @IsString()
  closedAt?: string;
}

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Accepted offer ID to create transaction from',
    example: 'offer-uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  offerId: string;

  @ApiPropertyOptional({
    description: 'Fee application mode: BUY_SIDE_ONLY, SELL_SIDE_ONLY, or SPLIT',
    enum: FeeApplicationMode,
    example: FeeApplicationMode.SELL_SIDE_ONLY,
  })
  @IsOptional()
  @IsEnum(FeeApplicationMode)
  feeApplicationMode?: FeeApplicationMode;

  @ApiPropertyOptional({
    description: 'Buyer side percentage for split mode (basis points, 0-10000)',
    example: 5000,
    minimum: 0,
    maximum: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  buySidePercentage?: number; // For split mode (0-10000 basis points)

  @ApiPropertyOptional({ description: 'Optional notes', example: 'Transaction created' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTransactionStatusDto {
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DepositEarnestDto {
  @ApiProperty({
    description: 'Earnest money amount in USDC (6 decimals)',
    example: 10000,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsDateString()
  depositedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteDueDiligenceDto {
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FundTransactionDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsDateString()
  fundedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  onChainTxHash?: string;
}

export class CloseTransactionDto {
  @IsOptional()
  @IsDateString()
  closedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  onChainTxHash?: string;
}

export class FindTransactionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}

export class SettlementStatementDto {
  @IsUUID()
  transactionId: string;

  @IsNumber()
  purchasePrice: number;

  @IsNumber()
  platformFee: number;

  @IsNumber()
  integratorFee: number;

  @IsNumber()
  creatorAmount: number;

  @IsOptional()
  @IsNumber()
  earnestAmount?: number;

  @IsOptional()
  @IsObject()
  prorations?: Record<string, any>;

  @IsOptional()
  @IsObject()
  adjustments?: Record<string, any>;

  @IsNumber()
  netProceeds: number;

  @IsString()
  buyerName: string;

  @IsString()
  sellerName: string;

  @IsString()
  assetId: string;

  @IsDateString()
  closingDate: string;

  @IsString()
  generatedAt: string;
}

