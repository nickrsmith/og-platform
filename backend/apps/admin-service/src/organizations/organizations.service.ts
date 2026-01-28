import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/database';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
  AdminOrganizationListItemDto,
  ChainEventType,
  CreateBlockchainJobRequestDto,
  CreateChainTransactionRequestDto,
  CreateSiteRequestDto,
  CreateInvitationRequestDto,
  Role,
  CreateOrgContractPayload,
  OrganizationProfileDto,
} from '@app/common';
import {
  InvitationStatus,
  OrganizationRole,
  OrganizationStatus,
  Prisma,
  RequestStatus,
} from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { EmailService } from '@app/common/modules/email/email.service';
import * as crypto from 'crypto';
import {
  AdminOrganizationDetailsDto,
  CreateOrganizationByAdminDto,
} from './dto/organization-magnament.dto';

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
  private readonly blockchainServiceUrl: string;
  private readonly lensManagerUrl: string;
  private readonly indexerApiUrl: string;
  private readonly royaltyDashboardUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly emailService: EmailService,
  ) {
    this.blockchainServiceUrl = this.configService.getOrThrow(
      'BLOCKCHAIN_SERVICE_URL',
    );
    this.lensManagerUrl = this.configService.getOrThrow('LENS_MANAGER_URL');
    this.indexerApiUrl = this.configService.getOrThrow('INDEXER_API_URL');
    this.royaltyDashboardUrl = this.configService.getOrThrow(
      'ROYALTY_MARKETPLACE_URL',
    );
  }

  async createOrganizationByAdmin(dto: CreateOrganizationByAdminDto) {
    const { name, principalEmail } = dto;
    this.logger.log(
      `Admin is creating a new unclaimed organization '${name}' for principal ${principalEmail}`,
    );

    // 1. Create the 'UNCLAIMED' Organization
    const newOrganization = await this.prisma.organization.create({
      data: {
        name,
        status: OrganizationStatus.UNCLAIMED,
      },
    });

    // 2. Reuse the inviteMember logic to create an invitation for the Principal
    const inviteDto: CreateInvitationRequestDto = {
      email: principalEmail,
      role: Role.Principal,
    };

    // We call the internal inviteMember method, not the controller endpoint.
    // This is a clean way to reuse the token generation and email sending logic.
    await this.inviteMember(newOrganization.id, inviteDto, 'onboarding');

    this.logger.log(
      `Successfully created organization ${newOrganization.id} and sent Principal invitation.`,
    );
    return newOrganization;
  }

  async getDetails(orgId: string): Promise<AdminOrganizationDetailsDto> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${orgId} not found.`);
    }

    // Placeholder for active assets, same as the list endpoint
    const activeAssetCount = 0;

    return {
      id: organization.id,
      name: organization.name,
      memberCount: organization._count.members,
      activeAssetCount,
    };
  }

  async listAll(): Promise<AdminOrganizationListItemDto[]> {
    const organizations = await this.prisma.organization.findMany({
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // NOTE: Getting `activeAssetsCount` requires a call to the indexer-api.
    // For now, we will return a placeholder value. A dedicated analytics endpoint
    // would be needed for an efficient implementation in production.
    const activeAssetCount = 0; // Placeholder

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      memberCount: org._count.members,
      activeAssetCount,
    }));
  }

  async listPending() {
    return this.prisma.organizationCreationRequest.findMany({
      where: { status: RequestStatus.PENDING },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
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
    return this._toProfileDto(fullProfile);
  }

  async reject(requestId: string, reason?: string) {
    const request = await this.prisma.organizationCreationRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { email: true } } },
    });

    if (!request || request.status !== RequestStatus.PENDING) {
      throw new NotFoundException('Pending request not found.');
    }

    // Email notification for rejection
    await this.emailService.sendOrganizationRequestRejected(
      request.user.email,
      {
        requestedName: request.requestedName,
        reason:
          reason ||
          'Unfortunately, your request could not be approved at this time.',
      },
    );

    return this.prisma.organizationCreationRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        reviewedAt: new Date(),
        adminNotes: reason,
      },
    });
  }

  async approve(requestId: string) {
    const request = await this.prisma.organizationCreationRequest.findUnique({
      where: { id: requestId },
      include: { user: { include: { p2pIdentity: true, wallet: true } } },
    });

    if (!request) throw new NotFoundException('Request not found.');
    if (request.status !== RequestStatus.PENDING)
      throw new ConflictException('Request has already been reviewed.');
    if (!request.user.p2pIdentity || !request.user.wallet)
      throw new InternalServerErrorException(
        'User is missing a wallet or P2P identity.',
      );

    const { user, requestedName, country, legalEntityType, primaryIndustry } =
      request;

    // --- STEP 1: Create the Organization record ---
    const organization = await this.prisma.organization.create({
      data: {
        name: requestedName,
        principalUserId: user.id,
        country,
        legalEntityType,
        primaryIndustry,
        members: {
          create: { userId: user.id, role: OrganizationRole.Principal },
        },
      },
    });

    // --- STEP 2: Provision resources (P2P Site, On-Chain Contract) ---
    const finalOrganization = await this._provisionOrganizationResources(
      organization.id,
      user.p2pIdentity!.publicKey,
      user.wallet!.walletAddress,
      user.id,
    );

    // --- STEP 3: Finalize the request status ---
    await this.prisma.organizationCreationRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.APPROVED, reviewedAt: new Date() },
    });

    await this.emailService.sendOrganizationRequestApproved(user.email, {
      organizationName: finalOrganization.name,
    });

    this.logger.log(
      `Organization ${organization.id} approved and provisioned for user ${user.id}.`,
    );
    return finalOrganization;
  }

  async listMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async inviteMember(
    orgId: string,
    dto: CreateInvitationRequestDto,
    type: 'standard' | 'onboarding' = 'standard',
  ) {
    const { email, role } = dto;
    this.logger.log(
      `Admin is inviting ${email} to organization ${orgId} with role ${role}`,
    );

    // 1. Fetch the organization to ensure it exists and to get its name for the email.
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    });
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${orgId} not found.`);
    }

    // 2. Check if the user is already a member of the organization.
    const existingMember = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId: orgId,
        user: { email },
      },
    });
    if (existingMember) {
      throw new ConflictException(
        'This user is already a member of the organization.',
      );
    }

    // 3. Check for an existing PENDING invitation for this email.
    const existingInvitation =
      await this.prisma.organizationInvitation.findFirst({
        where: {
          organizationId: orgId,
          email,
          status: InvitationStatus.PENDING,
        },
      });
    if (existingInvitation) {
      throw new ConflictException(
        'An invitation has already been sent to this email address.',
      );
    }

    // 4. Generate a secure token and set an expiration date.
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // 5. Create the invitation record directly in the database.
    await this.prisma.organizationInvitation.create({
      data: {
        organizationId: orgId,
        email,
        role: role as OrganizationRole,
        token,
        expiresAt,
      },
    });

    // 6. Send the invitation email using the shared EmailService.
    const invitationLink = `${this.royaltyDashboardUrl}/login?invitationToken=${token}`;
    if (type === 'onboarding') {
      await this.emailService.sendOrganizationOnboardingInvitation(
        email,
        organization.name,
        invitationLink,
      );
    } else {
      await this.emailService.sendOrganizationInvitation(
        email,
        organization.name,
        invitationLink,
      );
    }

    return { message: `Invitation successfully sent to ${email}.` };
  }

  async updateMemberRole(orgId: string, userId: string, newRole: Role) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!member) {
      throw new NotFoundException('Organization member not found.');
    }

    return this.prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId: orgId, userId } },
      data: { role: newRole as OrganizationRole },
    });
  }

  async removeMember(orgId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!member) {
      throw new NotFoundException('Organization member not found.');
    }
    if (member.role === OrganizationRole.Principal) {
      throw new BadRequestException(
        'The Principal of an organization cannot be removed.',
      );
    }

    await this.prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
  }

  private async _provisionOrganizationResources(
    organizationId: string,
    p2pPublicKey: string,
    principalWalletAddress: string,
    principalUserId: string,
  ) {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    const { siteAddress } = await this._createP2PSite({
      userPublicKey: p2pPublicKey,
      organizationId: organization.id,
      alias: organization.name,
    });

    const finalOrganization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { siteAddress },
    });

    void this._enqueueOrgContractCreation(
      organization.id,
      principalUserId,
      principalWalletAddress,
    );

    return finalOrganization;
  }

  private async _createP2PSite(
    dto: CreateSiteRequestDto,
  ): Promise<{ siteAddress: string }> {
    const url = `${this.lensManagerUrl}/sites`;
    this.logger.log(`Attempting to create P2P site at: ${url}`);

    const startTime = Date.now();
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<{ siteAddress: string }>(url, dto).pipe(
          catchError((error: AxiosError) => {
            const duration = Date.now() - startTime;
            const statusCode = error.response?.status;
            const statusText = error.response?.statusText;
            const responseData = error.response?.data;
            const errorMessage = error.message;
            const isTimeout =
              error.code === 'ECONNABORTED' || errorMessage.includes('timeout');

            this.logger.error(
              `Failed to create P2P site (took ${duration}ms)`,
              {
                url,
                statusCode,
                statusText,
                responseData,
                errorMessage,
                errorCode: error.code,
                isTimeout,
                lensManagerUrl: this.lensManagerUrl,
              },
            );

            // Provide more specific error messages
            if (isTimeout) {
              throw new InternalServerErrorException(
                `Lens Manager request timed out after ${duration}ms. URL: ${url}. The service may be overloaded or unreachable.`,
              );
            } else if (statusCode === 404) {
              throw new InternalServerErrorException(
                `Lens Manager endpoint not found. URL: ${url}. Please verify LENS_MANAGER_URL is correct and lens-manager service is running.`,
              );
            } else if (statusCode === 503 || statusCode === 502) {
              throw new InternalServerErrorException(
                `Lens Manager service unavailable. Please verify lens-manager service is running and healthy.`,
              );
            } else if (!error.response) {
              throw new InternalServerErrorException(
                `Cannot reach Lens Manager service at ${url}. Network error: ${errorMessage}`,
              );
            }

            throw new InternalServerErrorException(
              `Failed to provision P2P site. Status: ${statusCode} ${statusText}. Response: ${JSON.stringify(responseData)}`,
            );
          }),
        ),
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `Successfully created P2P site: ${data.siteAddress} (took ${duration}ms)`,
      );
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`P2P site creation failed after ${duration}ms`, error);
      throw error;
    }
  }

  private async _enqueueOrgContractCreation(
    organizationId: string,
    principalUserId: string,
    principalWalletAddress: string,
  ) {
    const blockchainJobUrl = `${this.blockchainServiceUrl}/jobs`;
    const indexerTxUrl = `${this.indexerApiUrl}/transactions`;
    const txId = uuid();

    const platformVerifierWalletAddress = this.configService.get<string>(
      'PLATFORM_VERIFIER_ADDRESS',
    );

    if (!platformVerifierWalletAddress) {
      throw new Error(
        'PLATFORM_VERIFIER_ADDRESS is not configured. Cannot auto-grant verifier role.',
      );
    }

    const jobPayload: CreateOrgContractPayload = {
      txId,
      organizationId,
      principalUserId,
      principalWalletAddress,
      platformVerifierWalletAddress,
    };

    const jobRequest: CreateBlockchainJobRequestDto = {
      eventType: ChainEventType.CREATE_ORG_CONTRACT,
      txId,
      payload: jobPayload,
    };

    const indexerRequest: CreateChainTransactionRequestDto = {
      txId,
      eventType: ChainEventType.CREATE_ORG_CONTRACT,
      submittedAt: new Date().toISOString(),
      relatedObjectId: organizationId,
    };

    try {
      await firstValueFrom(this.httpService.post(indexerTxUrl, indexerRequest));
      void firstValueFrom(
        this.httpService.post(blockchainJobUrl, jobRequest, {
          headers: { 'X-Idempotency-Key': `create-org-${organizationId}` },
        }),
      );
    } catch (err) {
      this.logger.error(
        `Failed to enqueue contract creation for org ${organizationId}`,
        err,
      );
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
  private _toProfileDto(org: OrganizationWithDetails): OrganizationProfileDto {
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
      isConfigured: org.isConfigured,
      links: org.links.map((link) => ({
        id: link.id,
        type: link.type,
        url: link.url,
      })),
      createdAt: org.createdAt.toISOString(),
    };
  }
}
