import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@app/database';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
  CreateDataRoomDto,
  DataRoomTier,
  DataRoomAccess,
} from './dto/create-data-room.dto';
import {
  UpdateDataRoomDto,
  DataRoomStatus,
} from './dto/update-data-room.dto';
import { GetDataRoomsQueryDto } from './dto/get-data-rooms.dto';
import {
  DataRoomResponseDto,
  DataRoomWithDocumentsResponseDto,
} from './dto/data-room-response.dto';
import { DataRoomDocumentResponseDto } from './dto/data-room-document-response.dto';
import { DataRoomAccess as PrismaDataRoomAccess, DataRoomStatus as PrismaDataRoomStatus, DataRoomTier as PrismaDataRoomTier } from '@prisma/client';

@Injectable()
export class DataRoomsService {
  private readonly logger = new Logger(DataRoomsService.name);
  private readonly ipfsServiceUrl: string | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.ipfsServiceUrl = this.configService.get<string>('IPFS_SERVICE_URL') || null;
  }

  async createDataRoom(
    userId: string,
    organizationId: string | null,
    dto: CreateDataRoomDto,
  ): Promise<DataRoomResponseDto> {
    this.logger.log(`Creating data room: ${dto.name} for user: ${userId}`);

    const dataRoom = await this.prisma.dataRoom.create({
      data: {
        name: dto.name,
        userId,
        organizationId,
        assetId: dto.assetId || null,
        releaseId: dto.listingId || null,
        tier: (dto.tier || DataRoomTier.SIMPLE) as PrismaDataRoomTier,
        access: (dto.access || DataRoomAccess.RESTRICTED) as PrismaDataRoomAccess,
        status: PrismaDataRoomStatus.INCOMPLETE,
        documentCount: 0,
        totalSize: BigInt(0),
      },
    });

    return this.mapToResponseDto(dataRoom);
  }

  async getDataRooms(
    userId: string,
    query: GetDataRoomsQueryDto,
  ): Promise<DataRoomWithDocumentsResponseDto[]> {
    const where: any = {
      userId,
    };

    if (query.listingId) {
      where.releaseId = query.listingId;
    }
    if (query.assetId) {
      where.assetId = query.assetId;
    }
    if (query.status) {
      where.status = query.status as PrismaDataRoomStatus;
    }
    if (query.userId && query.userId !== userId) {
      // Admin or list operation - use specified userId
      where.userId = query.userId;
    }

    const dataRooms = await this.prisma.dataRoom.findMany({
      where,
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return dataRooms.map((dr) => this.mapToResponseWithDocumentsDto(dr));
  }

  async getDataRoomById(
    dataRoomId: string,
    userId: string,
  ): Promise<DataRoomWithDocumentsResponseDto> {
    const dataRoom = await this.prisma.dataRoom.findFirst({
      where: {
        id: dataRoomId,
        userId, // Ensure user can only access their own data rooms
      },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!dataRoom) {
      throw new NotFoundException(`Data room with ID ${dataRoomId} not found`);
    }

    return this.mapToResponseWithDocumentsDto(dataRoom);
  }

  async getDataRoomByListing(
    listingId: string,
    userId: string,
  ): Promise<DataRoomWithDocumentsResponseDto | null> {
    const dataRoom = await this.prisma.dataRoom.findFirst({
      where: {
        releaseId: listingId,
        userId,
      },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!dataRoom) {
      return null;
    }

    return this.mapToResponseWithDocumentsDto(dataRoom);
  }

  async getDataRoomByAsset(
    assetId: string,
    userId: string,
  ): Promise<DataRoomWithDocumentsResponseDto | null> {
    const dataRoom = await this.prisma.dataRoom.findFirst({
      where: {
        assetId,
        userId,
      },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!dataRoom) {
      return null;
    }

    return this.mapToResponseWithDocumentsDto(dataRoom);
  }

  async updateDataRoom(
    dataRoomId: string,
    userId: string,
    dto: UpdateDataRoomDto,
  ): Promise<DataRoomResponseDto> {
    // Verify ownership
    const existing = await this.prisma.dataRoom.findFirst({
      where: {
        id: dataRoomId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Data room with ID ${dataRoomId} not found`);
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.tier !== undefined) updateData.tier = dto.tier as PrismaDataRoomTier;
    if (dto.access !== undefined) updateData.access = dto.access as PrismaDataRoomAccess;
    if (dto.status !== undefined) updateData.status = dto.status as PrismaDataRoomStatus;
    if (dto.assetId !== undefined) updateData.assetId = dto.assetId;
    if (dto.listingId !== undefined) updateData.releaseId = dto.listingId;

    const updated = await this.prisma.dataRoom.update({
      where: { id: dataRoomId },
      data: updateData,
    });

    return this.mapToResponseDto(updated);
  }

  async deleteDataRoom(dataRoomId: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await this.prisma.dataRoom.findFirst({
      where: {
        id: dataRoomId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Data room with ID ${dataRoomId} not found`);
    }

    // Cascade delete will handle documents
    await this.prisma.dataRoom.delete({
      where: { id: dataRoomId },
    });

    this.logger.log(`Deleted data room: ${dataRoomId}`);
  }

  async uploadDocument(
    dataRoomId: string,
    userId: string,
    file: Express.Multer.File,
    additionalData?: {
      name?: string;
      folderId?: string;
      description?: string;
    },
  ): Promise<DataRoomDocumentResponseDto> {
    // Verify ownership
    const dataRoom = await this.prisma.dataRoom.findFirst({
      where: {
        id: dataRoomId,
        userId,
      },
    });

    if (!dataRoom) {
      throw new NotFoundException(`Data room with ID ${dataRoomId} not found`);
    }

    // Validate folder if provided
    if (additionalData?.folderId) {
      const folder = await this.prisma.dataRoomDocument.findFirst({
        where: {
          id: additionalData.folderId,
          dataRoomId,
        },
      });
      if (!folder) {
        throw new BadRequestException(`Folder with ID ${additionalData.folderId} not found`);
      }
    }

    const documentName = additionalData?.name || file.originalname;
    const fileSize = BigInt(file.size);

    // Create document record (IPFS CID/URL will be updated later when processing completes)
    const document = await this.prisma.dataRoomDocument.create({
      data: {
        dataRoomId,
        folderId: additionalData?.folderId || null,
        name: documentName,
        originalName: file.originalname,
        mimeType: file.mimetype || null,
        size: fileSize,
        storagePath: file.path, // Temp storage path
        description: additionalData?.description || null,
        metadata: null,
      },
    });

    // Update data room statistics
    await this.prisma.dataRoom.update({
      where: { id: dataRoomId },
      data: {
        documentCount: {
          increment: 1,
        },
        totalSize: {
          increment: fileSize,
        },
      },
    });

    this.logger.log(`Document uploaded to data room ${dataRoomId}: ${documentName}`);

    // TODO: Queue IPFS processing job if IPFS service is available
    // For now, document is stored with temp path

    return this.mapDocumentToResponseDto(document);
  }

  async deleteDocument(
    dataRoomId: string,
    documentId: string,
    userId: string,
  ): Promise<void> {
    // Verify ownership
    const dataRoom = await this.prisma.dataRoom.findFirst({
      where: {
        id: dataRoomId,
        userId,
      },
    });

    if (!dataRoom) {
      throw new NotFoundException(`Data room with ID ${dataRoomId} not found`);
    }

    const document = await this.prisma.dataRoomDocument.findFirst({
      where: {
        id: documentId,
        dataRoomId,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    const fileSize = document.size;

    // Delete document (cascade will handle child documents if it's a folder)
    await this.prisma.dataRoomDocument.delete({
      where: { id: documentId },
    });

    // Update data room statistics
    await this.prisma.dataRoom.update({
      where: { id: dataRoomId },
      data: {
        documentCount: {
          decrement: 1,
        },
        totalSize: {
          decrement: fileSize,
        },
      },
    });

    this.logger.log(`Document deleted from data room ${dataRoomId}: ${documentId}`);
  }

  private mapToResponseDto(dataRoom: any): DataRoomResponseDto {
    return {
      id: dataRoom.id,
      name: dataRoom.name,
      userId: dataRoom.userId,
      organizationId: dataRoom.organizationId,
      assetId: dataRoom.assetId,
      releaseId: dataRoom.releaseId,
      status: dataRoom.status,
      access: dataRoom.access,
      tier: dataRoom.tier,
      documentCount: dataRoom.documentCount,
      totalSize: dataRoom.totalSize ? dataRoom.totalSize.toString() : null,
      createdAt: dataRoom.createdAt,
      updatedAt: dataRoom.updatedAt,
    };
  }

  private mapToResponseWithDocumentsDto(dataRoom: any): DataRoomWithDocumentsResponseDto {
    return {
      ...this.mapToResponseDto(dataRoom),
      documents: dataRoom.documents.map((doc: any) => this.mapDocumentToResponseDto(doc)),
    };
  }

  private mapDocumentToResponseDto(document: any): DataRoomDocumentResponseDto {
    return {
      id: document.id,
      dataRoomId: document.dataRoomId,
      folderId: document.folderId,
      name: document.name,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size.toString(),
      ipfsCid: document.ipfsCid,
      ipfsUrl: document.ipfsUrl,
      storagePath: document.storagePath,
      description: document.description,
      metadata: document.metadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
