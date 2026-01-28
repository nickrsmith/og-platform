import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { DataRoomStatus } from './update-data-room.dto';

export class GetDataRoomsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by listing ID (release ID)',
    example: 'listing-123',
  })
  @IsOptional()
  @IsString()
  listingId?: string;

  @ApiPropertyOptional({
    description: 'Filter by asset ID',
    example: 'asset-456',
  })
  @IsOptional()
  @IsString()
  assetId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: DataRoomStatus,
  })
  @IsOptional()
  @IsEnum(DataRoomStatus)
  status?: DataRoomStatus;

  @ApiPropertyOptional({
    description: 'Filter by user ID (for admin/list operations)',
    example: 'user-uuid',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
