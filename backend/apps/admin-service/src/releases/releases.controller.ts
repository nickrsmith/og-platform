import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  UseGuards,
  Body,
  ValidationPipe,
  Delete,
  Query,
} from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { IsOptional, IsString } from 'class-validator';
import { FindQueryDto } from '@app/common';

class RejectDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

@Controller('releases')
@UseGuards(AdminJwtAuthGuard)
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get('pending-verifications')
  @HttpCode(HttpStatus.OK)
  findPendingVerifications(
    @Query(new ValidationPipe({ transform: true })) query: FindQueryDto,
  ) {
    return this.releasesService.findPendingVerifications(query);
  }

  @Post(':id/approve-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  approve(@Param('id') id: string) {
    return this.releasesService.approveVerification(id);
  }

  @Post(':id/reject-verification')
  @HttpCode(HttpStatus.OK)
  reject(@Param('id') id: string, @Body(new ValidationPipe()) dto: RejectDto) {
    return this.releasesService.rejectVerification(id, dto.reason);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRelease(@Param('id') id: string) {
    return this.releasesService.deleteRelease(id);
  }

  @Get('flagged')
  @HttpCode(HttpStatus.OK)
  findFlagged(@Query(new ValidationPipe({ transform: true })) query: FindQueryDto) {
    return this.releasesService.findFlagged(query);
  }

  @Post(':id/flag')
  @HttpCode(HttpStatus.OK)
  flagRelease(@Param('id') id: string, @Body(new ValidationPipe()) dto: RejectDto) {
    return this.releasesService.flagRelease(id, dto.reason);
  }

  @Post(':id/unflag')
  @HttpCode(HttpStatus.OK)
  unflagRelease(@Param('id') id: string) {
    return this.releasesService.unflagRelease(id);
  }

  @Get('featured')
  @HttpCode(HttpStatus.OK)
  findFeatured(@Query(new ValidationPipe({ transform: true })) query: FindQueryDto) {
    return this.releasesService.findFeatured(query);
  }

  @Post(':id/feature')
  @HttpCode(HttpStatus.OK)
  featureRelease(@Param('id') id: string) {
    return this.releasesService.featureRelease(id);
  }

  @Post(':id/unfeature')
  @HttpCode(HttpStatus.OK)
  unfeatureRelease(@Param('id') id: string) {
    return this.releasesService.unfeatureRelease(id);
  }
}
