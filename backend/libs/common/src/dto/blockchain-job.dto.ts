import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BlockchainJobStatus } from '../enums/blockchain-job-status.enum';
import { ChainEventType } from '../enums/chain-event-type.enum';

export class CreateBlockchainJobRequestDto {
  @IsEnum(ChainEventType)
  @IsNotEmpty()
  eventType: ChainEventType;

  @IsString()
  txId: string;

  @IsObject()
  @IsNotEmpty()
  payload: unknown;
}

export class CreateBlockchainJobResponseDto {
  @IsString()
  jobId: string;

  @IsEnum(BlockchainJobStatus)
  @IsNotEmpty()
  status: BlockchainJobStatus;
}

export class GetJobResponseDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsEnum(BlockchainJobStatus)
  @IsNotEmpty()
  status: BlockchainJobStatus;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  error: string | null;
}

export class LicenseAssetRequestDto {
  @IsUUID()
  @IsNotEmpty()
  attemptId: string;
}
