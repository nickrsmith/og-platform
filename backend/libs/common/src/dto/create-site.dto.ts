import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSiteRequestDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  userPublicKey?: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  alias: string;
}
