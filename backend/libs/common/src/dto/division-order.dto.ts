import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
  IsDateString,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DivisionOrderStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
}

export enum OwnerType {
  MINERAL = 'MINERAL',
  WORKING_INTEREST = 'WORKING_INTEREST',
  OVERRIDE = 'OVERRIDE',
}

export enum TransferType {
  SALE = 'SALE',
  INHERITANCE = 'INHERITANCE',
  GIFT = 'GIFT',
  OTHER = 'OTHER',
}

export enum TransferStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
}

export enum RevenueType {
  OIL = 'OIL',
  GAS = 'GAS',
  NGL = 'NGL',
}

// --- Request DTOs ---

export class CreateDivisionOrderOwnerDto {
  @ApiPropertyOptional({
    description: 'Platform user ID (if owner is a platform user)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Owner type',
    enum: OwnerType,
    example: OwnerType.WORKING_INTEREST,
  })
  @IsEnum(OwnerType)
  ownerType: OwnerType;

  @ApiPropertyOptional({
    description: 'External owner name (if not a platform user)',
    example: 'John Smith',
  })
  @IsString()
  @IsOptional()
  externalName?: string;

  @ApiPropertyOptional({
    description: 'External owner email',
    example: 'john@example.com',
  })
  @IsString()
  @IsOptional()
  externalEmail?: string;

  @ApiPropertyOptional({
    description: 'External owner address',
    example: '123 Main St, Houston, TX 77001',
  })
  @IsString()
  @IsOptional()
  externalAddress?: string;

