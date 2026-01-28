import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @ApiPropertyOptional({
    description: 'Custom document name (defaults to file name)',
    example: 'Q1 Financial Report',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Document type/category',
    example: 'financial',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Parent folder ID (for folder organization)',
    example: 'folder-uuid',
  })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Quarterly financial report for Q1 2026',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
