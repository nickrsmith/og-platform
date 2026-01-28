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
  Max,
  IsInt,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OfferStatus } from '../enums/offer-status.enum';
import { OfferType } from '../enums/offer-type.enum';
import { PaginationDto } from './pagination.dto';
import { FindQueryDto } from './find-query.dto';

export class OfferDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsUUID()
  buyerId: string;

  @IsUUID()
  sellerId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earnestMoney?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  ddPeriod?: number; // Due diligence period in days

  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @IsEnum(OfferStatus)
  status: OfferStatus;

  @IsEnum(OfferType)
  offerType: OfferType;

  @IsOptional()
  @IsArray()
  contingencies?: Array<{
    type: string;
    description?: string;
    required: boolean;
  }>;

  @IsOptional()
  @IsObject()
  terms?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  parentOfferId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsString()
  createdAt: string;

  @IsString()
  @IsOptional()
  updatedAt?: string;
}

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earnestMoney?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  ddPeriod?: number;

  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @IsEnum(OfferType)
  offerType: OfferType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContingencyDto)
  contingencies?: ContingencyDto[];

  @IsOptional()
  @IsObject()
  terms?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ContingencyDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  required: boolean;
}

export class UpdateOfferDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earnestMoney?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  ddPeriod?: number;

  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @IsOptional()
  @IsEnum(OfferType)
  offerType?: OfferType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContingencyDto)
  contingencies?: ContingencyDto[];

  @IsOptional()
  @IsObject()
  terms?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class FindOffersQueryDto extends FindQueryDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsEnum(OfferType)
  offerType?: OfferType;
}

export class AcceptOfferDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DeclineOfferDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CounterOfferDto {
  // Note: assetId is not required for counteroffers - it's taken from the parent offer
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  assetId?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earnestMoney?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  ddPeriod?: number;

  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @IsEnum(OfferType)
  offerType: OfferType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContingencyDto)
  contingencies?: ContingencyDto[];

  @IsOptional()
  @IsObject()
  terms?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

