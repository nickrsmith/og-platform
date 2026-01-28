import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IpfsPinStatus } from '../enums/ipfs-pin-status.enum';
import { PaginationDto } from './pagination.dto';

export class CreateIpfsPinDto {
  @IsUUID()
  @IsNotEmpty()
  releaseId: string;

  @IsString()
  @IsNotEmpty()
  type: 'CONTENT' | 'THUMBNAIL' | 'MANIFEST' | 'ORGANIZATION_LOGO';
}

export class CreateIpfsPinsRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIpfsPinDto)
  pins: CreateIpfsPinDto[];
}

export class CreateIpfsPinsResponseDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class UpdateIpfsPinRequestDto {
  @IsString()
  @IsOptional()
  cid?: string;

  @IsEnum(IpfsPinStatus)
  @IsOptional()
  status?: IpfsPinStatus;

  @IsString()
  @IsOptional()
  assetHash?: string;

  @IsString()
  @IsOptional()
  provider?: string;
}

export class IpfsPinRecordDto {
  @IsUUID()
  id: string;

  @IsUUID()
  releaseId: string;

  @IsString()
  @IsOptional()
  cid: string | null;

  @IsString()
  @IsOptional()
  assetHash: string | null;

  @IsString()
  type: string;

  @IsEnum(IpfsPinStatus)
  status: IpfsPinStatus;
}

export class PaginatedIpfsPinsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IpfsPinRecordDto)
  data: IpfsPinRecordDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;
}
