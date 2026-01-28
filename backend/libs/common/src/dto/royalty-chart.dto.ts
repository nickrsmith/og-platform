import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RoyaltyChartDataPointDto {
  @IsString()
  timestamp: string;

  @IsNumber()
  totalEarnings: number;
}

export class RoyaltyChartResponseDto {
  @IsNumber()
  totalRevenueForPeriod: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoyaltyChartDataPointDto)
  chartPoints: RoyaltyChartDataPointDto[];
}

export class FindRoyaltyChartQueryDto {
  @IsString()
  @IsNotEmpty()
  creatorPeerId: string;

  @IsOptional()
  @IsString()
  @IsEnum(['monthly', 'quarterly', 'yearly', 'all'])
  timeRange?: 'monthly' | 'quarterly' | 'yearly' | 'all';
}
