import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  ChainEventType,
  CreateBlockchainJobRequestDto,
  CreateBlockchainJobResponseDto,
  CreateInvitationRequestDto,
  CreateIpfsPinsRequestDto,
  CreateIpfsPinsResponseDto,
  CreateOrganizationRequestDto,
  FindMembersQueryDto,
  FindReleasesQueryDto,
  GetOrganizationFollowStatusResponseDto,
  GetOrganizationProfileResponseDto,
  IpfsJobType,
  OrganizationLogoStatusDto,
  OrganizationMemberDto,
  OrganizationProfileDto,
  OrganizationRequestStatusDto,
  PaginatedIpfsPinsDto,
  PaginatedReleasesResponseDto,
  PaginationQueryDto,
  PinOrganizationLogoPayload,
  Role,
  UpdateOrganizationProfileDto,
  VerificationStatus,
  WithdrawOrgEarningsPayload,
} from '@app/common';
import { PrismaService } from '@app/database';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, timeout, TimeoutError } from 'rxjs';
import {
  InvitationStatus,
  OrganizationRole,
  OrganizationStatus,
  Prisma,
  RequestStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import * as path from 'path';
import { EmailService } from '@app/common/modules/email/email.service';
import { formatUnits } from 'ethers';
import { v4 as uuid } from 'uuid';
import { TransactionsService } from '../transactions/transactions.service';
import {
  FindSubscriptionsQueryDto,
  PaginatedSubscriptionsDto,
} from '@app/common/dto/subscription.dto';
import { AssetCategory } from '@app/common';

// This object defines the relations we want to include in our query.
const organizationWithIncludes = {
  _count: {
    select: { followers: true, following: true },
  },
  principalUser: {
    select: {
      firstName: true,
      lastName: true,
      profileImage: true,
    },
  },
  links: true,
};

// This uses Prisma's type generator to create the exact type for our query result.
// It correctly includes the `principalUser` and `_count` objects.
type OrganizationWithDetails = Prisma.OrganizationGetPayload<{
  include: typeof organizationWithIncludes;
}>;

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);
  private readonly indexerApiUrl: string | null;
  private readonly lensManagerUrl: string | null;
  private readonly dashboardUrl: string;
  private readonly ipfsServiceUrl: string;
  private readonly blockchainServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly transactionService: TransactionsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.indexerApiUrl = this.configService.get<string>('INDEXER_API_URL') || null;
    this.lensManagerUrl = this.configService.get<string>('LENS_MANAGER_URL') || null;
    this.dashboardUrl = this.configService.get<string>('ROYALTY_MARKETPLACE_URL') || 'http://localhost:5000';
    if (!this.configService.get<string>('ROYALTY_MARKETPLACE_URL')) {
      this.logger.warn('ROYALTY_MARKETPLACE_URL not configured. Using default: http://localhost:5000');
    }
    this.ipfsServiceUrl = this.configService.getOrThrow('IPFS_SERVICE_URL');
    this.blockchainServiceUrl = this.configService.getOrThrow(
      'BLOCKCHAIN_SERVICE_URL',
    );
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Release operations will be disabled.');
    }
    if (!this.lensManagerUrl) {
      this.logger.warn('Lens Manager URL not configured. P2P operations will be disabled.');
    }
  }

  /**
   * Central private method to fetch an organization by its ID and include all details.
   * @throws NotFoundException if the organization doesn't exist.
   */
  private async _getOrganizationWithDetails(
    organizationId: string,
  ): Promise<OrganizationWithDetails> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: organizationWithIncludes,
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found.`,
      );
    }
    return organization;
  }

  /**
   * Maps the internal Prisma model to the public DTO.
   */
  private async _toProfileDto(org: OrganizationWithDetails): Promise<OrganizationProfileDto> {
    // Log logoImage for debugging
    if (org.logoImage) {
      this.logger.debug(
        `[_toProfileDto] Organization ${org.id} has logoImage: ${org.logoImage}`,
      );
    } else {
      this.logger.debug(
        `[_toProfileDto] Organization ${org.id} has no logoImage (null/undefined)`,
      );
    }

    // Classify category if not already set (for backward compatibility)
    // Note: This is now async, but we need to handle it in the DTO mapping
    // For now, we'll classify synchronously but cache the result
    const category = await this.classifyOrganizationCategory(org);

    return {
      id: org.id,
      name: org.name,
      siteAddress: org.siteAddress,
      followerCount: org._count.followers,
      followingCount: org._count.following,
      principalUser: org.principalUser
        ? {
            fullName:
              `${org.principalUser.firstName || ''} ${org.principalUser.lastName || ''}`.trim(),
            profileImage: org.principalUser.profileImage,
          }
        : null,
      logoImage: org.logoImage,
      blurb: org.blurb,
      legalEntityType: org.legalEntityType,
      country: org.country,
      primaryIndustry: org.primaryIndustry,
      category, // Add category to DTO
      isConfigured: org.isConfigured,
      links: org.links.map((link) => ({
        id: link.id,
        type: link.type,
        url: link.url,
      })),
      createdAt: org.createdAt.toISOString(),
    };
  }

  /**
   * Classify organization category based on business rules
   * Category A: Major Operators / E&P Companies
   * Category B: Brokers / Override Traders
   * Category C: Individual Mineral Owners
   * 
   * Results are cached to avoid redundant classification
   */
  private async classifyOrganizationCategory(
    org: OrganizationWithDetails,
  ): Promise<AssetCategory | null> {
    // Check cache first
    const cacheKey = `org:category:${org.id}`;
    const cached = await this.cacheManager.get<AssetCategory | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Classify category
    // If category is explicitly set in database (future migration), use it
    // For now, classify based on organization characteristics

    // Category A indicators:
    // - Large organizations with multiple members
    // - Business entity types (Corporation, LLC, etc.)
    // - Primary industry related to E&P
    const isBusinessEntity =
      org.legalEntityType &&
      ['Corporation', 'LLC', 'Partnership', 'Limited Partnership'].some(
        (type) =>
          org.legalEntityType?.toLowerCase().includes(type.toLowerCase()),
      );

    const isEPCompany =
      org.primaryIndustry &&
      [
        'Exploration & Production',
        'E&P',
        'Oil & Gas',
        'Energy',
        'Upstream',
      ].some((industry) =>
        org.primaryIndustry?.toLowerCase().includes(industry.toLowerCase()),
      );

    // Get member count from database
    const memberCount = await this.prisma.organizationMember.count({
      where: { organizationId: org.id },
    });
    const isLargeOrganization = memberCount > 5;

    if (isBusinessEntity && (isEPCompany || isLargeOrganization)) {
      return AssetCategory.A;
    }

    // Category B indicators:
    // - Broker-related industry
    // - Trading/Override focus
    const isBroker =
      org.primaryIndustry &&
      ['Broker', 'Trading', 'Override', 'ORRI', 'Land Services'].some(
        (term) =>
          org.primaryIndustry?.toLowerCase().includes(term.toLowerCase()),
      );

    if (isBroker) {
      return AssetCategory.B;
    }

    // Category C: Default for individual/small organizations
    // - Individual owners
    // - Small organizations (1-2 members)
    // - Personal/Individual entity types
    const isIndividual =
      org.legalEntityType &&
      ['Individual', 'Sole Proprietor', 'Personal'].some((type) =>
        org.legalEntityType?.toLowerCase().includes(type.toLowerCase()),
      );

    let category: AssetCategory | null = null;
    if (isIndividual || memberCount <= 2) {
      category = AssetCategory.C;
    }

    // Cache the result (24 hour TTL - category doesn't change often)
    await this.cacheManager.set(cacheKey, category, 86400);

    return category;
  }

  /**
   * Validate category assignment based on organization characteristics
   */
  async validateCategoryAssignment(
    category: AssetCategory,
    org: OrganizationWithDetails,
  ): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    const classifiedCategory = await this.classifyOrganizationCategory(org);

    switch (category) {
      case AssetCategory.A:
        if (classifiedCategory !== AssetCategory.A) {
          warnings.push(
            'Organization characteristics suggest a different category. Category A is typically for major operators/E&P companies.',
          );
        }
        if (!org.legalEntityType) {
          warnings.push(
            'Category A organizations should have a legal entity type specified.',
          );
        }
        break;

      case AssetCategory.B:
        if (classifiedCategory !== AssetCategory.B) {
          warnings.push(
            'Organization characteristics suggest a different category. Category B is typically for brokers/override traders.',
          );
        }
        break;

      case AssetCategory.C:
        if (classifiedCategory !== AssetCategory.C && classifiedCategory) {
          warnings.push(
            'Organization characteristics suggest a different category. Category C is typically for individual mineral owners.',
          );
        }
        // Category C validation: should be eligible for free listings
        const memberCount = await this.prisma.organizationMember.count({
          where: { organizationId: org.id },
        });
        if (memberCount > 5) {
          warnings.push(
            'Category C is typically for individual/small organizations. Large organizations may not qualify for free listings.',
          );
        }
        break;
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Get category-specific features/restrictions
   */
  getCategoryFeatures(category: AssetCategory | null): {
    freeListing: boolean;
    requiresVerification: boolean;
    maxListings?: number;
    features: string[];
  } {
    switch (category) {
      case AssetCategory.A:
        return {
          freeListing: false,
          requiresVerification: true,
          features: [
            'Bulk listing capabilities',
            'Advanced deal structures',
            'Premium analytics',
            'Custom fee structures',
          ],
        };

      case AssetCategory.B:
        return {
          freeListing: false,
          requiresVerification: true,
          features: [
            'Override interest trading',
            'Package creation',
            'Commission tracking',
            'Override analytics',
          ],
        };

      case AssetCategory.C:
        return {
          freeListing: true,
          requiresVerification: false, // Simplified verification
          maxListings: 5, // Reasonable limit for free listings
          features: [
            'Free listings (no platform fees)',
            'Simplified data room',
            'Guided workflow',
            'Personal mineral rights focus',
          ],
        };

      default:
        return {
          freeListing: false,
          requiresVerification: true,
          features: [],
        };
    }
  }

  async getMyOrganization(
    organizationId: string,
  ): Promise<OrganizationProfileDto> {
    this.logger.log(
      `Fetching profile for user's own organization: ${organizationId}`,
    );
    const organization = await this._getOrganizationWithDetails(organizationId);
    return await this._toProfileDto(organization);
  }

  async findAll(query: PaginationQueryDto): Promise<OrganizationProfileDto[]> {
    const { page = 1, pageSize = 20 } = query;
    const skip = (page - 1) * pageSize;

    const organizations = await this.prisma.organization.findMany({
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc', // Or order by followers in the future
      },
      include: organizationWithIncludes,
    });

    return Promise.all(organizations.map((org) => this._toProfileDto(org)));
  }

  async findBySiteAddress(
    siteAddress: string,
  ): Promise<OrganizationProfileDto> {
    this.logger.log(`Fetching organization details for site: ${siteAddress}`);

    const organization = await this.prisma.organization.findUnique({
      where: { siteAddress },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with siteAddress ${siteAddress} not found.`,
      );
    }

    // Now fetch the full profile with counts
    const fullProfile = await this._getOrganizationWithDetails(organization.id);
    return await this._toProfileDto(fullProfile);
  }

  async findOne(
    organizationId: string,
    query?: Omit<FindReleasesQueryDto, 'filter_posted_by' | 'filter_relation'>,
  ): Promise<GetOrganizationProfileResponseDto> {
    this.logger.log(
      `Fetching public profile for organization: ${organizationId}`,
    );

    const organization = await this._getOrganizationWithDetails(organizationId);

    const url = `${this.indexerApiUrl}/releases`;
    try {
      const { data: releases } = await firstValueFrom(
        this.httpService
          .get<PaginatedReleasesResponseDto>(url, {
            params: {
              ...query,
              filter_site_address: organization.siteAddress,
              filter_verification_status: VerificationStatus.VERIFIED,
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(
                `Failed to fetch releases from indexer-api for site ${organization.siteAddress}`,
                error.response?.data,
              );
              throw new InternalServerErrorException(
                'Could not retrieve organization assets.',
              );
            }),
          ),
      );

      return {
        organization: await this._toProfileDto(organization),
        releases,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(
        `An unexpected error occurred while fetching profile for organization ${organizationId}`,
        error,
      );
      throw new InternalServerErrorException('An unexpected error occurred.');
    }
  }

  async findFollowing(
    requesterOrgId: string,
  ): Promise<OrganizationProfileDto[]> {
    this.logger.log(
      `Fetching followed organizations for org: ${requesterOrgId}`,
    );
    const followedRelations = await this.prisma.organizationFollow.findMany({
      where: {
        followerOrgId: requesterOrgId,
      },
      include: {
        following: {
          include: organizationWithIncludes,
        },
      },
    });

    return Promise.all(
      followedRelations.map((relation) =>
        this._toProfileDto(relation.following),
      ),
    );
  }

  async findMembers(
    organizationId: string,
    query?: FindMembersQueryDto,
  ): Promise<OrganizationMemberDto[]> {
    this.logger.log(`Fetching members for organization: ${organizationId}`);

    // Defensive check: ensure organizationId is provided
    if (!organizationId) {
      this.logger.error('[findMembers] organizationId is missing or undefined');
      throw new BadRequestException('Organization ID is required');
    }

    const statusFilters = query?.status;

    // Normalize to array: if single value provided, convert to array; if undefined, treat as all
    const statusArray = statusFilters
      ? Array.isArray(statusFilters)
        ? statusFilters
        : [statusFilters]
      : undefined;

    // Fetch active members (only if status includes ACCEPTED or undefined/all)
    const shouldFetchActive =
      !statusArray || statusArray.includes(InvitationStatus.ACCEPTED);
    const members = shouldFetchActive
      ? await this.prisma.organizationMember.findMany({
          where: { organizationId },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                isActive: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        })
      : [];

    // Fetch invitations based on status filter
    type OrganizationInvitationType = {
      id: string;
      organizationId: string;
      email: string;
      role: OrganizationRole;
      status: InvitationStatus;
      expiresAt: Date;
      createdAt: Date;
    };
    let pendingInvitations: OrganizationInvitationType[] = [];
    let expiredInvitations: OrganizationInvitationType[] = [];

    if (!statusArray || statusArray.includes(InvitationStatus.PENDING)) {
      // Fetch pending invitations (non-expired) - CRITICAL: Always filter by organizationId
      pendingInvitations = await this.prisma.organizationInvitation.findMany({
        where: {
          organizationId, // ✅ This ensures only invitations for THIS organization are returned
          status: InvitationStatus.PENDING,
          expiresAt: { gt: new Date() },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Log for debugging: verify all invitations belong to the correct organization
      this.logger.log(
        `[findMembers] Found ${pendingInvitations.length} pending invitations for organization ${organizationId}`,
      );
      if (pendingInvitations.length > 0) {
        const allMatchOrg = pendingInvitations.every(
          (inv) => inv.organizationId === organizationId,
        );
        if (!allMatchOrg) {
          this.logger.error(
            `[findMembers] CRITICAL: Found invitations with mismatched organizationId! Expected: ${organizationId}, Found: ${pendingInvitations.map((inv) => inv.organizationId).join(', ')}`,
          );
        }
      }
    }

    if (!statusArray || statusArray.includes(InvitationStatus.EXPIRED)) {
      // Fetch expired invitations - CRITICAL: Always filter by organizationId
      expiredInvitations = await this.prisma.organizationInvitation.findMany({
        where: {
          organizationId, // ✅ This ensures only invitations for THIS organization are returned
          OR: [
            { status: InvitationStatus.EXPIRED },
            {
              status: InvitationStatus.PENDING,
              expiresAt: { lte: new Date() },
            },
          ],
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Log for debugging: verify all invitations belong to the correct organization
      this.logger.log(
        `[findMembers] Found ${expiredInvitations.length} expired invitations for organization ${organizationId}`,
      );
      if (expiredInvitations.length > 0) {
        const allMatchOrg = expiredInvitations.every(
          (inv) => inv.organizationId === organizationId,
        );
        if (!allMatchOrg) {
          this.logger.error(
            `[findMembers] CRITICAL: Found expired invitations with mismatched organizationId! Expected: ${organizationId}, Found: ${expiredInvitations.map((inv) => inv.organizationId).join(', ')}`,
          );
        }
      }
    }

    const allInvitations = [...pendingInvitations, ...expiredInvitations];

    // Fetch all users for invitations in a single query (if any)
    let userMap = new Map<
      string,
      {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        isActive: boolean;
      }
    >();
    if (allInvitations.length > 0) {
      const invitationEmails = allInvitations.map((inv) => inv.email);
      const usersForInvitations = await this.prisma.user.findMany({
        where: {
          email: { in: invitationEmails },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      });

      // Create a map for quick lookup
      userMap = new Map(usersForInvitations.map((user) => [user.email, user]));
    }

    // Map members to DTOs
    const memberDtos: OrganizationMemberDto[] = members.map((member) => ({
      userId: member.userId,
      role: member.role as Role,
      isActiveMember: member.isActiveMember,
      joinedAt: member.joinedAt.toISOString(),
      status: 'active' as const,
      user: {
        firstName: member.user.firstName || '',
        lastName: member.user.lastName || '',
        email: member.user.email,
        isActive: member.user.isActive,
      },
    }));

    // Map invitations to DTOs
    const invitationDtos: OrganizationMemberDto[] = allInvitations.map(
      (invitation) => {
        const existingUser = userMap.get(invitation.email);
        const isExpired =
          invitation.status === InvitationStatus.EXPIRED ||
          (invitation.status === InvitationStatus.PENDING &&
            invitation.expiresAt <= new Date());

        return {
          userId: existingUser?.id,
          role: invitation.role as Role,
          isActiveMember: false,
          status: isExpired ? ('expired' as const) : ('pending' as const),
          invitedAt: invitation.createdAt.toISOString(),
          user: {
            firstName: existingUser?.firstName || '',
            lastName: existingUser?.lastName || '',
            email: invitation.email,
            isActive: existingUser?.isActive || false,
          },
        };
      },
    );

    // Combine and return all members and invitations
    return [...memberDtos, ...invitationDtos];
  }

  async getMyRequestStatus(
    userId: string,
  ): Promise<OrganizationRequestStatusDto> {
    this.logger.log(`Fetching organization request status for user ${userId}`);

    const request = await this.prisma.organizationCreationRequest.findFirst({
      where: {
        userId,
        status: {
          in: [
            RequestStatus.PENDING,
            RequestStatus.REJECTED,
            RequestStatus.APPROVED,
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!request) {
      throw new NotFoundException(
        'No pending or rejected organization request found for this user.',
      );
    }

    return {
      status: request.status,
      requestedName: request.requestedName,
      createdAt: request.createdAt.toISOString(),
    };
  }

  async createRequest(
    userId: string,
    dto: CreateOrganizationRequestDto,
  ): Promise<void> {
    // Check if the user is already part of an organization
    const existingMembership = await this.prisma.organizationMember.findFirst({
      where: { userId },
    });
    if (existingMembership) {
      throw new ConflictException(
        'User is already a member of an organization.',
      );
    }

    // Check for an existing pending request
    const existingRequest =
      await this.prisma.organizationCreationRequest.findFirst({
        where: { userId, status: 'PENDING' },
      });
    if (existingRequest) {
      throw new ConflictException(
        'You already have a pending organization request.',
      );
    }

    // Classify category if not provided
    let category = dto.category;
    if (!category) {
      // Auto-classify based on provided data
      category = this.classifyCategoryFromRequest(dto);
      this.logger.log(
        `Auto-classified organization request as Category ${category} for user ${userId}`,
      );
    }

    // Validate category assignment (log warnings but don't block)
    if (category) {
      const validation = this.validateCategoryFromRequest(category, dto);
      if (validation.warnings.length > 0) {
        this.logger.warn(
          `Category validation warnings for request: ${validation.warnings.join('; ')}`,
        );
      }
    }

    await this.prisma.organizationCreationRequest.create({
      data: {
        userId,
        requestedName: dto.requestedName,
        country: dto.country,
        legalEntityType: dto.legalEntityType,
        primaryIndustry: dto.primaryIndustry,
        // Note: category field would need to be added to OrganizationCreationRequest model
        // For now, category will be set when organization is created from approved request
      },
    });

    this.logger.log(
      `New organization creation request submitted for user ${userId} (Category: ${category || 'unclassified'})`,
    );
  }

  /**
   * Classify category from organization creation request
   */
  private classifyCategoryFromRequest(
    dto: CreateOrganizationRequestDto,
  ): AssetCategory | undefined {
    const isBusinessEntity =
      dto.legalEntityType &&
      ['Corporation', 'LLC', 'Partnership', 'Limited Partnership'].some(
        (type) =>
          dto.legalEntityType?.toLowerCase().includes(type.toLowerCase()),
      );

    const isEPCompany =
      dto.primaryIndustry &&
      [
        'Exploration & Production',
        'E&P',
        'Oil & Gas',
        'Energy',
        'Upstream',
      ].some((industry) =>
        dto.primaryIndustry?.toLowerCase().includes(industry.toLowerCase()),
      );

    if (isBusinessEntity && isEPCompany) {
      return AssetCategory.A;
    }

    const isBroker =
      dto.primaryIndustry &&
      ['Broker', 'Trading', 'Override', 'ORRI', 'Land Services'].some(
        (term) => dto.primaryIndustry?.toLowerCase().includes(term.toLowerCase()),
      );

    if (isBroker) {
      return AssetCategory.B;
    }

    const isIndividual =
      dto.legalEntityType &&
      ['Individual', 'Sole Proprietor', 'Personal'].some((type) =>
        dto.legalEntityType?.toLowerCase().includes(type.toLowerCase()),
      );

    if (isIndividual) {
      return AssetCategory.C;
    }

    return undefined;
  }

  /**
   * Validate category assignment from request data
   */
  private validateCategoryFromRequest(
    category: AssetCategory,
    dto: CreateOrganizationRequestDto,
  ): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const classifiedCategory = this.classifyCategoryFromRequest(dto);

    if (classifiedCategory && classifiedCategory !== category) {
      warnings.push(
        `Requested category ${category} differs from auto-classified category ${classifiedCategory}`,
      );
    }

    switch (category) {
      case AssetCategory.A:
        if (!dto.legalEntityType) {
          warnings.push(
            'Category A organizations should specify a legal entity type',
          );
        }
        break;

      case AssetCategory.C:
        if (
          dto.legalEntityType &&
          ['Corporation', 'LLC'].some((type) =>
            dto.legalEntityType?.toLowerCase().includes(type.toLowerCase()),
          )
        ) {
          warnings.push(
            'Category C is typically for individual owners, not business entities',
          );
        }
        break;
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  async createInvitation(
    organizationId: string,
    dto: CreateInvitationRequestDto,
  ): Promise<void> {
    // Defensive check: ensure organizationId is provided
    if (!organizationId) {
      this.logger.error(
        '[createInvitation] organizationId is missing or undefined',
      );
      throw new BadRequestException('Organization ID is required');
    }

    const { email, role } = dto;

    this.logger.log(
      `[createInvitation] Creating invitation for ${email} to organization ${organizationId} with role ${role}`,
    );

    // CRITICAL: Verify the organization exists before creating invitation
    // This ensures we're not creating invitations for non-existent organizations
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, id: true },
    });
    if (!organization) {
      this.logger.error(
        `[createInvitation] Organization ${organizationId} not found`,
      );
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found.`,
      );
    }

    this.logger.log(
      `[createInvitation] Verified organization exists: ${organization.name} (${organization.id})`,
    );

    const existingMember = await this.prisma.organizationMember.findFirst({
      where: { organizationId, user: { email } },
    });
    if (existingMember) {
      throw new ConflictException(
        'This user is already a member of the organization.',
      );
    }

    const existingInvitation =
      await this.prisma.organizationInvitation.findFirst({
        where: { organizationId, email, status: InvitationStatus.PENDING },
      });
    if (existingInvitation) {
      this.logger.warn(
        `[createInvitation] Pending invitation already exists for ${email} in organization ${organizationId}`,
      );
      throw new ConflictException(
        'An invitation has already been sent to this email address.',
      );
    }

    // Generate token and invitation link BEFORE creating invitation
    // This allows us to send email first, then only create invitation if email succeeds
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitationLink = `${this.dashboardUrl}/login?invitationToken=${token}`;

    // OPTIMIZED FLOW: Send email FIRST, then create invitation only if email succeeds
    // This avoids creating and then deleting invitations when email fails
    try {
      await this.emailService.sendOrganizationInvitation(
        email,
        organization.name,
        invitationLink,
      );
      this.logger.log(
        `[createInvitation] Invitation email sent successfully to ${email}`,
      );
    } catch (error) {
      // Log the error with full details
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `[createInvitation] Failed to send invitation email to ${email}: ${errorMessage}`,
      );
      this.logger.error(`[createInvitation] Error details: ${errorDetails}`);

      // Check if it's a quota exceeded error
      const isQuotaExceeded =
        errorMessage.includes('quota exceeded') ||
        errorMessage.includes('daily_quota_exceeded') ||
        errorMessage.includes('429') ||
        errorMessage.includes('Daily email sending quota');

      // Check if it's a network error
      const isNetworkError =
        errorMessage.includes('Unable to connect to email service') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Unable to fetch data');

      // Throw appropriate error - no need to delete invitation since we haven't created it yet
      if (isQuotaExceeded) {
        throw new InternalServerErrorException(
          'Unable to send invitation email',
        );
      } else if (isNetworkError) {
        throw new InternalServerErrorException(
          'Unable to send invitation email: Network connectivity issue with email service. Please try again in a few moments.',
        );
      } else {
        // Use the error message from EmailService (already user-friendly)
        throw new InternalServerErrorException(
          `Unable to send invitation email: ${errorMessage}`,
        );
      }
    }

    // Only create invitation in database AFTER email is successfully sent
    // CRITICAL: Create invitation with explicit organizationId verification
    // The organizationId parameter is trusted (comes from JWT token, not user input)
    const invitation = await this.prisma.organizationInvitation.create({
      data: {
        organizationId, // ✅ This is the authenticated user's organization from JWT token
        email,
        role: role as OrganizationRole,
        token,
        expiresAt,
      },
    });

    // Verify the invitation was created with the correct organizationId
    if (invitation.organizationId !== organizationId) {
      this.logger.error(
        `[createInvitation] CRITICAL: Invitation created with wrong organizationId! Expected: ${organizationId}, Got: ${invitation.organizationId}`,
      );
      // Delete the incorrectly created invitation
      await this.prisma.organizationInvitation.delete({
        where: { id: invitation.id },
      });
      throw new InternalServerErrorException(
        'Failed to create invitation. Please try again.',
      );
    }

    this.logger.log(
      `[createInvitation] Successfully created invitation ${invitation.id} for ${email} in organization ${organizationId}`,
    );
  }

  /**
   * Accepts an invitation for an already-logged-in user.
   * This is used when a user clicks an invitation link while already authenticated.
   */
  async acceptInvitation(
    userId: string,
    userEmail: string,
    token: string,
  ): Promise<void> {
    this.logger.log(
      `[acceptInvitation] User ${userId} (${userEmail}) attempting to accept invitation with token: ${token.substring(0, 8)}...`,
    );

    // Find the invitation by token
    const invitation = await this.prisma.organizationInvitation.findFirst({
      where: {
        token,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      const allInvitations = await this.prisma.organizationInvitation.findMany({
        where: { token },
        select: {
          id: true,
          email: true,
          status: true,
          expiresAt: true,
          organizationId: true,
        },
      });

      this.logger.warn(
        `[acceptInvitation] Invalid or expired invitation token. Token: ${token.substring(0, 8)}..., User email: ${userEmail}, Found invitations: ${JSON.stringify(allInvitations)}`,
      );
      throw new NotFoundException('Invalid or expired invitation token.');
    }

    // Verify email matches (case-insensitive)
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      this.logger.warn(
        `[acceptInvitation] Email mismatch: invitation email "${invitation.email}" does not match user email "${userEmail}"`,
      );
      throw new ForbiddenException(
        'This invitation was sent to a different email address.',
      );
    }

    this.logger.log(
      `[acceptInvitation] Found valid invitation ${invitation.id} for organization ${invitation.organizationId}`,
    );

    // Use the same logic as _handleInvitedUser but as a public method
    // Check for the "claiming" flow
    const isClaimingFlow =
      invitation.role === OrganizationRole.Principal &&
      invitation.organization.status === OrganizationStatus.UNCLAIMED;

    if (isClaimingFlow) {
      this.logger.log(
        `[acceptInvitation] User ${userId} is claiming unclaimed organization ${invitation.organizationId}`,
      );

      const _wallet = await this.prisma.wallet.findUniqueOrThrow({
        where: { userId },
      });
      const _p2pIdentity = await this.prisma.p2PIdentity.findUniqueOrThrow({
        where: { userId },
      });

      await this.prisma.organization.update({
        where: { id: invitation.organizationId },
        data: {
          principalUserId: userId,
          status: OrganizationStatus.ACTIVE,
        },
      });

      // Note: We would need to call provisionOrganizationResources here
      // but it's in AuthService, so we might need to refactor or inject it
      this.logger.warn(
        `[acceptInvitation] Claiming flow detected but provisionOrganizationResources not available in OrganizationsService`,
      );
    }

    // Use a transaction to ensure both operations succeed or fail together
    try {
      await this.prisma.$transaction(async (tx) => {
        this.logger.log(
          `[acceptInvitation] Starting transaction for invitation ${invitation.id}`,
        );

        const existingMember = await tx.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: invitation.organizationId,
              userId,
            },
          },
        });

        if (!existingMember) {
          this.logger.log(
            `[acceptInvitation] Creating organization member for user ${userId} in organization ${invitation.organizationId}`,
          );
          await tx.organizationMember.create({
            data: {
              userId,
              organizationId: invitation.organizationId,
              role: invitation.role,
            },
          });
          this.logger.log(
            `[acceptInvitation] Successfully created organization member`,
          );
        } else {
          this.logger.warn(
            `[acceptInvitation] User ${userId} is already a member of organization ${invitation.organizationId}. Updating invitation status to ACCEPTED.`,
          );
        }

        this.logger.log(
          `[acceptInvitation] Updating invitation ${invitation.id} status to ACCEPTED`,
        );
        await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.ACCEPTED },
        });
        this.logger.log(
          `[acceptInvitation] Successfully updated invitation status to ACCEPTED`,
        );
      });
    } catch (error) {
      this.logger.error(
        `[acceptInvitation] Transaction failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }

    this.logger.log(
      `[acceptInvitation] User ${userId} successfully joined organization ${invitation.organizationId} via invitation.`,
    );
  }

  async getMyOrganizationLogoStatus(
    organizationId: string,
  ): Promise<OrganizationLogoStatusDto> {
    this.logger.log(
      `Fetching latest logo pinning status for organization: ${organizationId}`,
    );

    if (!this.indexerApiUrl) {
      throw new InternalServerErrorException(
        'IPFS pinning status is not available. INDEXER_API_URL is not configured.',
      );
    }

    const url = `${this.indexerApiUrl}/ipfs/pins`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<PaginatedIpfsPinsDto>(url, {
          params: {
            filterReleaseId: organizationId, // Using releaseId to store orgId
            filterType: 'ORGANIZATION_LOGO',
            sortBy: 'createdAt',
            sortDirection: 'desc',
            pageSize: 1,
          },
        }),
      );

      if (!data || data.data.length === 0) {
        throw new NotFoundException(
          `No logo pinning record found for organization ${organizationId}.`,
        );
      }

      const latestPin = data.data[0];
      return {
        status: latestPin.status,
        cid: latestPin.cid,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to fetch logo status from indexer-api for org ${organizationId}`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve logo pinning status.',
      );
    }
  }

  async updateMyOrganizationLogo(
    organizationId: string,
    logoFile: Express.Multer.File,
  ) {
    if (!logoFile) {
      throw new BadRequestException('No logo file provided.');
    }

    this.logger.log(
      `Processing logo upload for organization ${organizationId}`,
    );

    // Step 1: Create a pin record in the indexer to track the job
    const pinCreationRequest: CreateIpfsPinsRequestDto = {
      pins: [
        {
          releaseId: organizationId, // Re-using the releaseId field for orgId
          type: 'ORGANIZATION_LOGO',
        },
      ],
    };

    let pinRecordId: string;
    const PIN_RECORD_TIMEOUT_MS = 10000; // 10 second timeout for creating pin record
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .post<CreateIpfsPinsResponseDto>(
            `${this.indexerApiUrl}/ipfs/pins`,
            pinCreationRequest,
            {
              timeout: PIN_RECORD_TIMEOUT_MS,
            },
          )
          .pipe(
            timeout(PIN_RECORD_TIMEOUT_MS + 1000),
            catchError((err: AxiosError | TimeoutError) => {
              if (err instanceof TimeoutError) {
                this.logger.error(
                  `Request to indexer-api timed out after ${PIN_RECORD_TIMEOUT_MS}ms for org ${organizationId}`,
                );
                throw new InternalServerErrorException(
                  'The indexer service did not respond in time. Please try again.',
                );
              }
              throw err;
            }),
          ),
      );
      if (!data.ids || data.ids.length === 0) {
        throw new Error('Indexer did not return a pin record ID.');
      }
      pinRecordId = data.ids[0];
    } catch (error) {
      // Re-throw InternalServerErrorException as-is (from timeout handler)
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data;
      const errorMessage =
        typeof errorData === 'object' &&
        errorData !== null &&
        'message' in errorData &&
        typeof errorData.message === 'string'
          ? errorData.message
          : axiosError.message;

      this.logger.error(
        `CRITICAL: Failed to create pin record in indexer-api for org ${organizationId}. Aborting upload.`,
        {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: errorData,
          message: errorMessage,
          code: axiosError.code,
          url: `${this.indexerApiUrl}/ipfs/pins`,
          requestPayload: pinCreationRequest,
        },
      );

      // Provide a more helpful error message based on the status code
      if (axiosError.response?.status === 500) {
        throw new InternalServerErrorException(
          'The indexer service encountered an error while creating the pin record. This may be due to a database constraint or validation issue. Please check the indexer-api logs for details.',
        );
      }

      throw new InternalServerErrorException(
        'Could not initialize file processing records.',
      );
    }

    // Step 2: Call the ipfs-service to enqueue the pinning job
    // Ensure we use an absolute path - multer's path might be relative
    const tempDir =
      process.env.TEMP_STORAGE_PATH || '/usr/src/app/temp-uploads';

    // Resolve to absolute path - handle both absolute and relative paths from multer
    let tempFilePath: string;
    if (path.isAbsolute(logoFile.path)) {
      // Already absolute, use as-is
      tempFilePath = logoFile.path;
    } else {
      // Relative path - multer's path might be just the filename or include tempDir
      // If it includes tempDir (e.g., "temp-uploads/filename"), we need to extract just the filename
      const pathParts = logoFile.path.split(path.sep);
      const filename = pathParts[pathParts.length - 1]; // Get the last part (filename)

      // Ensure tempDir is absolute
      const absoluteTempDir = path.isAbsolute(tempDir)
        ? tempDir
        : path.resolve(process.cwd(), tempDir);

      // Join absolute tempDir with just the filename
      tempFilePath = path.join(absoluteTempDir, filename);
    }

    // Final check - ensure it's absolute
    if (!path.isAbsolute(tempFilePath)) {
      const absoluteTempDir = path.isAbsolute(tempDir)
        ? tempDir
        : path.resolve(process.cwd(), tempDir);
      tempFilePath = path.resolve(absoluteTempDir, tempFilePath);
    }

    this.logger.log(
      `Logo file path - original: ${logoFile.path}, tempDir: ${tempDir}, resolved: ${tempFilePath}`,
    );

    const url = `${this.ipfsServiceUrl}/ipfs/pins`;
    const payload: PinOrganizationLogoPayload = {
      organizationId,
      pinRecordId, // Pass the newly created record ID
      tempFilePath,
      originalName: logoFile.originalname,
    };

    const REQUEST_TIMEOUT_MS = 10000; // 10 second timeout (reduced from 30s to avoid gateway timeout)
    const requestStartTime = Date.now();

    this.logger.log(
      `Calling ipfs-service at ${url} for organization ${organizationId}`,
    );

    try {
      const { data: ipfsJob } = await firstValueFrom(
        this.httpService
          .post<{ jobId: string }>(
            url,
            {
              name: IpfsJobType.PIN_ORGANIZATION_LOGO,
              data: payload,
            },
            {
              timeout: REQUEST_TIMEOUT_MS,
            },
          )
          .pipe(
            timeout(REQUEST_TIMEOUT_MS + 1000), // Add 1 second buffer for rxjs timeout
            catchError((err: AxiosError | TimeoutError) => {
              if (err instanceof TimeoutError) {
                this.logger.error(
                  `Request to ipfs-service timed out after ${REQUEST_TIMEOUT_MS}ms for organization ${organizationId}`,
                );
                throw new InternalServerErrorException(
                  'The IPFS service did not respond in time. Please try again.',
                );
              }

              const axiosError = err;
              const isTimeout =
                axiosError.code === 'ECONNABORTED' ||
                axiosError.message?.includes('timeout') ||
                axiosError.response?.status === 504;

              if (isTimeout) {
                this.logger.error(
                  `Request to ipfs-service timed out for organization ${organizationId}`,
                  axiosError.response?.data || axiosError.message,
                );
                throw new InternalServerErrorException(
                  'The IPFS service did not respond in time. Please try again.',
                );
              }

              this.logger.error(
                `Failed to call ipfs-service for logo pinning`,
                {
                  status: axiosError.response?.status,
                  statusText: axiosError.response?.statusText,
                  data: axiosError.response?.data,
                  message: axiosError.message,
                  code: axiosError.code,
                },
              );
              throw new InternalServerErrorException(
                'Failed to enqueue logo processing job.',
              );
            }),
          ),
      );
      const requestDuration = Date.now() - requestStartTime;
      this.logger.log(
        `Logo pinning job enqueued with ID: ${ipfsJob.jobId} (took ${requestDuration}ms)`,
      );
      return { jobId: ipfsJob.jobId, status: 'QUEUED' };
    } catch (error) {
      // Re-throw InternalServerErrorException as-is
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      // Handle any other unexpected errors
      this.logger.error(
        `Unexpected error while enqueueing logo processing job for organization ${organizationId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to enqueue logo processing job.',
      );
    }
  }

  async updateMyOrganization(
    organizationId: string,
    dto: UpdateOrganizationProfileDto,
  ): Promise<OrganizationProfileDto> {
    this.logger.log(`Updating profile for organization: ${organizationId}`);

    const { name, blurb, legalEntityType, country, primaryIndustry, category, links } =
      dto;

    // Validate category if provided
    if (category) {
      const org = await this._getOrganizationWithDetails(organizationId);
      const validation = await this.validateCategoryAssignment(category, org);
      if (validation.warnings.length > 0) {
        this.logger.warn(
          `Category validation warnings for organization ${organizationId}: ${validation.warnings.join('; ')}`,
        );
      }
    }

    // Use a transaction to ensure atomicity, especially when updating links.
    const updatedOrganization = await this.prisma.$transaction(async (tx) => {
      // 1. Update the simple fields on the Organization model
      // Note: logoImage is intentionally excluded - it's managed separately via
      // the logo upload endpoint and should not be modified through profile updates.
      // Prisma will preserve the existing logoImage value since it's not in the update data.
      // Note: category field would need to be added to Organization model via migration
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          name,
          blurb,
          legalEntityType,
          country,
          primaryIndustry,
          isConfigured: true, // Once edited, it's considered configured
          // logoImage is NOT included here - it's preserved automatically
          // category: category, // TODO: Add after database migration
        },
      });

      // 2. Handle the links sub-resource
      if (links !== undefined) {
        // Delete all existing links for this organization
        await tx.organizationLink.deleteMany({
          where: { organizationId },
        });

        // Create the new links from the DTO
        if (links.length > 0) {
          await tx.organizationLink.createMany({
            data: links.map((link) => ({
              organizationId,
              type: link.type,
              url: link.url,
            })),
          });
        }
      }

      // 3. Fetch the fully updated organization with all relations to return it
      const result = await tx.organization.findUnique({
        where: { id: organizationId },
        include: organizationWithIncludes,
      });

      if (!result) {
        // This should not happen if the initial update succeeded, but it's a safeguard.
        throw new InternalServerErrorException(
          'Failed to retrieve updated organization.',
        );
      }
      return result;
    });

    return await this._toProfileDto(updatedOrganization);
  }

  async getFollowStatus(
    requesterOrgId: string,
    targetOrgId: string,
  ): Promise<GetOrganizationFollowStatusResponseDto> {
    const followRecord = await this.prisma.organizationFollow.findUnique({
      where: {
        followerOrgId_followingOrgId: {
          followerOrgId: requesterOrgId,
          followingOrgId: targetOrgId,
        },
      },
    });

    return {
      isFollowing: !!followRecord,
    };
  }

  async follow(followerOrgId: string, followingOrgId: string): Promise<void> {
    if (followerOrgId === followingOrgId) {
      throw new ConflictException('An organization cannot follow itself.');
    }

    try {
      await this.prisma.organizationFollow.create({
        data: {
          followerOrgId,
          followingOrgId,
        },
      });
      this.logger.log(
        `Organization ${followerOrgId} is now following ${followingOrgId}`,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Already following this organization.');
      }
      this.logger.error(
        `Failed to create follow relationship for ${followerOrgId} -> ${followingOrgId}`,
        error,
      );
      throw new InternalServerErrorException('Could not follow organization.');
    }
  }

  async unfollow(followerOrgId: string, followingOrgId: string): Promise<void> {
    await this.prisma.organizationFollow.delete({
      where: {
        followerOrgId_followingOrgId: {
          followerOrgId,
          followingOrgId,
        },
      },
    });
    this.logger.log(
      `Organization ${followerOrgId} has unfollowed ${followingOrgId}`,
    );
  }

  async getMyOrganizationEarnings(
    organizationId: string,
  ): Promise<{ pendingEarnings: string; formattedPendingEarnings: string }> {
    this.logger.log(
      `Fetching pending earnings for organization: ${organizationId}`,
    );

    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { contractAddress: true },
    });

    if (!organization.contractAddress) {
      this.logger.warn(
        `Organization ${organizationId} has no contract address, returning 0 earnings.`,
      );
      return { pendingEarnings: '0', formattedPendingEarnings: '0.00' };
    }

    const url = `${this.blockchainServiceUrl}/rpc/orgs/${organization.contractAddress}/earnings`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ pendingEarnings: string }>(url),
      );

      return {
        pendingEarnings: data.pendingEarnings,
        formattedPendingEarnings: formatUnits(data.pendingEarnings, 6),
      };
    } catch (error) {
      this.logger.error(
        `Failed to proxy org earnings request for org ${organizationId}`,
        (error as AxiosError).response?.data,
      );
      throw new InternalServerErrorException(
        'Could not retrieve organization earnings.',
      );
    }
  }

  async initiateEarningsWithdrawal(
    organizationId: string,
    principalUserId: string,
  ): Promise<{ txId: string; jobId: string }> {
    this.logger.log(
      `Initiating earnings withdrawal for organization: ${organizationId}`,
    );

    const blockchainJobUrl = `${this.blockchainServiceUrl}/jobs`;
    const eventType = ChainEventType.WITHDRAW_ORG_EARNINGS;
    const txId = uuid();

    const jobPayload: WithdrawOrgEarningsPayload = {
      organizationId,
      principalUserId,
    };

    const jobRequest: CreateBlockchainJobRequestDto = {
      eventType,
      txId,
      payload: jobPayload,
    };

    // 1. Create the pending transaction record
    await this.transactionService.indexTransaction({
      txId,
      eventType,
      submittedAt: new Date().toISOString(),
      relatedObjectId: organizationId,
    });

    // 2. Enqueue the job
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<CreateBlockchainJobResponseDto>(
          blockchainJobUrl,
          jobRequest,
          {
            headers: {
              'X-Idempotency-Key': `withdraw-earnings-${organizationId}-${Date.now()}`, // Add timestamp for repeatability
            },
          },
        ),
      );
      return { ...data, txId };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to create withdrawal job for org ${organizationId}`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException('Failed to initiate withdrawal.');
    }
  }

  async createSubscription(
    subscriberSiteAddress: string,
    targetSiteAddress: string,
    postedBy: string,
  ): Promise<void> {
    if (!this.lensManagerUrl) {
      throw new InternalServerErrorException(
        'Subscription operations are not available. LENS_MANAGER_URL is not configured.',
      );
    }
    
    const url = `${this.lensManagerUrl}/sites/${subscriberSiteAddress}/subscriptions`;
    this.logger.log(
      `Proxying subscription request to lens-manager: POST ${url}`,
    );

    const payload = { targetSiteAddress, postedBy };

    await firstValueFrom(
      this.httpService.post(url, payload).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(
            `Failed to proxy create subscription request to lens-manager`,
            error.response?.data,
          );
          throw new InternalServerErrorException(
            'Failed to create subscription.',
          );
        }),
      ),
    );
  }

  async removeSubscription(
    subscriberSiteAddress: string,
    targetSiteAddress: string,
  ): Promise<void> {
    if (!this.lensManagerUrl) {
      throw new InternalServerErrorException(
        'Unsubscription operations are not available. LENS_MANAGER_URL is not configured.',
      );
    }
    
    const url = `${this.lensManagerUrl}/sites/${subscriberSiteAddress}/subscriptions/${targetSiteAddress}`;
    this.logger.log(
      `Proxying unsubscription request to lens-manager: DELETE ${url}`,
    );

    await firstValueFrom(
      this.httpService.delete(url).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(
            `Failed to proxy remove subscription request to lens-manager`,
            error.response?.data,
          );
          throw new InternalServerErrorException(
            'Failed to remove subscription.',
          );
        }),
      ),
    );
  }

  async getMySubscriptions(
    subscriberSiteAddress: string,
    query: FindSubscriptionsQueryDto,
  ): Promise<PaginatedSubscriptionsDto> {
    const url = `${this.indexerApiUrl}/subscriptions`;
    this.logger.log(
      `Proxying get subscriptions request to indexer-api: GET ${url}`,
    );

    const { data } = await firstValueFrom(
      this.httpService
        .get<PaginatedSubscriptionsDto>(url, {
          params: {
            ...query,
            subscriberSiteAddress,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              `Failed to proxy get subscriptions request to indexer-api`,
              error.response?.data,
            );
            throw new InternalServerErrorException(
              'Failed to retrieve subscriptions.',
            );
          }),
        ),
    );
    return data;
  }
}
