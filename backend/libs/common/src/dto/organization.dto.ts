import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { InvitationStatus } from '@prisma/client';
import { PaginatedReleasesResponseDto } from './release.dto';
import { Role } from '../enums/roles.enum';
import { transformStringArray } from '../utils/transform';
import { IpfsPinStatus } from '../enums/ipfs-pin-status.enum';
import { AssetCategory } from '../enums/asset-category.enum';

export class CreateOrganizationRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  requestedName: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  legalEntityType: string;

  @IsString()
  @IsNotEmpty()
  primaryIndustry: string;

  @IsEnum(AssetCategory)
  @IsOptional()
  category?: AssetCategory; // Optional - will be auto-classified if not provided
}

/**
 * DTO for a single external link associated with an organization.
 */
export class OrganizationLinkDto {
  @IsUUID()
  @IsOptional() // Optional on input, but will be present on output
  id?: string;

  @IsString()
  type: string;

  @IsString()
  @IsUrl()
  url: string;
}

/**
 * DTO for the PATCH request body when updating an organization's profile.
 */
export class UpdateOrganizationProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  logoImage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  blurb?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  legalEntityType?: string;

  @IsOptional()
  @IsString()
  primaryIndustry?: string;

  @IsEnum(AssetCategory)
  @IsOptional()
  category?: AssetCategory;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganizationLinkDto)
  links?: OrganizationLinkDto[];
}

// A dedicated DTO for the principal user's public info.
class PrincipalUserDto {
  @IsString()
  @IsOptional()
  fullName?: string | null;

  @IsString()
  @IsOptional()
  profileImage?: string | null;
}
/**
 * The single, standardized DTO for a public organization profile.
 * Includes core details and follower counts.
 */
export class OrganizationProfileDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  siteAddress?: string | null;

  @IsNumber()
  followerCount: number;

  @IsNumber()
  followingCount: number;

  @IsObject()
  @ValidateNested()
  @Type(() => PrincipalUserDto)
  @IsOptional()
  principalUser?: PrincipalUserDto | null;

  @IsString()
  @IsOptional()
  logoImage?: string | null;

  @IsString()
  @IsOptional()
  blurb?: string | null;

  @IsBoolean()
  isConfigured: boolean;

  @IsString()
  @IsOptional()
  country?: string | null;

  @IsString()
  @IsOptional()
  legalEntityType?: string | null;

  @IsString()
  @IsOptional()
  primaryIndustry?: string | null;

  @IsEnum(AssetCategory)
  @IsOptional()
  category?: AssetCategory | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganizationLinkDto)
  links: OrganizationLinkDto[];

  @IsDateString()
  createdAt: string;
}

/**
 * The response for the main public profile endpoint, combining
 * the organization's profile with its paginated releases.
 */
export class GetOrganizationProfileResponseDto {
  @IsObject()
  @ValidateNested()
  @Type(() => OrganizationProfileDto)
  organization: OrganizationProfileDto;

  @IsObject()
  @ValidateNested()
  @Type(() => PaginatedReleasesResponseDto)
  releases: PaginatedReleasesResponseDto;
}

/**
 * The response for the endpoint that checks the follow status
 * for an authenticated user.
 */
export class GetOrganizationFollowStatusResponseDto {
  @IsBoolean()
  isFollowing: boolean;
}

/**
 * The response for the endpoint that lists all organizations followed by the current user.
 */
export class GetMyFollowingResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganizationProfileDto)
  data: OrganizationProfileDto[];
}

/**
 * DTO for the paginated list of all organizations in the admin panel.
 */
export class AdminOrganizationListItemDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  memberCount: number;

  @IsNumber()
  activeAssetCount: number;
}

export class RejectApplcationRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  reason?: string;
}

export class CreateInvitationRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class AcceptMemberInvitationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class UpdateMemberRoleRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export interface OrganizationRequestStatusDto {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_FOUND';
  requestedName?: string;
  createdAt?: string;
}

class MemberUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsBoolean()
  isActive: boolean;
}

export class OrganizationMemberDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(Role)
  role: Role;

  @IsBoolean()
  isActiveMember: boolean;

  @IsDateString()
  @IsOptional()
  joinedAt?: string;

  @IsString()
  status: 'active' | 'pending' | 'expired';

  @IsObject()
  @ValidateNested()
  @Type(() => MemberUserDto)
  user: MemberUserDto;

  @IsDateString()
  @IsOptional()
  invitedAt?: string;
}

export class FindMembersQueryDto {
  @IsOptional()
  @IsArray()
  @IsEnum(InvitationStatus, { each: true })
  @Transform(transformStringArray)
  status?: InvitationStatus[];
}

export class AssignRoleRequestDto {
  @IsString()
  @IsNotEmpty()
  p2pPublicKey: string;

  @IsString()
  @IsNotEmpty()
  roleId: string; // e.g., 'member'
}

/**
 * DTO for the response of the logo pinning status endpoint.
 */
export class OrganizationLogoStatusDto {
  @IsEnum(IpfsPinStatus)
  @IsOptional()
  status?: IpfsPinStatus;

  @IsString()
  @IsOptional()
  cid?: string | null;
}
