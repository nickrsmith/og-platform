import { ApiProperty } from '@nestjs/swagger';

export class DataRoomDocumentResponseDto {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ description: 'Data room ID' })
  dataRoomId: string;

  @ApiProperty({ description: 'Parent folder ID (for folder organization)', nullable: true })
  folderId: string | null;

  @ApiProperty({ description: 'Document name' })
  name: string;

  @ApiProperty({ description: 'Original file name' })
  originalName: string;

  @ApiProperty({ description: 'MIME type', nullable: true })
  mimeType: string | null;

  @ApiProperty({ description: 'File size in bytes' })
  size: string; // BigInt as string for JSON serialization

  @ApiProperty({ description: 'IPFS Content ID', nullable: true })
  ipfsCid: string | null;

  @ApiProperty({ description: 'IPFS URL', nullable: true })
  ipfsUrl: string | null;

  @ApiProperty({ description: 'Storage path', nullable: true })
  storagePath: string | null;

  @ApiProperty({ description: 'Document description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Additional metadata', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}
