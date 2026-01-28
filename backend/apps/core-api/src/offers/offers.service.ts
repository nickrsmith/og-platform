import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@app/database';
import {
  CreateOfferDto,
  UpdateOfferDto,
  OfferDto,
  FindOffersQueryDto,
  AcceptOfferDto,
  DeclineOfferDto,
  CounterOfferDto,
  OfferStatus,
  OfferType,
  ReleaseDto,
  type RequestWithUser,
} from '@app/common';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);
  private readonly indexerApiUrl: string | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.indexerApiUrl = this.configService.get<string>('INDEXER_API_URL') || null;
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Asset verification will be disabled.');
    }
  }

  /**
   * Create a new offer on an asset
   */
  async createOffer(
    buyerId: string,
    dto: CreateOfferDto,
  ): Promise<OfferDto> {
    this.logger.log(
      `Creating offer by buyer ${buyerId} on asset ${dto.assetId}`,
    );

    // Verify asset exists
    const asset = await this.verifyAssetExists(dto.assetId);

    // Get seller ID from asset
    const sellerId = asset.postedBy;

    // Prevent self-offers
    if (buyerId === sellerId) {
      throw new BadRequestException('Cannot create an offer on your own asset');
    }

    // Check for existing active offers from this buyer on this asset
    const existingOffer = await this.prisma.offer.findFirst({
      where: {
        assetId: dto.assetId,
        buyerId: buyerId,
        status: {
          in: [OfferStatus.PENDING, OfferStatus.UNDER_REVIEW],
        },
      },
    });

    if (existingOffer) {
      throw new BadRequestException(
        'You already have a pending offer on this asset',
      );
    }

    // Validate expiration date if provided
    if (dto.expiresAt) {
      const expiresAtDate = new Date(dto.expiresAt);
      if (expiresAtDate <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    // Create the offer
    const offer = await this.prisma.offer.create({
      data: {
        assetId: dto.assetId,
        buyerId: buyerId,
        sellerId: sellerId,
        amount: new Decimal(dto.amount),
        earnestMoney: dto.earnestMoney
          ? new Decimal(dto.earnestMoney)
          : null,
        ddPeriod: dto.ddPeriod ?? null,
        closingDate: dto.closingDate ? new Date(dto.closingDate) : null,
        offerType: dto.offerType,
        status: OfferStatus.PENDING,
        contingencies: dto.contingencies ? (dto.contingencies as unknown as Prisma.InputJsonValue) : undefined,
        terms: dto.terms ? (dto.terms as unknown as Prisma.InputJsonValue) : undefined,
        notes: dto.notes ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Created offer ${offer.id} on asset ${dto.assetId}`);

    return this.mapToOfferDto(offer);
  }

  /**
   * Find offers with filters and pagination
   */
  async findOffers(
    userId: string,
    query: FindOffersQueryDto,
  ): Promise<{ offers: OfferDto[]; total: number; page: number; pageSize: number }> {
    this.logger.log(`Finding offers with filters for user ${userId}`);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDirection = query.sortDirection ?? 'desc';
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (query.assetId) {
      where.assetId = query.assetId;
    }

    if (query.buyerId) {
      where.buyerId = query.buyerId;
    }

    if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.offerType) {
      where.offerType = query.offerType;
    }

    // Security: Users can only see offers where they are buyer or seller
    // Unless they are filtering by specific buyerId or sellerId (admin function)
    // For now, we'll enforce that users can only see their own offers
    // This can be enhanced with role-based access later
    if (!query.buyerId && !query.sellerId) {
      where.OR = [
        { buyerId: userId },
        { sellerId: userId },
      ];
    }

    // Check for expired offers and update their status
    await this.checkAndExpireOffers();

    // Get total count
    const total = await this.prisma.offer.count({ where });

    // Get offers
    const offers = await this.prisma.offer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        [sortBy]: sortDirection,
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      offers: offers.map((offer) => this.mapToOfferDto(offer)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Find a single offer by ID
   */
  async findOneOffer(offerId: string, userId: string): Promise<OfferDto> {
    this.logger.log(`Finding offer ${offerId} for user ${userId}`);

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        parentOffer: true,
        counterOffers: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // Check authorization: only buyer or seller can view
    if (offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException('You do not have permission to view this offer');
    }

    return this.mapToOfferDto(offer);
  }

  /**
   * Update an offer (only buyer can update, only if pending)
   */
  async updateOffer(
    offerId: string,
    buyerId: string,
    dto: UpdateOfferDto,
  ): Promise<OfferDto> {
    this.logger.log(`Updating offer ${offerId} by buyer ${buyerId}`);

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // Check authorization: only buyer can update
    if (offer.buyerId !== buyerId) {
      throw new ForbiddenException(
        'You can only update your own offers',
      );
    }

    // Only pending offers can be updated
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update offer with status ${offer.status}. Only pending offers can be updated.`,
      );
    }

    // Validate expiration date if provided
    if (dto.expiresAt) {
      const expiresAtDate = new Date(dto.expiresAt);
      if (expiresAtDate <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    // Update the offer
    const updatedOffer = await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        ...(dto.amount && { amount: new Decimal(dto.amount) }),
        ...(dto.earnestMoney !== undefined
          ? { earnestMoney: dto.earnestMoney ? new Decimal(dto.earnestMoney) : null }
          : {}),
        ...(dto.ddPeriod !== undefined && { ddPeriod: dto.ddPeriod }),
        ...(dto.closingDate !== undefined
          ? { closingDate: dto.closingDate ? new Date(dto.closingDate) : null }
          : {}),
        ...(dto.offerType && { offerType: dto.offerType }),
        ...(dto.contingencies !== undefined && { contingencies: dto.contingencies ? (dto.contingencies as unknown as Prisma.InputJsonValue) : undefined }),
        ...(dto.terms !== undefined && { terms: dto.terms ? (dto.terms as unknown as Prisma.InputJsonValue) : undefined }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Updated offer ${offerId}`);

    return this.mapToOfferDto(updatedOffer);
  }

  /**
   * Accept an offer (only seller can accept)
   */
  async acceptOffer(
    offerId: string,
    sellerId: string,
    dto: AcceptOfferDto,
  ): Promise<OfferDto> {
    this.logger.log(`Accepting offer ${offerId} by seller ${sellerId}`);

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // Check authorization: only seller can accept
    if (offer.sellerId !== sellerId) {
      throw new ForbiddenException('Only the seller can accept an offer');
    }

    // Only pending or under_review offers can be accepted
    if (
      offer.status !== OfferStatus.PENDING &&
      offer.status !== OfferStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        `Cannot accept offer with status ${offer.status}`,
      );
    }

    // Check if offer is expired
    if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) {
      throw new BadRequestException('This offer has expired');
    }

    // Update offer status to ACCEPTED
    // In a transaction, we could also update other pending offers on the same asset to DECLINED
    const updatedOffer = await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.ACCEPTED,
        ...(dto.notes && { notes: dto.notes }),
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Optionally: Decline other pending offers on the same asset
    // This could be done in a transaction for atomicity
    await this.prisma.offer.updateMany({
      where: {
        assetId: offer.assetId,
        id: { not: offerId },
        status: { in: [OfferStatus.PENDING, OfferStatus.UNDER_REVIEW] },
      },
      data: {
        status: OfferStatus.DECLINED,
      },
    });

    this.logger.log(`Accepted offer ${offerId}`);

    // Send notification to buyer (non-blocking)
    this.notificationsService
      .sendNotification({
        userId: updatedOffer.buyerId,
        type: NotificationType.OFFER_ACCEPTED,
        offerId: updatedOffer.id,
        metadata: {
          offerId: updatedOffer.id,
          assetId: updatedOffer.assetId,
          amount: Number(updatedOffer.amount),
        },
      })
      .catch((err) =>
        this.logger.error('Failed to send offer accepted notification', err),
      );

    return this.mapToOfferDto(updatedOffer);
  }

  /**
   * Decline an offer (only seller can decline)
   */
  async declineOffer(
    offerId: string,
    sellerId: string,
    dto: DeclineOfferDto,
  ): Promise<OfferDto> {
    this.logger.log(`Declining offer ${offerId} by seller ${sellerId}`);

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // Check authorization: only seller can decline
    if (offer.sellerId !== sellerId) {
      throw new ForbiddenException('Only the seller can decline an offer');
    }

    // Only pending or under_review offers can be declined
    if (
      offer.status !== OfferStatus.PENDING &&
      offer.status !== OfferStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        `Cannot decline offer with status ${offer.status}`,
      );
    }

    const updatedOffer = await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.DECLINED,
        ...(dto.reason && { notes: dto.reason }),
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Declined offer ${offerId}`);

    return this.mapToOfferDto(updatedOffer);
  }

  /**
   * Withdraw an offer (only buyer can withdraw)
   */
  async withdrawOffer(offerId: string, buyerId: string): Promise<OfferDto> {
    this.logger.log(`Withdrawing offer ${offerId} by buyer ${buyerId}`);

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // Check authorization: only buyer can withdraw
    if (offer.buyerId !== buyerId) {
      throw new ForbiddenException('Only the buyer can withdraw an offer');
    }

    // Cannot withdraw accepted or declined offers
    if (
      offer.status === OfferStatus.ACCEPTED ||
      offer.status === OfferStatus.DECLINED
    ) {
      throw new BadRequestException(
        `Cannot withdraw offer with status ${offer.status}`,
      );
    }

    const updatedOffer = await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.WITHDRAWN,
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Withdrawn offer ${offerId}`);

    return this.mapToOfferDto(updatedOffer);
  }

  /**
   * Create a counter-offer (seller creates a new offer linked to parent)
   */
  async createCounterOffer(
    parentOfferId: string,
    sellerId: string,
    dto: CounterOfferDto,
  ): Promise<OfferDto> {
    this.logger.log(
      `Creating counter-offer for parent offer ${parentOfferId} by seller ${sellerId}`,
    );

    const parentOffer = await this.prisma.offer.findUnique({
      where: { id: parentOfferId },
    });

    if (!parentOffer) {
      throw new NotFoundException(
        `Parent offer with ID ${parentOfferId} not found`,
      );
    }

    // Check authorization: only seller can create counter-offer
    if (parentOffer.sellerId !== sellerId) {
      throw new ForbiddenException(
        'Only the seller can create a counter-offer',
      );
    }

    // Only pending or under_review offers can have counter-offers
    if (
      parentOffer.status !== OfferStatus.PENDING &&
      parentOffer.status !== OfferStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        `Cannot create counter-offer for offer with status ${parentOffer.status}`,
      );
    }

    // Verify asset exists (use same asset as parent)
    await this.verifyAssetExists(parentOffer.assetId);

    // Validate expiration date if provided
    if (dto.expiresAt) {
      const expiresAtDate = new Date(dto.expiresAt);
      if (expiresAtDate <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    // Update parent offer status to COUNTERED
    await this.prisma.offer.update({
      where: { id: parentOfferId },
      data: { status: OfferStatus.COUNTERED },
    });

    // Create counter-offer (same buyer/seller relationship, different terms)
    const counterOffer = await this.prisma.offer.create({
      data: {
        assetId: parentOffer.assetId,
        buyerId: parentOffer.buyerId, // Same buyer
        sellerId: sellerId, // Same seller
        amount: new Decimal(dto.amount),
        earnestMoney: dto.earnestMoney
          ? new Decimal(dto.earnestMoney)
          : null,
        ddPeriod: dto.ddPeriod ?? null,
        closingDate: dto.closingDate ? new Date(dto.closingDate) : null,
        offerType: dto.offerType,
        status: OfferStatus.PENDING,
        contingencies: dto.contingencies ? (dto.contingencies as unknown as Prisma.InputJsonValue) : undefined,
        terms: dto.terms ? (dto.terms as unknown as Prisma.InputJsonValue) : undefined,
        notes: dto.notes ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        parentOfferId: parentOfferId,
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Created counter-offer ${counterOffer.id} for parent offer ${parentOfferId}`,
    );

    return this.mapToOfferDto(counterOffer);
  }

  /**
   * Verify that an asset exists by calling indexer-api
   */
  private async verifyAssetExists(assetId: string): Promise<ReleaseDto> {
    if (!this.indexerApiUrl) {
      throw new InternalServerErrorException(
        'Asset verification is not available. INDEXER_API_URL is not configured.',
      );
    }
    
    try {
      const url = `${this.indexerApiUrl}/releases/${assetId}`;
      const { data } = await firstValueFrom(
        this.httpService.get<ReleaseDto>(url),
      );
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new NotFoundException(`Asset with ID ${assetId} not found`);
      }
      this.logger.error(
        `Failed to verify asset ${assetId}`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException(
        'Failed to verify asset existence',
      );
    }
  }

  /**
   * Check for expired offers and update their status
   */
  private async checkAndExpireOffers(): Promise<void> {
    const expiredOffers = await this.prisma.offer.updateMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
        status: {
          in: [OfferStatus.PENDING, OfferStatus.UNDER_REVIEW],
        },
      },
      data: {
        status: OfferStatus.EXPIRED,
      },
    });

    if (expiredOffers.count > 0) {
      this.logger.log(`Expired ${expiredOffers.count} offers`);
    }
  }

  /**
   * Map Prisma offer model to OfferDto
   */
  private mapToOfferDto(offer: any): OfferDto {
    return {
      id: offer.id,
      assetId: offer.assetId,
      buyerId: offer.buyerId,
      sellerId: offer.sellerId,
      amount: offer.amount.toNumber(),
      earnestMoney: offer.earnestMoney?.toNumber(),
      ddPeriod: offer.ddPeriod,
      closingDate: offer.closingDate?.toISOString(),
      status: offer.status as OfferStatus,
      offerType: offer.offerType as OfferType,
      contingencies: offer.contingencies as Array<{
        type: string;
        description?: string;
        required: boolean;
      }>,
      terms: offer.terms as Record<string, any>,
      notes: offer.notes,
      parentOfferId: offer.parentOfferId,
      expiresAt: offer.expiresAt?.toISOString(),
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt?.toISOString(),
    };
  }
}

