import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, MinLength } from 'class-validator';

export enum DataRoomTier {
  SIMPLE = 'SIMPLE',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export enum DataRoomAccess {
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED',
}

export class CreateDataRoomDto {
  @ApiProperty({
    description: 'Data room name',
    example: 'Q1 2026 Asset Package',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    description: 'Listing ID (release ID from P2P)',
    example: 'listing-123',
  })
  @IsOptional()
  @IsString()
  listingId?: string;

  @ApiPropertyOptional({
    description: 'Asset ID (from P2P)',
    example: 'asset-456',
  })
  @IsOptional()
  @IsString()
  assetId?: string;

  @ApiPropertyOptional({
    description: 'Data room tier',
    enum: DataRoomTier,
    default: DataRoomTier.SIMPLE,
  })
  @IsOptional()
  @IsEnum(DataRoomTier)
  tier?: DataRoomTier;

  @ApiPropertyOptional({
    description: 'Data room access level',
    enum: DataRoomAccess,
    default: DataRoomAccess.RESTRICTED,
  })
  @IsOptional()
  @IsEnum(DataRoomAccess)
  access?: DataRoomAccess;
}
