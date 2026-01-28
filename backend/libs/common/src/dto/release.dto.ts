import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  IsOptional,
  ValidateNested,
  IsUUID,
  IsArray,
  IsEnum,
  IsBoolean,
  IsNumberString,
  IsNumber,
} from 'class-validator';
import { VerificationStatus } from '../enums/verification-status.enum';
import { AssetType } from '../enums/asset-type.enum';
import { AssetCategory } from '../enums/asset-category.enum';
import { ProductionStatus } from '../enums/production-status.enum';
import { PaginationDto } from './pagination.dto';
import { transformStringArray } from '../utils/transform';
import { FindQueryDto } from './find-query.dto';

export class ReconcilieReleaseRequestDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contentCID?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  thumbnailCID?: string;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  onChainAssetId?: string;
}

export class ReleaseDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  siteAddress: string;

  @IsString()
  @IsNotEmpty()
  postedBy: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  contentCID: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  thumbnailCID?: string;

  @IsOptional()
  @IsString()
  metadataSubset?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsString()
  @IsOptional()
  onChainAssetId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformStringArray)
  tags?: string[];

  @IsEnum(VerificationStatus)
  verificationStatus: VerificationStatus;

  @IsString()
  @IsNotEmpty()
  displayStatus: string;

  @IsBoolean()
  isEncrypted: boolean;

  @IsString()
  createdAt: string;

  @IsString()
  @IsOptional()
  updatedAt?: string;

  // O&G-specific fields
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @IsOptional()
  @IsString()
  basin?: string; // e.g., 'Permian', 'Eagle Ford', 'Bakken', 'Marcellus'

  @IsOptional()
  @IsNumber()
  acreage?: number; // Size in acres

  @IsOptional()
  @IsEnum(ProductionStatus)
  productionStatus?: ProductionStatus;

  @IsOptional()
  @IsString()
  location?: string; // Geographic location description

  @IsOptional()
  @IsNumber()
  projectedROI?: number; // Projected Return on Investment percentage

  @IsOptional()
  @IsString()
  state?: string; // US State (e.g., 'Texas', 'North Dakota')

  @IsOptional()
  @IsString()
  county?: string; // County name

  // PSA (Purchase and Sale Agreement) data
  @IsOptional()
  @IsObject()
  psaData?: {
    executionDate?: string;
    effectiveDate?: string;
    effectiveTime?: string;
    depositPercent?: string;
    depositAmount?: string;
    closingDate?: string;
    leasesNotes?: string;
    wellsNotes?: string;
    contractsNotes?: string;
    allocatedValuesNotes?: string;
    purchasePriceAllocation?: {
      leases?: string;
      wells?: string;
      equipment?: string;
      other?: string;
      notes?: string;
    };
    revenueDistribution?: {
      sellerPercent?: string;
      buyerPercent?: string;
      other?: string;
      notes?: string;
    };
    whereMoniesGo?: {
      sellerAmount?: string;
      platformFee?: string;
      integratorFee?: string;
      escrowAmount?: string;
      other?: string;
      notes?: string;
    };
    dealStructure?: {
      type?: string;
      paymentTerms?: string;
      financingTerms?: string;
      closingConditions?: string;
      notes?: string;
    };
  };
}

export class FindReleasesQueryDto extends FindQueryDto {
  @IsOptional() @IsString() filterCategoryId?: string;
  @IsOptional() @IsString() filterSiteAddress?: string;
  @IsOptional() @IsString() filterPostedBy?: string;
  @IsOptional()
  @IsEnum(VerificationStatus)
  filterVerificationStatus?: VerificationStatus;
  @IsOptional()
  @IsEnum(['creator', 'buyer', 'subscriber', 'all'])
  filterRelation?: 'creator' | 'buyer' | 'subscriber' | 'all';

  // O&G-specific filters
  @IsOptional()
  @IsEnum(AssetType)
  filterAssetType?: AssetType;

  @IsOptional()
  @IsEnum(AssetCategory)
  filterCategory?: AssetCategory;

  @IsOptional()
  @IsString()
  filterBasin?: string;

  @IsOptional()
  @IsEnum(ProductionStatus)
  filterProductionStatus?: ProductionStatus;

  @IsOptional()
  @IsString()
  filterState?: string;

  @IsOptional()
  @IsNumberString()
  filterMinAcreage?: string; // Using string for query params, will be converted to number

  @IsOptional()
  @IsNumberString()
  filterMaxAcreage?: string; // Using string for query params, will be converted to number
}

export class PaginatedReleasesResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReleaseDto)
  data: ReleaseDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;
}

export class CreateReleaseDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  siteAddress: string;

  @IsString()
  @IsNotEmpty()
  postedBy: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsOptional()
  contentCID?: string;

  @IsString()
  @IsOptional()
  thumbnailCID?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  price?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus = VerificationStatus.UNVERIFIED;

  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean = false;

  // O&G-specific fields
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @IsOptional()
  @IsString()
  basin?: string;

  @IsOptional()
  @IsNumber()
  acreage?: number;

  @IsOptional()
  @IsEnum(ProductionStatus)
  productionStatus?: ProductionStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  projectedROI?: number;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  county?: string;

  // PSA (Purchase and Sale Agreement) fields - stored as JSONB object
  @IsOptional()
  @IsObject()
  psaData?: {
    // Basic PSA information
    executionDate?: string;
    effectiveDate?: string;
    effectiveTime?: string;
    depositPercent?: string;
    depositAmount?: string;
    closingDate?: string;
    leasesNotes?: string;
    wellsNotes?: string;
    contractsNotes?: string;
    allocatedValuesNotes?: string;

    // Purchase Price Allocation (5 fields)
    purchasePriceAllocation?: {
      leases?: string;
      wells?: string;
      equipment?: string;
      other?: string;
      notes?: string;
    };

    // Revenue Distribution (4 fields)
    revenueDistribution?: {
      sellerPercent?: string;
      buyerPercent?: string;
      other?: string;
      notes?: string;
    };

    // Where Monies Go (6 fields)
    whereMoniesGo?: {
      sellerAmount?: string;
      platformFee?: string;
      integratorFee?: string;
      escrowAmount?: string;
      other?: string;
      notes?: string;
    };

    // Deal Structure (5 fields)
    dealStructure?: {
      type?: string;
      paymentTerms?: string;
      financingTerms?: string;
      closingConditions?: string;
      notes?: string;
    };
  };
}

export class UpdateReleaseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // O&G-specific updatable fields
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @IsOptional()
  @IsString()
  basin?: string;

  @IsOptional()
  @IsNumber()
  acreage?: number;

  @IsOptional()
  @IsEnum(ProductionStatus)
  productionStatus?: ProductionStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  projectedROI?: number;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  county?: string;
}

/**
 * DTO for a single item in the admin's "Pending Verifications" list.
 * It includes only the necessary fields for the table, plus the dynamic displayStatus.
 */
export class PendingReleaseDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  createdAt: string;

  @IsString()
  @IsNotEmpty()
  siteAddress: string;

  @IsString()
  @IsNotEmpty()
  postedBy: string;

  @IsString()
  @IsNotEmpty()
  contentCID: string;

  @IsString()
  @IsOptional()
  thumbnailCID?: string | null;

  @IsString()
  @IsNotEmpty()
  displayStatus: string; // The dynamic status is the key feature of this DTO
}

/**
 * DTO for the paginated response for the pending verifications endpoint.
 */
export class PaginatedPendingReleasesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PendingReleaseDto)
  data: PendingReleaseDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;
}
