import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ChainEventType } from '../enums/chain-event-type.enum';
import { ChainTransactionStatus } from '../enums/chain-transaction-status.enum';

export class CreateChainTransactionRequestDto {
  @IsUUID()
  @IsNotEmpty()
  txId: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  relatedObjectId?: string;

  @IsEnum(ChainEventType)
  @IsNotEmpty()
  eventType: ChainEventType;

  @IsDateString()
  @IsNotEmpty()
  submittedAt: string;
}

export class UpdateChainTransactionRequestDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  txHash?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  blockNumber?: string;

  @IsEnum(ChainTransactionStatus)
  @IsNotEmpty()
  status: ChainTransactionStatus;

  @IsDateString()
  @IsNotEmpty()
  confirmedAt: string;
}

export class GetChainTransactionDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  blockNumber?: number;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  txHash?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  relatedObjectId?: string;

  @IsEnum(ChainEventType)
  @IsNotEmpty()
  eventType: ChainEventType;

  @IsEnum(ChainTransactionStatus)
  @IsNotEmpty()
  status: ChainTransactionStatus;

  @IsDateString()
  @IsNotEmpty()
  submittedAt: string;

  @IsDateString()
  @IsOptional()
  confirmedAt?: string;
}
