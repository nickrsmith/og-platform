import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
  IsUUID,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory } from '../enums/asset-category.enum';
import { FeeApplicationMode } from '../enums/fee-application-mode.enum';

export class CalculateRevenueSplitDto {
  @ApiProperty({
    description: 'Transaction amount in USDC (6 decimals)',
    example: 100000,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number; // Transaction amount in USDC (6 decimals)

  @ApiProperty({
    description: 'Asset category (A, B, or C)',
    enum: AssetCategory,
    example: AssetCategory.A,
  })
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @ApiProperty({
    description: 'Organization contract address',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsString()
  @IsNotEmpty()
  orgContractAddress: string;

  @ApiPropertyOptional({
    description: 'Integration partner address (optional)',
    example: '0x9876543210987654321098765432109876543210',
  })
  @IsString()
  @IsOptional()
  integrationPartnerAddress?: string;

  @ApiProperty({
    description: 'Asset owner address',
    example: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  })
  @IsString()
  @IsNotEmpty()
  assetOwnerAddress: string;

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
}

export class RevenueSplitDto {
  @IsNumber()
  totalAmount: number;

  @IsNumber()
  creatorAmount: number; // Amount to creator/asset owner

  @IsNumber()
  empressaFee: number; // Platform fee (5% for A/B, 0% for C)

  @IsNumber()
  integratorFee: number; // Integrator fee (1% for A/B, 0% for C)

  @IsNumber()
  empressaFeePercentage: number; // Fee percentage (basis points)

  @IsNumber()
  integratorFeePercentage: number; // Fee percentage (basis points)

  @IsBoolean()
  isFreeListing: boolean; // True for Category C

  @IsEnum(AssetCategory)
  category: AssetCategory;

  @ApiPropertyOptional({
    description: 'Amount of platform fee paid by buyer',
    example: 2500,
  })
  @IsNumber()
  @IsOptional()
  buySideFee?: number; // Amount of platform fee paid by buyer

  @ApiPropertyOptional({
    description: 'Amount of platform fee paid by seller',
    example: 2500,
  })
  @IsNumber()
  @IsOptional()
  sellSideFee?: number; // Amount of platform fee paid by seller
}

export class RevenueStatsDto {
  @IsString()
  orgContractAddress: string;

  @IsNumber()
  totalRevenue: number;

  @IsNumber()
  creatorRevenue: number;

  @IsNumber()
  empressaRevenue: number;

  @IsNumber()
  integratorRevenue: number;

  @IsNumber()
  pendingCreatorEarnings: number;

  @IsNumber()
  pendingEmpressaEarnings: number;

  @IsNumber()
  pendingIntegratorEarnings: number;

  @IsNumber()
  distributedCreatorEarnings: number;

  @IsNumber()
  distributedEmpressaEarnings: number;

  @IsNumber()
  distributedIntegratorEarnings: number;
}

export class OrganizationEarningsDto {
  @IsUUID()
  organizationId: string;

  @IsString()
  orgContractAddress: string;

  @IsNumber()
  pendingTotal: number;

  @IsNumber()
  distributedTotal: number;

  @IsNumber()
  pendingCreatorEarnings: number;

  @IsNumber()
  pendingEmpressaEarnings: number;

  @IsNumber()
  pendingIntegratorEarnings: number;

  @IsNumber()
  distributedCreatorEarnings: number;

  @IsNumber()
  distributedEmpressaEarnings: number;

  @IsNumber()
  distributedIntegratorEarnings: number;
}

export class FeeStructureDto {
  @IsString()
  orgContractAddress: string;

  @IsNumber()
  empressaFeePercentage: number; // Basis points (500 = 5%)

  @IsNumber()
  integratorFeePercentage: number; // Basis points (100 = 1%)

  @IsBoolean()
  hasCustomFees: boolean;

  @IsEnum(AssetCategory)
  @IsOptional()
  category?: AssetCategory; // For Category C free listing check
}

export class RevenueDistributionRequestDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  licenseeAddress: string;

  @IsString()
  @IsNotEmpty()
  payerAddress: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  assetOwnerAddress: string;

  @IsString()
  @IsOptional()
  integrationPartnerAddress?: string;

  @IsString()
  @IsNotEmpty()
  orgContractAddress: string;

  @IsEnum(AssetCategory)
  category: AssetCategory;
}

