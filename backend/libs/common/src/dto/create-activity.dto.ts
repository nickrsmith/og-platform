// libs/common/src/dto/create-activity.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateActivityRequestDto {
  @IsUUID()
  @IsNotEmpty()
  releaseId: string;

  @IsString()
  @IsNotEmpty()
  siteAddress: string;

  @IsString()
  @IsNotEmpty()
  type: 'UPLOADED' | 'VERIFIED' | 'LICENSED' | 'TRANSFERRED';

  @IsString()
  @IsNotEmpty()
  actorPeerId: string;

  @IsString()
  @IsOptional()
  txHash?: string;
}
