import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEmail,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class CreateOrganizationByAdminDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  principalEmail: string;
}

/**
 * DTO for the detailed view of an organization in the admin panel.
 */
export class AdminOrganizationDetailsDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  memberCount: number;

  @IsNumber()
  activeAssetCount: number;
}