  @ApiProperty({
    description: 'Decimal interest (8 decimal precision, e.g., 0.25000000 for 25%)',
    example: 0.25,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  decimalInterest: number;

  @ApiPropertyOptional({
    description: 'Net Revenue Interest (NRI)',
    example: 0.1875,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  nri?: number;

  @ApiPropertyOptional({
    description: 'Working Interest (WI)',
    example: 0.25,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  wi?: number;

  @ApiPropertyOptional({
    description: 'Payment address (wallet or bank account)',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsString()
  @IsOptional()
  paymentAddress?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'WALLET',
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class CreateDivisionOrderDto {
  @ApiProperty({
    description: 'Well/Asset identifier',
    example: 'well-123',
  })
  @IsString()
  @IsNotEmpty()
  wellId: string;

  @ApiPropertyOptional({
    description: 'Well name',
    example: 'Permian Basin Unit #42',
  })
  @IsString()
  @IsOptional()
  wellName?: string;

  @ApiProperty({
    description: 'Operator organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  operatorOrgId: string;

  @ApiPropertyOptional({
    description: 'Production start date',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  productionStartDate?: string;

  @ApiProperty({
    description: 'Division order owners',
    type: [CreateDivisionOrderOwnerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDivisionOrderOwnerDto)
  owners: CreateDivisionOrderOwnerDto[];
}

export class UpdateDivisionOrderDto {
  @ApiPropertyOptional({
    description: 'Well name',
    example: 'Permian Basin Unit #42',
  })
  @IsString()
  @IsOptional()
  wellName?: string;

  @ApiPropertyOptional({
    description: 'Production start date',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  productionStartDate?: string;

  @ApiPropertyOptional({
    description: 'Status',
    enum: DivisionOrderStatus,
  })
  @IsEnum(DivisionOrderStatus)
  @IsOptional()
  status?: DivisionOrderStatus;

  @ApiPropertyOptional({
    description: 'Notes',
    example: 'Updated ownership percentages',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOwnershipTransferDto {
  @ApiProperty({
    description: 'From owner ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  fromOwnerId: string;

  @ApiPropertyOptional({
    description: 'To owner ID (if existing platform user)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  toOwnerId?: string;

  @ApiPropertyOptional({
    description: 'To external owner name (if not a platform user)',
    example: 'Jane Doe',
  })
  @IsString()
  @IsOptional()
  toExternalName?: string;

  @ApiProperty({
    description: 'Interest amount to transfer (8 decimal precision)',
    example: 0.125,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  interestAmount: number;

  @ApiProperty({
    description: 'Transfer type',
    enum: TransferType,
    example: TransferType.SALE,
  })
  @IsEnum(TransferType)
  transferType: TransferType;

  @ApiPropertyOptional({
    description: 'Transaction ID (if from marketplace)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Assignment document ID (from Title Manager)',
    example: 'doc-123',
  })
  @IsString()
  @IsOptional()
  assignmentDocId?: string;

  @ApiPropertyOptional({
    description: 'Notes',
    example: 'Transfer completed via marketplace',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ApproveTransferDto {
  @ApiPropertyOptional({
    description: 'Courthouse filing date',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsOptional()
  courthouseFiledAt?: string;

  @ApiPropertyOptional({
    description: 'Courthouse file number',
    example: '2024-001234',
  })
  @IsString()
  @IsOptional()
  courthouseFileNumber?: string;

  @ApiPropertyOptional({
    description: 'Notes',
    example: 'Verified against courthouse records',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectTransferDto {
  @ApiProperty({
    description: 'Rejection reason',
    example: 'Decimal interest discrepancy - total does not equal 100%',
  })
  @IsString()
  @IsNotEmpty()
  rejectedReason: string;
}

export class DivisionOrderCalculateRevenueSplitDto {
  @ApiProperty({
    description: 'Total revenue amount',
    example: 100000.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalRevenue: number;

  @ApiProperty({
    description: 'Revenue type',
    enum: RevenueType,
    example: RevenueType.OIL,
  })
  @IsEnum(RevenueType)
  revenueType: RevenueType;

  @ApiProperty({
    description: 'Distribution date',
    example: '2024-01-01',
  })
  @IsDateString()
  distributionDate: string;
}

export class DistributeRevenueDto {
  @ApiProperty({
    description: 'Revenue stream ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  revenueStreamId: string;

  @ApiProperty({
    description: 'Distribution method',
    example: 'SMART_CONTRACT',
  })
  @IsString()
  @IsNotEmpty()
  distributionMethod: string;
}

// --- Response DTOs ---

export class DivisionOrderOwnerDto {
  @IsUUID()
  id: string;

  @IsEnum(OwnerType)
  ownerType: OwnerType;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  externalName?: string;

  @IsString()
  @IsOptional()
  externalEmail?: string;

  @IsNumber()
  decimalInterest: number;

  @IsNumber()
  @IsOptional()
  nri?: number;

  @IsNumber()
  @IsOptional()
  wi?: number;

  @IsString()
  @IsOptional()
  paymentAddress?: string;

  @IsBoolean()
  isActive: boolean;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

export class DivisionOrderDto {
  @IsUUID()
  id: string;

  @IsString()
  wellId: string;

  @IsString()
  @IsOptional()
  wellName?: string;

  @IsUUID()
  operatorOrgId: string;

  @IsString()
  @IsOptional()
  operatorOrgName?: string;

  @IsEnum(DivisionOrderStatus)
  status: DivisionOrderStatus;

  @IsDateString()
  @IsOptional()
  productionStartDate?: string;

  @IsNumber()
  totalDecimalInterest: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  @IsDateString()
  @IsOptional()
  approvedAt?: string;

  @IsUUID()
  @IsOptional()
  approvedBy?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DivisionOrderOwnerDto)
  owners: DivisionOrderOwnerDto[];
}

export class OwnershipTransferDto {
  @IsUUID()
  id: string;

  @IsUUID()
  divisionOrderId: string;

  @IsUUID()
  fromOwnerId: string;

  @IsUUID()
  @IsOptional()
  toOwnerId?: string;

  @IsString()
  @IsOptional()
  toExternalName?: string;

  @IsNumber()
  interestAmount: number;

  @IsEnum(TransferType)
  transferType: TransferType;

  @IsUUID()
  @IsOptional()
  transactionId?: string;

  @IsEnum(TransferStatus)
  status: TransferStatus;

  @IsDateString()
  @IsOptional()
  submittedAt?: string;

  @IsDateString()
  @IsOptional()
  approvedAt?: string;

  @IsDateString()
  @IsOptional()
  courthouseFiledAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  createdAt: string;
}

export class DivisionOrderRevenueSplitDto {
  @IsNumber()
  totalRevenue: number;

  @IsEnum(RevenueType)
  revenueType: RevenueType;

  @IsArray()
  ownerPayments: Array<{
    ownerId: string;
    ownerName: string;
    decimalInterest: number;
    paymentAmount: number;
  }>;

  @IsNumber()
  totalDistributed: number;
}

export class DivisionOrderRevenueStreamDto {
  @IsUUID()
  id: string;

  @IsUUID()
  divisionOrderId: string;

  @IsEnum(RevenueType)
  revenueType: RevenueType;

  @IsNumber()
  monthlyRevenue: number;

  @IsDateString()
  distributionDate: string;

  @IsNumber()
  totalDistributed: number;

  @IsString()
  @IsOptional()
  distributionMethod?: string;

  @IsDateString()
  createdAt: string;
}
