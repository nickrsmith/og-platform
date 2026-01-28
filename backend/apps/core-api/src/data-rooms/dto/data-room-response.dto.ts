import { ApiProperty } from '@nestjs/swagger';
import { DataRoomTier, DataRoomAccess } from './create-data-room.dto';
import { DataRoomStatus } from './update-data-room.dto';
import { DataRoomDocumentResponseDto } from './data-room-document-response.dto';

export class DataRoomResponseDto {
  @ApiProperty({ description: 'Data room ID' })
  id: string;

  @ApiProperty({ description: 'Data room name' })
  name: string;

  @ApiProperty({ description: 'User ID (owner)' })
  userId: string;

  @ApiProperty({ description: 'Organization ID', nullable: true })
  organizationId: string | null;

  @ApiProperty({ description: 'Asset ID (from P2P)', nullable: true })
  assetId: string | null;

  @ApiProperty({ description: 'Release/Listing ID (from P2P)', nullable: true })
  releaseId: string | null;

  @ApiProperty({ enum: DataRoomStatus, description: 'Data room status' })
  status: DataRoomStatus;

  @ApiProperty({ enum: DataRoomAccess, description: 'Access level' })
  access: DataRoomAccess;

  @ApiProperty({ enum: DataRoomTier, description: 'Data room tier' })
  tier: DataRoomTier;

  @ApiProperty({ description: 'Number of documents' })
  documentCount: number;

  @ApiProperty({ description: 'Total size in bytes', nullable: true })
  totalSize: string | null; // BigInt as string for JSON serialization

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class DataRoomWithDocumentsResponseDto extends DataRoomResponseDto {
  @ApiProperty({
    type: [DataRoomDocumentResponseDto],
    description: 'Documents in the data room',
  })
  documents: DataRoomDocumentResponseDto[];
}
