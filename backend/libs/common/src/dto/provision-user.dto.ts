import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { Role } from '../enums/roles.enum';

export class ProvisionUserRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string; // The user's full name

  @IsUrl()
  @IsNotEmpty()
  profileImage: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @IsString()
  invitationToken?: string;
}

/**
 * Defines the shape of the data returned after successfully provisioning a new user's resources.
 */
export class ProvisionUserResponseDto {
  @IsString()
  siteAddress: string;

  @IsUUID()
  organizationId: string;

  @IsEnum(Role)
  userRole: Role;
}
