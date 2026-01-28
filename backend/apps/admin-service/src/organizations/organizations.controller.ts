import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  CreateInvitationRequestDto,
  RejectApplcationRequestDto,
  UpdateMemberRoleRequestDto,
} from '@app/common';
import { OrganizationsService } from './organizations.service';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CreateOrganizationByAdminDto } from './dto/organization-magnament.dto';

@Controller('organizations')
@UseGuards(AdminJwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationService: OrganizationsService) {}

  // --- Organization Endpoints ---

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOrganizationByAdmin(
    @Body(new ValidationPipe()) dto: CreateOrganizationByAdminDto,
  ) {
    return this.organizationService.createOrganizationByAdmin(dto);
  }

  @Get()
  listAllOrganizations() {
    return this.organizationService.listAll();
  }

  // --- Organization Request Endpoints ---
  @Get('requests')
  listPendingRequests() {
    return this.organizationService.listPending();
  }

  @Post('requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveRequest(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.organizationService.approve(id);
  }

  @Post('requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ValidationPipe()) dto: RejectApplcationRequestDto,
  ) {
    return this.organizationService.reject(id, dto.reason);
  }

  // --- Single Organization and Member Management ---
  @Get(':id')
  getOrganizationDetails(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.organizationService.getDetails(id);
  }

  @Get(':orgId/members')
  listMembers(@Param('orgId', new ParseUUIDPipe()) orgId: string) {
    return this.organizationService.listMembers(orgId);
  }

  @Post(':orgId/members/invite')
  @HttpCode(HttpStatus.OK)
  inviteMember(
    @Param('orgId', new ParseUUIDPipe()) orgId: string,
    @Body(new ValidationPipe()) dto: CreateInvitationRequestDto,
  ) {
    return this.organizationService.inviteMember(orgId, dto);
  }

  @Patch(':orgId/members/:userId')
  @HttpCode(HttpStatus.OK)
  updateMemberRole(
    @Param('orgId', new ParseUUIDPipe()) orgId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body(new ValidationPipe()) dto: UpdateMemberRoleRequestDto,
  ) {
    return this.organizationService.updateMemberRole(orgId, userId, dto.role);
  }

  @Delete(':orgId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('orgId', new ParseUUIDPipe()) orgId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.organizationService.removeMember(orgId, userId);
  }

  @Get('site/:siteAddress')
  findBySiteAddress(@Param('siteAddress') siteAddress: string) {
    return this.organizationService.findBySiteAddress(siteAddress);
  }
}
