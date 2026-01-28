import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  PayloadTooLargeException,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import {
  AcceptMemberInvitationDto,
  CreateInvitationRequestDto,
  CreateOrganizationRequestDto,
  FindMembersQueryDto,
  FindReleasesQueryDto,
  JwtAuthGuard,
  MemberGuard,
  OrganizationLogoStatusDto,
  OrganizationMemberDto,
  OrganizationProfileDto,
  PaginationQueryDto,
  Role,
  Roles,
  RolesGuard,
  UpdateOrganizationProfileDto,
  type RequestWithUser,
} from '@app/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import {
  CreateSubscriptionDto,
  FindSubscriptionsQueryDto,
  PaginatedSubscriptionsDto,
} from '@app/common/dto/subscription.dto';

const tempDir = process.env.TEMP_STORAGE_PATH || '/usr/src/app/temp-uploads';
// Ensure absolute path
const absoluteTempDir = path.isAbsolute(tempDir)
  ? tempDir
  : path.resolve(process.cwd(), tempDir);

const storage = diskStorage({
  destination: absoluteTempDir,
  filename: (_req, file, cb) => {
    const safeOriginalName = path.basename(file.originalname);
    const uniqueFilename = `${uuid()}-${safeOriginalName}`;
    cb(null, uniqueFilename);
  },
});

