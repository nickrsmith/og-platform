import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Request,
  ValidationPipe,
  Logger,
  UploadedFile,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import { DataRoomsService } from './data-rooms.service';
import {
  JwtAuthGuard,
  type RequestWithUser,
} from '@app/common';
import { CreateDataRoomDto } from './dto/create-data-room.dto';
import { UpdateDataRoomDto } from './dto/update-data-room.dto';
import { GetDataRoomsQueryDto } from './dto/get-data-rooms.dto';
import {
  DataRoomResponseDto,
  DataRoomWithDocumentsResponseDto,
} from './dto/data-room-response.dto';
import { DataRoomDocumentResponseDto } from './dto/data-room-document-response.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

const tempDir = process.env.TEMP_STORAGE_PATH || '/usr/src/app/temp-uploads';
const MAX_FILE_SIZE = 750 * 1024 * 1024; // 750MB

const storage = diskStorage({
  destination: tempDir,
  filename: (_req, file, cb) => {
    const safeOriginalName = path.basename(file.originalname);
    const uniqueFilename = `${uuid()}-${safeOriginalName}`;
    cb(null, uniqueFilename);
  },
});

const fileInterceptor = FileInterceptor('file', {
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

const fileSizeManualValidation = (file: Express.Multer.File | undefined) => {
  if (file && file.size > MAX_FILE_SIZE) {
    throw new PayloadTooLargeException(
      `File ${file.originalname} exceeds the limit of 750MB.`,
    );
  }
};

@ApiTags('data-rooms')
@ApiBearerAuth('JWT-auth')
@Controller('data-rooms')
export class DataRoomsController {
  constructor(private readonly dataRoomsService: DataRoomsService) {}
  private readonly logger = new Logger(DataRoomsController.name);

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new data room',
    description: 'Creates a new data room for the current user',
  })
  @ApiBody({ type: CreateDataRoomDto })
  @ApiResponse({
    status: 201,
    description: 'Data room created successfully',
    type: DataRoomResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createDataRoom(
    @Request() req: RequestWithUser,
    @Body(validationPipe) dto: CreateDataRoomDto,
  ): Promise<DataRoomResponseDto> {
    this.logger.log(`Creating data room: ${dto.name} for user ${req.user.sub}`);
    return this.dataRoomsService.createDataRoom(
      req.user.sub,
      req.user.organizationId || null,
      dto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List data rooms',
    description: 'Get list of data rooms for the current user with optional filters',
  })
  @ApiQuery({ type: GetDataRoomsQueryDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Data rooms retrieved successfully',
    type: [DataRoomWithDocumentsResponseDto],
  })
  async getDataRooms(
    @Request() req: RequestWithUser,
    @Query(validationPipe) query: GetDataRoomsQueryDto,
  ): Promise<DataRoomWithDocumentsResponseDto[]> {
    this.logger.log(`Getting data rooms for user ${req.user.sub}`);
    return this.dataRoomsService.getDataRooms(req.user.sub, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get data room by ID',
    description: 'Get a specific data room with all its documents',
  })
  @ApiParam({ name: 'id', description: 'Data room ID' })
  @ApiResponse({
    status: 200,
    description: 'Data room retrieved successfully',
    type: DataRoomWithDocumentsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Data room not found' })
  async getDataRoomById(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<DataRoomWithDocumentsResponseDto> {
    this.logger.log(`Getting data room ${id} for user ${req.user.sub}`);
    return this.dataRoomsService.getDataRoomById(id, req.user.sub);
  }

  @Get('listing/:listingId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get data room by listing ID',
    description: 'Get data room associated with a specific listing (release ID)',
  })
  @ApiParam({ name: 'listingId', description: 'Listing/Release ID' })
  @ApiResponse({
    status: 200,
    description: 'Data room retrieved successfully',
    type: DataRoomWithDocumentsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Data room not found' })
  async getDataRoomByListing(
    @Param('listingId') listingId: string,
    @Request() req: RequestWithUser,
  ): Promise<DataRoomWithDocumentsResponseDto | null> {
    this.logger.log(`Getting data room for listing ${listingId} for user ${req.user.sub}`);
    return this.dataRoomsService.getDataRoomByListing(listingId, req.user.sub);
  }

  @Get('asset/:assetId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get data room by asset ID',
    description: 'Get data room associated with a specific asset ID',
  })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Data room retrieved successfully',
    type: DataRoomWithDocumentsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Data room not found' })
  async getDataRoomByAsset(
    @Param('assetId') assetId: string,
    @Request() req: RequestWithUser,
  ): Promise<DataRoomWithDocumentsResponseDto | null> {
    this.logger.log(`Getting data room for asset ${assetId} for user ${req.user.sub}`);
    return this.dataRoomsService.getDataRoomByAsset(assetId, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update data room',
    description: 'Update data room details (name, tier, access, status, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Data room ID' })
  @ApiBody({ type: UpdateDataRoomDto })
  @ApiResponse({
    status: 200,
    description: 'Data room updated successfully',
    type: DataRoomResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Data room not found' })
  async updateDataRoom(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body(validationPipe) dto: UpdateDataRoomDto,
  ): Promise<DataRoomResponseDto> {
    this.logger.log(`Updating data room ${id} for user ${req.user.sub}`);
    return this.dataRoomsService.updateDataRoom(id, req.user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete data room',
    description: 'Delete a data room and all its documents',
  })
  @ApiParam({ name: 'id', description: 'Data room ID' })
  @ApiResponse({
    status: 204,
    description: 'Data room deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Data room not found' })
  async deleteDataRoom(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    this.logger.log(`Deleting data room ${id} for user ${req.user.sub}`);
    await this.dataRoomsService.deleteDataRoom(id, req.user.sub);
  }

  @Post(':id/documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(fileInterceptor)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload document to data room',
    description: 'Upload a document to a data room (multipart/form-data)',
  })
  @ApiParam({ name: 'id', description: 'Data room ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        name: {
          type: 'string',
          description: 'Custom document name (optional)',
        },
        folderId: {
          type: 'string',
          description: 'Parent folder ID (optional)',
        },
        description: {
          type: 'string',
          description: 'Document description (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DataRoomDocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Data room not found' })
  @ApiResponse({ status: 413, description: 'File too large' })
  async uploadDocument(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
    @Body(validationPipe) body: UploadDocumentDto,
  ): Promise<DataRoomDocumentResponseDto> {
    fileSizeManualValidation(file);

    if (!file) {
      throw new Error('File is required');
    }

    this.logger.log(
      `Uploading document to data room ${id} for user ${req.user.sub}: ${file.originalname}`,
    );

    return this.dataRoomsService.uploadDocument(id, req.user.sub, file, {
      name: body.name,
      folderId: body.folderId,
      description: body.description,
    });
  }

  @Delete(':id/documents/:docId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete document from data room',
    description: 'Delete a document from a data room',
  })
  @ApiParam({ name: 'id', description: 'Data room ID' })
  @ApiParam({ name: 'docId', description: 'Document ID' })
  @ApiResponse({
    status: 204,
    description: 'Document deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Data room or document not found' })
  async deleteDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    this.logger.log(
      `Deleting document ${docId} from data room ${id} for user ${req.user.sub}`,
    );
    await this.dataRoomsService.deleteDocument(id, docId, req.user.sub);
  }
}
