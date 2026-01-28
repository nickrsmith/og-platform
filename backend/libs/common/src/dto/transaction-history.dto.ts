import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from './pagination.dto';

export enum TransactionType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
}

export class TransactionHistoryItemDto {
  @IsUUID()
  id: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  assetName: string;

  @IsUUID()
  relatedAssetId: string;

  @IsString()
  @IsNotEmpty()
  txHash: string;

  @IsDateString()
  timestamp: string;

  @IsNumber()
  amount: number;
}

export class PaginatedTransactionHistoryResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionHistoryItemDto)
  data: TransactionHistoryItemDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;
}
