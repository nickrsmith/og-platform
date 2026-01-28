import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { DataRoomTier, DataRoomAccess } from './create-data-room.dto';

export enum DataRoomStatus {
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

export class UpdateDataRoomDto {
  @ApiPropertyOptional({
    description: 'Data room name',
    example: 'Q1 2026 Asset Package - Updated',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({
    description: 'Data room tier',
    enum: DataRoomTier,
  })
  @IsOptional()
  @IsEnum(DataRoomTier)
  tier?: DataRoomTier;

  @ApiPropertyOptional({
    description: 'Data room access level',
    enum: DataRoomAccess,
  })
  @IsOptional()
  @IsEnum(DataRoomAccess)
  access?: DataRoomAccess;

  @ApiPropertyOptional({
    description: 'Data room status',
    enum: DataRoomStatus,
  })
  @IsOptional()
  @IsEnum(DataRoomStatus)
  status?: DataRoomStatus;

  @ApiPropertyOptional({
    description: 'Asset ID (null to unlink, string to link)',
    example: 'asset-456',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  assetId?: string | null;

  @ApiPropertyOptional({
    description: 'Listing ID / Release ID (null to unlink, string to link)',
    example: 'listing-123',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  listingId?: string | null;
}
