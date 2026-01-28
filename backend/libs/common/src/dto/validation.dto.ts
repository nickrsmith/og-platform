import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EnverusValidationResultDto } from './enverus.dto';
import { DocumentExtractionResultDto } from './ai.dto';

export enum ValidationStatus {
  Pending = 'PENDING',
  InProgress = 'IN_PROGRESS',
  Passed = 'PASSED',
  Failed = 'FAILED',
  Warning = 'WARNING',
}

export enum ValidationType {
  Enverus = 'ENVERUS',
  AI = 'AI',
  Category = 'CATEGORY',
  BusinessRules = 'BUSINESS_RULES',
}

export class ValidationIssueDto {
  @IsEnum(ValidationType)
  type: ValidationType;

  @IsString()
  severity: 'error' | 'warning' | 'info';

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AssetValidationResultDto {
  @IsEnum(ValidationStatus)
  overallStatus: ValidationStatus;

  @IsNumber()
  overallScore: number; // 0-100

  @IsBoolean()
  canProceed: boolean; // True if validation passed or has only warnings

  @IsOptional()
  @ValidateNested()
  @Type(() => EnverusValidationResultDto)
  enverusValidation?: EnverusValidationResultDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentExtractionResultDto)
  aiDocumentAnalysis?: DocumentExtractionResultDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationIssueDto)
  issues: ValidationIssueDto[];

  @IsArray()
  @IsString({ each: true })
  warnings: string[];

  @IsArray()
  @IsString({ each: true })
  errors: string[];

  @IsOptional()
  @IsObject()
  metadata?: {
    validatedAt: string;
    validatorVersion?: string;
    processingTimeMs?: number;
  };
}

export class ValidateAssetDto {
  @IsString()
  releaseId: string;

  @IsString()
  @IsOptional()
  county?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  operator?: string;

  @IsString()
  @IsOptional()
  apiNumber?: string;

  @IsString()
  @IsOptional()
  legalDescription?: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsEnum(['A', 'B', 'C'])
  @IsOptional()
  category?: 'A' | 'B' | 'C';

  @IsEnum(['Lease', 'WorkingInterest', 'Mineral', 'Override'])
  @IsOptional()
  assetType?: 'Lease' | 'WorkingInterest' | 'Mineral' | 'Override';

  @IsBoolean()
  @IsOptional()
  skipEnverusValidation?: boolean;

  @IsBoolean()
  @IsOptional()
  skipAIAnalysis?: boolean;
}

