import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateSaleRequestDto {
  @IsUUID()
  @IsNotEmpty()
  releaseId: string;

  @IsString()
  @IsNotEmpty()
  creatorPeerId: string;

  @IsString()
  @IsNotEmpty()
  buyerPeerId: string;

  @IsNumber()
  @IsNotEmpty()
  priceUSDC: number;

  @IsNumber()
  @IsNotEmpty()
  royaltyAmountUSDC: number;

  @IsNumber()
  @IsNotEmpty()
  platformFeeUSDC: number;

  @IsString()
  @IsNotEmpty()
  txHash: string;
}

export class FindSalesQueryDto {
  @IsString()
  @IsNotEmpty()
  creatorPeerId: string;

  @IsOptional()
  @IsString()
  @IsEnum(['daily', 'weekly', 'monthly', 'all'])
  timeRange?: 'daily' | 'weekly' | 'monthly' | 'all';
}

class SaleRecordDto {
  @IsString()
  id: string;

  @IsString()
  releaseId: string;

  @IsString()
  txHash: string;

  @IsString()
  priceUSDC: string;

  @IsString()
  platformFeeUSDC: string;

  @IsString()
  royaltyAmountUSDC: string;

  @IsString()
  saleTimestamp: string;
}

export class SalesAnalyticsResponseDto {
  @IsNumber()
  totalRevenue: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleRecordDto)
  sales: SaleRecordDto[];
}
