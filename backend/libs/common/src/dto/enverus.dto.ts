import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// Query DTOs for Enverus API requests

export class EnverusWellsQueryDto {
  @IsOptional()
  @IsString()
  county?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  basin?: string;

  @IsOptional()
  @IsString()
  wellId?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  updatedDate?: string;

  @IsOptional()
  @IsString()
  deletedDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

export class EnverusProductionQueryDto {
  @IsString()
  wellId: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

export class EnverusRigsQueryDto {
  @IsOptional()
  @IsString()
  county?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  basin?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

export class EnverusPermitsQueryDto {
  @IsOptional()
  @IsString()
  county?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  permitDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

export class EnverusCompletionsQueryDto {
  @IsString()
  wellId: string;

  @IsOptional()
  @IsString()
  completionDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

export class EnverusTransactionsQueryDto {
  @IsOptional()
  @IsString()
  county?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  assetType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  months?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

export class EnverusValidateAssetDto {
  @IsString()
  county: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  legalDescription?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  apiNumber?: string;

  @IsOptional()
  @IsString()
  sectionTownshipRange?: string;
}

// Response DTOs for Enverus API responses

export class EnverusWellDto {
  WellID: string;
  WellName?: string;
  County?: string;
  State?: string;
  Operator?: string;
  Status?: string;
  Latitude?: number;
  Longitude?: number;
  TVD?: number;
  MD?: number;
  Basin?: string;
  Formation?: string;
  SpudDate?: string;
  CompletionDate?: string;
  UpdatedDate?: string;
}

export class EnverusProductionDto {
  WellID: string;
  ProductionDate: string;
  OilProduction?: number;
  GasProduction?: number;
  WaterProduction?: number;
  DaysOnProduction?: number;
  GOR?: number;
  WaterCut?: number;
}

export class EnverusRigDto {
  RigID: string;
  RigName?: string;
  Operator?: string;
  County?: string;
  State?: string;
  Basin?: string;
  SpudDate?: string;
  RigType?: string;
  Latitude?: number;
  Longitude?: number;
  Status?: string;
}

export class EnverusPermitDto {
  PermitID: string;
  PermitDate?: string;
  ApprovedDate?: string;
  Operator?: string;
  County?: string;
  State?: string;
  WellType?: string;
  TargetFormation?: string;
}

export class EnverusCompletionDto {
  WellID: string;
  CompletionDate?: string;
  TotalStages?: number;
  LateralLength?: number;
  ProppantTotal?: number;
  ProppantPerFt?: number;
  FluidTotal?: number;
  FluidPerFt?: number;
}

export class EnverusTransactionDto {
  TransactionID: string;
  TransactionDate?: string;
  Buyer?: string;
  Seller?: string;
  County?: string;
  State?: string;
  Acres?: number;
  DollarPerAcre?: number;
  TotalPrice?: number;
  AssetType?: string;
}

export class EnverusValidationResultDto {
  verified: boolean;
  matchScore: number;
  enverusId?: string;
  @IsArray()
  discrepancies?: string[];
  @ValidateNested()
  @Type(() => EnverusWellDto)
  matchedWell?: EnverusWellDto;
  @IsArray()
  matchedFields?: string[];
}

export class EnverusWellsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnverusWellDto)
  data: EnverusWellDto[];

  @IsOptional()
  @IsNumber()
  total?: number;
}

export class EnverusProductionResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnverusProductionDto)
  data: EnverusProductionDto[];

  @IsOptional()
  @IsNumber()
  total?: number;
}

export class EnverusRigsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnverusRigDto)
  data: EnverusRigDto[];

  @IsOptional()
  @IsNumber()
  total?: number;
}

export class EnverusPermitsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnverusPermitDto)
  data: EnverusPermitDto[];

  @IsOptional()
  @IsNumber()
  total?: number;
}

export class EnverusCompletionsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnverusCompletionDto)
  data: EnverusCompletionDto[];

  @IsOptional()
  @IsNumber()
  total?: number;
}

export class EnverusTransactionsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnverusTransactionDto)
  data: EnverusTransactionDto[];

  @IsOptional()
  @IsNumber()
  total?: number;
}

