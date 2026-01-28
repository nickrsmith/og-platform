import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Param,
  Get,
  Query,
  ValidationPipe,
  UploadedFiles,
  PayloadTooLargeException,
  Logger,
  Delete,
  Patch,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ReleasesService } from './releases.service';
import {
  CreateReleaseDto,
  FindReleasesQueryDto,
  JwtAuthGuard,
  LicenseAssetRequestDto,
  MemberGuard,
  RolesGuard,
  UpdateReleaseDto,
  type RequestWithUser,
} from '@app/common';

import { Role } from '@app/common/enums/roles.enum';
import { Roles } from '@app/common/decorators/roles.decorator';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

const tempDir = process.env.TEMP_STORAGE_PATH || '/usr/src/app/temp-uploads';

const storage = diskStorage({
  destination: tempDir,
  filename: (_req, file, cb) => {
    const safeOriginalName = path.basename(file.originalname);
    const uniqueFilename = `${uuid()}-${safeOriginalName}`;
    cb(null, uniqueFilename);
  },
});

const fileFieldsInterceptor = FileFieldsInterceptor(
  [
    { name: 'file', maxCount: 1 },
    { name: 'thumbnails', maxCount: 6 },
  ],
  {
    storage: storage,
    limits: {
      fileSize: 750 * 1024 * 1024, // 750MB
    },
  },
);

const fileSizeManualValidation = (files: UploadedFilesInterface) => {
  const MAX_FILE_SIZE = 750 * 1024 * 1024; // 750MB

  const allFiles = [...(files.file || []), ...(files.thumbnails || [])];
  for (const file of allFiles) {
    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException(
        `File ${file.originalname} exceeds the limit of 750MB.`,
      );
    }
  }
};

interface UploadedFilesInterface {
  file?: Express.Multer.File[];
  thumbnails?: Express.Multer.File[];
}

@Controller('releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}
  private readonly logger = new Logger(ReleasesController.name);

  @Post(':releaseId/files')
  @UseGuards(JwtAuthGuard, MemberGuard, RolesGuard)
  @Roles(Role.AssetManager, Role.Principal)
  @UseInterceptors(fileFieldsInterceptor)
  @HttpCode(HttpStatus.ACCEPTED)
  async uploadFiles(
    @Param('releaseId') releaseId: string,
    @UploadedFiles() files: UploadedFilesInterface,
    @Body(validationPipe) body: { existingThumbnailCIDs?: string | string[] },
    @Request() req: RequestWithUser,
  ) {
    fileSizeManualValidation(files);

    // Normalize existingThumbnailCIDs as it can be a single string or an array
    const existingCIDs = Array.isArray(body.existingThumbnailCIDs)
      ? body.existingThumbnailCIDs
      : body.existingThumbnailCIDs
        ? [body.existingThumbnailCIDs]
        : [];
    const { organizationId, siteAddress } = req.user;
    return this.releasesService.uploadReleaseFiles({
      organizationId: organizationId!,
      userId: req.user.sub,
      siteAddress: siteAddress!,
      releaseId,
      actorPeerId: req.user.peerId,
      file: files.file?.[0],
      thumbnails: files.thumbnails,
      existingThumbnailCIDs: existingCIDs,
    });
  }

  @Post(':releaseId/licenses')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async license(
    @Param('releaseId') releaseId: string,
    @Request() req: RequestWithUser,
    @Body(validationPipe) dto: LicenseAssetRequestDto,
  ) {
    return this.releasesService.initiateAssetOnChainLicense(
      releaseId,
      req.user,
      dto.attemptId,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query(validationPipe) query: FindReleasesQueryDto) {
    return this.releasesService.findAllReleases(query);
  }

  @Get(':releaseId')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('releaseId') releaseId: string) {
    return this.releasesService.findOneRelease(releaseId);
  }

  @Get('check-hash/:hash')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkAssetHash(@Param('hash') hash: string) {
    return this.releasesService.checkAssetHash(hash);
  }

  @Post()
  @UseGuards(JwtAuthGuard, MemberGuard, RolesGuard)
  @Roles(Role.AssetManager, Role.Principal, Role.Manager)
  @HttpCode(HttpStatus.CREATED)
  createRelease(
    @Request() req: RequestWithUser,
    @Body(new ValidationPipe())
    dto: Omit<CreateReleaseDto, 'siteAddress' | 'postedBy'>,
  ) {
    const { siteAddress, p2pPublicKey } = req.user;
    return this.releasesService.createRelease(siteAddress!, p2pPublicKey, dto);
  }

  @Patch(':releaseId')
  @UseGuards(JwtAuthGuard, MemberGuard, RolesGuard)
  @Roles(Role.AssetManager, Role.Principal, Role.Manager)
  @HttpCode(HttpStatus.OK)
  updateRelease(
    @Request() req: RequestWithUser,
    @Param('releaseId') releaseId: string,
    @Body(new ValidationPipe()) dto: UpdateReleaseDto,
  ) {
    const { siteAddress } = req.user;
    return this.releasesService.updateRelease(siteAddress!, releaseId, dto);
  }

  @Delete(':releaseId')
  @UseGuards(JwtAuthGuard, MemberGuard, RolesGuard)
  @Roles(Role.AssetManager, Role.Principal, Role.Manager)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRelease(
    @Request() req: RequestWithUser,
    @Param('releaseId') releaseId: string,
  ): Promise<void> {
    const { siteAddress } = req.user;
    return this.releasesService.removeRelease(siteAddress!, releaseId);
  }
}
