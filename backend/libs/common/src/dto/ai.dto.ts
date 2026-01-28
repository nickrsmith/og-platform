import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUrl,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// Document Analysis DTOs

export class AnalyzeDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentUrl: string;

  @IsOptional()
  @IsEnum(['deed', 'lease', 'title', 'mineral_deed', 'assignment', 'other'])
  documentType?: 'deed' | 'lease' | 'title' | 'mineral_deed' | 'assignment' | 'other';

  @IsOptional()
  @IsString()
  context?: string; // Additional context about the document
}

export class DocumentExtractionResultDto {
  // Legal description fields
  legalDescription?: string;
  section?: string;
  township?: string;
  range?: string;
  county?: string;
  state?: string;
  
  // Ownership fields
  grantor?: string;
  grantee?: string;
  ownerNames?: string[];
  
  // O&G specific fields
  mineralRights?: boolean;
  royaltyInterest?: number;
  workingInterest?: number;
  netMineralAcres?: number;
  apiNumber?: string;
  
  // Additional extracted data
  effectiveDate?: string;
  recordingDate?: string;
  documentNumber?: string;
  book?: string;
  page?: string;
  
  // Confidence scores
  confidence?: number;
  extractedFields?: string[];
  warnings?: string[];
}

// Valuation DTOs

export class GenerateValuationDto {
  @IsString()
  @IsNotEmpty()
  county: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsOptional()
  @IsString()
  basin?: string;

  @IsOptional()
  @IsNumber()
  acreage?: number;

  @IsOptional()
  @IsEnum(['Lease', 'WorkingInterest', 'Mineral', 'Override'])
  assetType?: 'Lease' | 'WorkingInterest' | 'Mineral' | 'Override';

  @IsOptional()
  @IsString()
  wellId?: string; // Enverus well ID for production data

  @IsOptional()
  @IsObject()
  productionData?: {
    averageMonthlyProduction?: number;
    declineRate?: number;
    monthsOfHistory?: number;
  };

  @IsOptional()
  @IsArray()
  comparableSales?: Array<{
    pricePerAcre: number;
    date: string;
    location: string;
  }>;
}

export class ValuationResultDto {
  @IsNumber()
  estimatedValue: number;

  @IsNumber()
  valuePerAcre: number;

  @IsNumber()
  confidence: number; // 0-100

  @IsString()
  methodology: string; // 'DCF', 'Comparable Sales', 'Hybrid', etc.

  @IsArray()
  valueRange?: [number, number]; // Min and max estimates

  @IsArray()
  factors?: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;

  @IsArray()
  assumptions?: string[];

  @IsArray()
  recommendations?: string[];
}

// Risk Assessment DTOs

export class AssessRiskDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsOptional()
  @IsString()
  buyerId?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsNumber()
  transactionValue?: number;

  @IsOptional()
  @IsObject()
  assetDetails?: {
    category?: string;
    productionStatus?: string;
    location?: string;
  };
}

export class RiskAssessmentResultDto {
  @IsNumber()
  overallRiskScore: number; // 0-100, lower is better

  @IsEnum(['low', 'medium', 'high', 'critical'])
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskFactorDto)
  riskFactors: RiskFactorDto[];

  @IsArray()
  recommendations: string[];

  @IsArray()
  flags?: string[]; // Critical issues that should block transaction
}

export class RiskFactorDto {
  @IsString()
  category: string; // 'title', 'ownership', 'production', 'environmental', 'regulatory', etc.

  @IsString()
  description: string;

  @IsNumber()
  severity: number; // 0-100

  @IsEnum(['low', 'medium', 'high', 'critical'])
  level: 'low' | 'medium' | 'high' | 'critical';

  @IsString()
  @IsOptional()
  recommendation?: string;
}

// Listing Generation DTOs

export class GenerateListingDto {
  @IsString()
  @IsNotEmpty()
  assetType: string;

  @IsString()
  @IsNotEmpty()
  county: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsOptional()
  @IsNumber()
  acreage?: number;

  @IsOptional()
  @IsString()
  basin?: string;

  @IsOptional()
  @IsObject()
  extractedData?: Record<string, any>; // From document analysis

  @IsOptional()
  @IsObject()
  enverusData?: Record<string, any>; // From Enverus validation
}

export class GeneratedListingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  keyFeatures: string[];

  @IsArray()
  highlights: string[];

  @IsOptional()
  @IsString()
  suggestedPrice?: string;

  @IsArray()
  tags: string[];
}

// Response wrappers

export class DocumentAnalysisResponseDto {
  @ValidateNested()
  @Type(() => DocumentExtractionResultDto)
  extraction: DocumentExtractionResultDto;

  @IsOptional()
  @IsString()
  rawResponse?: string; // Raw AI response for debugging
}

export class ValuationResponseDto {
  @ValidateNested()
  @Type(() => ValuationResultDto)
  valuation: ValuationResultDto;

  @IsOptional()
  @IsObject()
  metadata?: {
    generatedAt: string;
    modelUsed: string;
    dataSources: string[];
  };
}

export class RiskAssessmentResponseDto {
  @ValidateNested()
  @Type(() => RiskAssessmentResultDto)
  assessment: RiskAssessmentResultDto;

  @IsOptional()
  @IsObject()
  metadata?: {
    assessedAt: string;
    modelUsed: string;
  };
}

export class GeneratedListingResponseDto {
  @ValidateNested()
  @Type(() => GeneratedListingDto)
  listing: GeneratedListingDto;

  @IsOptional()
  @IsObject()
  metadata?: {
    generatedAt: string;
    modelUsed: string;
  };
}