@Controller('organizations')
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('requests/me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getMyRequestStatus(@Request() req: RequestWithUser) {
    const { sub: userId } = req.user;
    return this.organizationsService.getMyRequestStatus(userId);
  }

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async submitCreationRequest(
    @Request() req: RequestWithUser,
    @Body(new ValidationPipe()) dto: CreateOrganizationRequestDto,
  ): Promise<void> {
    const { sub: userId } = req.user;
    await this.organizationsService.createRequest(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, MemberGuard)
  @HttpCode(HttpStatus.OK)
  getMyOrganization(
    @Request() req: RequestWithUser,
  ): Promise<OrganizationProfileDto> {
    // We already have the organizationId from the token thanks to the MemberGuard.
    const { organizationId } = req.user;
    return this.organizationsService.getMyOrganization(organizationId!);
  }

  @Get('me/logo/status')
  @UseGuards(JwtAuthGuard, MemberGuard)
  @HttpCode(HttpStatus.OK)
  getMyOrganizationLogoStatus(
    @Request() req: RequestWithUser,
  ): Promise<OrganizationLogoStatusDto> {
    const { organizationId } = req.user;
    return this.organizationsService.getMyOrganizationLogoStatus(
      organizationId!,
    );
  }

  @Post('me/logo')
  @UseGuards(JwtAuthGuard, MemberGuard, RolesGuard)
  @Roles(Role.Principal, Role.Manager)
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  uploadLogo(
    @Request() req: RequestWithUser,
    @UploadedFile() logoFile: Express.Multer.File,
  ) {
    if (!logoFile) {
      throw new PayloadTooLargeException(
        'Logo file is missing or exceeds the 5MB size limit.',
      );
    }
    const { organizationId } = req.user;
    return this.organizationsService.updateMyOrganizationLogo(
      organizationId!,
      logoFile,
    );
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, MemberGuard, RolesGuard)
  @Roles(Role.Principal, Role.Manager)
  @HttpCode(HttpStatus.OK)
  updateMyOrganization(
    @Request() req: RequestWithUser,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: UpdateOrganizationProfileDto,
  ): Promise<OrganizationProfileDto> {
    const { organizationId } = req.user;
    return this.organizationsService.updateMyOrganization(organizationId!, dto);
  }

  @Get('me/members')
  @UseGuards(JwtAuthGuard, MemberGuard)
  @HttpCode(HttpStatus.OK)
  getMyOrganizationMembers(
    @Request() req: RequestWithUser,
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: FindMembersQueryDto,
  ): Promise<OrganizationMemberDto[]> {
    const { organizationId } = req.user;
    return this.organizationsService.findMembers(organizationId!, query);
  }

  @Post('me/invites')
  @UseGuards(JwtAuthGuard, MemberGuard, RolesGuard)
  @Roles(Role.Principal, Role.Manager)
  @HttpCode(HttpStatus.NO_CONTENT)
  async inviteMember(
    @Request() req: RequestWithUser,
    @Body(new ValidationPipe()) dto: CreateInvitationRequestDto,
  ): Promise<void> {
    // CRITICAL: organizationId comes from JWT token (req.user), NOT from request body
    // This ensures users can only invite to their own organization
    const { organizationId, sub: userId } = req.user;

    if (!organizationId) {
      this.logger.error(
        `[inviteMember] User ${userId} attempted to invite without organizationId in token`,
      );
      throw new BadRequestException(
        'Organization ID is required. User must be a member of an organization.',
      );
    }

    this.logger.log(
      `[inviteMember] User ${userId} inviting ${dto.email} to organization ${organizationId}`,
    );

    try {
      await this.organizationsService.createInvitation(organizationId, dto);
      this.logger.log(
        `[inviteMember] Successfully created invitation for ${dto.email} in organization ${organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        `[inviteMember] Failed to create invitation for ${dto.email} in organization ${organizationId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (error instanceof Error) {
        this.logger.error(`[inviteMember] Error stack: ${error.stack}`);
      }
      // Re-throw the error so NestJS can handle it and return appropriate HTTP response
      throw error;
    }
  }

  @Post('invitations/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptInvitation(
    @Request() req: RequestWithUser,
    @Body(new ValidationPipe()) dto: AcceptMemberInvitationDto,
  ): Promise<void> {
    const { sub: userId, email } = req.user;

    if (!email) {
      this.logger.error(
        `[CONTROLLER] Email not found in JWT token for user ${userId}`,
      );
      throw new BadRequestException('Email not found in authentication token');
    }

    if (!dto.token) {
      this.logger.error(`[CONTROLLER] Invitation token is missing`);
      throw new BadRequestException('Invitation token is required');
    }

    this.logger.log(
      `[CONTROLLER] Accept invitation request - User: ${userId}, Email: ${email}, Token: ${dto.token.substring(0, 8)}...`,
    );
    try {
      await this.organizationsService.acceptInvitation(
        userId,
        email,
        dto.token,
      );
      this.logger.log(
        `[CONTROLLER] Successfully accepted invitation for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] Failed to accept invitation for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (error instanceof Error) {
        this.logger.error(`[CONTROLLER] Error stack: ${error.stack}`);
      }
      throw error;
    }
  }

  @Get()
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: PaginationQueryDto,
  ) {
    return this.organizationsService.findAll(query);
  }

  @Get('site/:siteAddress')
  findBySiteAddress(@Param('siteAddress') siteAddress: string) {
    return this.organizationsService.findBySiteAddress(siteAddress);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: FindReleasesQueryDto,
  ) {
    return this.organizationsService.findOne(id, query);
  }

  @Get('me/following')
  @UseGuards(JwtAuthGuard, MemberGuard)
  @HttpCode(HttpStatus.OK)
  findMyFollowing(
    @Request() req: RequestWithUser,
  ): Promise<OrganizationProfileDto[]> {
    return this.organizationsService.findFollowing(req.user.organizationId!);
  }

  @Get(':id/follow-status')
  @UseGuards(JwtAuthGuard, MemberGuard)
  getFollowStatus(@Param('id') id: string, @Request() req: RequestWithUser) {
    const requesterOrgId = req.user.organizationId;
    return this.organizationsService.getFollowStatus(requesterOrgId!, id);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard, MemberGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  follow(@Param('id') id: string, @Request() req: RequestWithUser) {
    const followerOrgId = req.user.organizationId;
    return this.organizationsService.follow(followerOrgId!, id);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard, MemberGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  unfollow(@Param('id') id: string, @Request() req: RequestWithUser) {
    const followerOrgId = req.user.organizationId;
    return this.organizationsService.unfollow(followerOrgId!, id);
  }

  @Get('me/earnings/balance')
  @UseGuards(JwtAuthGuard, MemberGuard)
  getMyOrganizationEarnings(@Request() req: RequestWithUser) {
    const { organizationId } = req.user;
    return this.organizationsService.getMyOrganizationEarnings(organizationId!);
  }

  @Post('me/earnings/withdraw')
  @UseGuards(JwtAuthGuard, MemberGuard, RolesGuard)
  @Roles(Role.Principal)
  @HttpCode(HttpStatus.ACCEPTED)
  initiateEarningsWithdrawal(@Request() req: RequestWithUser) {
    const { organizationId, sub: principalUserId } = req.user;
    return this.organizationsService.initiateEarningsWithdrawal(
      organizationId!,
      principalUserId,
    );
  }

  @Get('me/subscriptions')
  @UseGuards(JwtAuthGuard, MemberGuard)
  getMySubscriptions(
    @Request() req: RequestWithUser,
    @Query(new ValidationPipe({ transform: true }))
    query: FindSubscriptionsQueryDto,
  ): Promise<PaginatedSubscriptionsDto> {
    const subscriberSiteAddress = req.user.siteAddress!;
    return this.organizationsService.getMySubscriptions(
      subscriberSiteAddress,
      query,
    );
  }

  @Post('subscriptions')
  @UseGuards(JwtAuthGuard, MemberGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  createSubscription(
    @Request() req: RequestWithUser,
    @Body(new ValidationPipe()) dto: CreateSubscriptionDto,
  ) {
    const subscriberSiteAddress = req.user.siteAddress!;
    return this.organizationsService.createSubscription(
      subscriberSiteAddress,
      dto.targetSiteAddress,
      req.user.p2pPublicKey,
    );
  }

  @Delete('subscriptions/:targetSiteAddress')
  @UseGuards(JwtAuthGuard, MemberGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSubscription(
    @Request() req: RequestWithUser,
    @Param('targetSiteAddress') targetSiteAddress: string,
  ) {
    const subscriberSiteAddress = req.user.siteAddress!;
    return this.organizationsService.removeSubscription(
      subscriberSiteAddress,
      targetSiteAddress,
    );
  }
}
