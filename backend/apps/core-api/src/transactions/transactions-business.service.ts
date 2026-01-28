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
  CreateTransactionDto,
  TransactionDto,
  TransactionStatus,
  UpdateTransactionStatusDto,
  DepositEarnestDto,
  CompleteDueDiligenceDto,
  FundTransactionDto,
  CloseTransactionDto,
  FindTransactionsQueryDto,
  SettlementStatementDto,
  ReleaseDto,
  AssetCategory,
} from '@app/common';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { SettlementService } from '../settlement/settlement.service';
import { RevenueService } from '../revenue/revenue.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';

@Injectable()
export class TransactionsBusinessService {
  private readonly logger = new Logger(TransactionsBusinessService.name);
  private readonly indexerApiUrl: string | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly settlementService: SettlementService,
    private readonly revenueService: RevenueService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.indexerApiUrl = this.configService.get<string>('INDEXER_API_URL') || null;
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Asset info operations will be disabled.');
    }
  }

  /**
   * Create a transaction from an accepted offer
   */
  async createTransaction(
    dto: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionDto> {
    this.logger.log(
      `Creating transaction from offer ${dto.offerId} by user ${userId}`,
    );

    // Verify offer exists and is accepted
    const offer = await this.prisma.offer.findUnique({
      where: { id: dto.offerId },
      include: {
        buyer: true,
        seller: true,
      },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${dto.offerId} not found`);
    }

    // Only buyer or seller can create transaction from accepted offer
    if (offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException(
        'Only the buyer or seller can create a transaction from this offer',
      );
    }

    if (offer.status !== 'ACCEPTED') {
      throw new BadRequestException(
        `Cannot create transaction from offer with status ${offer.status}. Offer must be ACCEPTED.`,
      );
    }

    // Check if transaction already exists for this offer
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { offerId: dto.offerId },
    });

    if (existingTransaction) {
      throw new BadRequestException(
        'A transaction already exists for this offer',
      );
    }

    // Get asset information to determine category and organization
    const asset = await this.getAssetInfo(offer.assetId);

    // Create transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        offerId: dto.offerId,
        assetId: offer.assetId,
        buyerId: offer.buyerId,
        sellerId: offer.sellerId,
        purchasePrice: offer.amount,
        earnestAmount: offer.earnestMoney,
        ddPeriod: offer.ddPeriod,
        closingDate: offer.closingDate,
        status: TransactionStatus.PENDING,
        contingencies: offer.contingencies as Prisma.InputJsonValue | undefined,
        terms: offer.terms as Prisma.InputJsonValue | undefined,
        notes: dto.notes || null,
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
        offer: true,
      },
    });

    // Calculate initial settlement (will be updated as transaction progresses)
    await this.updateSettlementCalculation(transaction.id, asset);

    // Send notifications (non-blocking)
    this.sendTransactionNotifications(transaction, 'created').catch((err) =>
      this.logger.error('Failed to send transaction created notifications', err),
    );

    return this.mapToTransactionDto(transaction);
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(
    transactionId: string,
    userId: string,
  ): Promise<TransactionDto> {
    this.logger.log(`Getting transaction ${transactionId} for user ${userId}`);

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
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
        offer: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    // Only buyer or seller can view transaction
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this transaction',
      );
    }

    return this.mapToTransactionDto(transaction);
  }

  /**
   * Find transactions with filters
   */
  async findTransactions(
    query: FindTransactionsQueryDto,
    userId: string,
  ): Promise<{ transactions: TransactionDto[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 20, buyerId, sellerId, assetId, status } = query;
    const skip = (page - 1) * pageSize;

    // Build where clause - user can only see their own transactions
    const where: any = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    };

    if (buyerId) {
      where.buyerId = buyerId;
    }
    if (sellerId) {
      where.sellerId = sellerId;
    }
    if (assetId) {
      where.assetId = assetId;
    }
    if (status) {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
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
          offer: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((t) => this.mapToTransactionDto(t)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    dto: UpdateTransactionStatusDto,
    userId: string,
  ): Promise<TransactionDto> {
    this.logger.log(
      `Updating transaction ${transactionId} status to ${dto.status}`,
    );

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    // Only buyer or seller can update transaction
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this transaction',
      );
    }

    // Validate status transition
    this.validateStatusTransition(transaction.status as TransactionStatus, dto.status);

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: dto.status,
        notes: dto.notes || transaction.notes,
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
        offer: true,
      },
    });

    return this.mapToTransactionDto(updated);
  }

  /**
   * Record earnest money deposit
   */
  async depositEarnest(
    transactionId: string,
    dto: DepositEarnestDto,
    userId: string,
  ): Promise<TransactionDto> {
    this.logger.log(
      `Recording earnest money deposit for transaction ${transactionId}`,
    );

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    // Only buyer can deposit earnest money
    if (transaction.buyerId !== userId) {
      throw new ForbiddenException(
        'Only the buyer can deposit earnest money',
      );
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        `Cannot deposit earnest money for transaction with status ${transaction.status}`,
      );
    }

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        earnestAmount: new Decimal(dto.amount),
        earnestDepositedAt: dto.depositedAt ? new Date(dto.depositedAt) : new Date(),
        status: TransactionStatus.EARNEST_DEPOSITED,
        notes: dto.notes || transaction.notes,
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
        offer: true,
      },
    });

    return this.mapToTransactionDto(updated);
  }

  /**
   * Complete due diligence
   */
  async completeDueDiligence(
    transactionId: string,
    dto: CompleteDueDiligenceDto,
    userId: string,
  ): Promise<TransactionDto> {
    this.logger.log(
      `Completing due diligence for transaction ${transactionId}`,
    );

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    // Only buyer or seller can mark DD complete
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this transaction',
      );
    }

    if (
      transaction.status !== TransactionStatus.EARNEST_DEPOSITED &&
      transaction.status !== TransactionStatus.DUE_DILIGENCE
    ) {
      throw new BadRequestException(
        `Cannot complete due diligence for transaction with status ${transaction.status}`,
      );
    }

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ddCompletedAt: dto.completedAt ? new Date(dto.completedAt) : new Date(),
        status: TransactionStatus.DUE_DILIGENCE,
        notes: dto.notes || transaction.notes,
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
        offer: true,
      },
    });

    // Send notification (non-blocking)
    this.sendTransactionNotifications(updated, 'due_diligence_complete').catch((err) =>
      this.logger.error('Failed to send DD complete notifications', err),
    );

    return this.mapToTransactionDto(updated);
  }

  /**
   * Record funding/payment
   */
  async fundTransaction(
    transactionId: string,
    dto: FundTransactionDto,
    userId: string,
  ): Promise<TransactionDto> {
    this.logger.log(`Recording funding for transaction ${transactionId}`);

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    // Only buyer can record funding
    if (transaction.buyerId !== userId) {
      throw new ForbiddenException('Only the buyer can record funding');
    }

    if (transaction.status !== TransactionStatus.DUE_DILIGENCE) {
      throw new BadRequestException(
        `Cannot fund transaction with status ${transaction.status}`,
      );
    }

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.FUNDING,
        onChainTxHash: dto.onChainTxHash || transaction.onChainTxHash,
        notes: dto.notes || transaction.notes,
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
        offer: true,
      },
    });

    // Send notification (non-blocking)
    this.sendTransactionNotifications(updated, 'funded').catch((err) =>
      this.logger.error('Failed to send transaction funded notifications', err),
    );

    return this.mapToTransactionDto(updated);
  }

  /**
   * Close transaction
   */
  async closeTransaction(
    transactionId: string,
    dto: CloseTransactionDto,
    userId: string,
  ): Promise<TransactionDto> {
    this.logger.log(`Closing transaction ${transactionId}`);

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    // Only buyer or seller can close transaction
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to close this transaction',
      );
    }

    if (transaction.status !== TransactionStatus.FUNDING) {
      throw new BadRequestException(
        `Cannot close transaction with status ${transaction.status}`,
      );
    }

    // Get asset info for final settlement calculation
    const asset = await this.getAssetInfo(transaction.assetId);

    // Recalculate settlement before closing
    await this.updateSettlementCalculation(transactionId, asset);

    // Generate settlement statement
    const settlementStatement = await this.generateSettlementStatement(
      transactionId,
      asset,
    );

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.CLOSED,
        closedAt: dto.closedAt ? new Date(dto.closedAt) : new Date(),
        onChainTxHash: dto.onChainTxHash || transaction.onChainTxHash,
        settlementStatement: settlementStatement as unknown as Prisma.InputJsonValue,
        notes: dto.notes || transaction.notes,
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
        offer: true,
      },
    });

    // Send notifications (non-blocking)
    this.sendTransactionNotifications(updated, 'closed').catch((err) =>
      this.logger.error('Failed to send transaction closed notifications', err),
    );
    this.sendTransactionNotifications(updated, 'settlement_statement').catch((err) =>
      this.logger.error('Failed to send settlement statement notifications', err),
    );

    return this.mapToTransactionDto(updated);
  }

  /**
   * Generate settlement statement
   */
  async generateSettlementStatement(
    transactionId: string,
    asset?: ReleaseDto,
  ): Promise<SettlementStatementDto> {
    this.logger.log(
      `Generating settlement statement for transaction ${transactionId}`,
    );

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: true,
        seller: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    if (!asset) {
      asset = await this.getAssetInfo(transaction.assetId);
    }

    // Get organization info
    const organization = await this.prisma.organization.findFirst({
      where: { siteAddress: asset.siteAddress },
      select: { contractAddress: true },
    });

    if (!organization || !organization.contractAddress) {
      throw new BadRequestException(
        'Organization contract address not found. Cannot calculate settlement.',
      );
    }

    // Calculate settlement
    const settlement = await this.settlementService.calculateSettlement({
      purchasePrice: Number(transaction.purchasePrice),
      category: asset.category as AssetCategory,
      orgContractAddress: organization.contractAddress,
      assetOwnerAddress: transaction.sellerId, // Seller is the asset owner
      earnestAmount: transaction.earnestAmount
        ? Number(transaction.earnestAmount)
        : undefined,
      prorations: transaction.prorations as Record<string, number> | undefined,
      adjustments: transaction.adjustments as Record<string, number> | undefined,
    });

    // Generate statement
    const statement = this.settlementService.generateSettlementStatement(
      transactionId,
      settlement,
      `${transaction.buyer.firstName} ${transaction.buyer.lastName}`,
      `${transaction.seller.firstName} ${transaction.seller.lastName}`,
      transaction.assetId,
      transaction.closingDate || new Date(),
    );

    // Update transaction with settlement statement
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        settlementStatement: statement,
        platformFee: new Decimal(settlement.platformFee),
        integratorFee: new Decimal(settlement.integratorFee),
        creatorAmount: new Decimal(settlement.creatorAmount),
        netProceeds: new Decimal(settlement.netProceeds),
      },
    });

    return statement as SettlementStatementDto;
  }

  /**
   * Get asset information from indexer API
   */
  private async getAssetInfo(assetId: string): Promise<ReleaseDto> {
    if (!this.indexerApiUrl) {
      throw new InternalServerErrorException(
        'Asset information is not available. INDEXER_API_URL is not configured.',
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
      this.logger.error(
        `Failed to fetch asset ${assetId} from indexer-api`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve asset information.',
      );
    }
  }

  /**
   * Update settlement calculation for a transaction
   */
  private async updateSettlementCalculation(
    transactionId: string,
    asset: ReleaseDto,
  ): Promise<void> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return;
    }

    // Get organization info
    const organization = await this.prisma.organization.findFirst({
      where: { siteAddress: asset.siteAddress },
      select: { contractAddress: true },
    });

    if (!organization || !organization.contractAddress) {
      this.logger.warn(
        `Cannot calculate settlement for transaction ${transactionId}: Organization contract address not found`,
      );
      return;
    }

    // Calculate settlement
    const settlement = await this.settlementService.calculateSettlement({
      purchasePrice: Number(transaction.purchasePrice),
      category: asset.category as AssetCategory,
      orgContractAddress: organization.contractAddress,
      assetOwnerAddress: transaction.sellerId,
      earnestAmount: transaction.earnestAmount
        ? Number(transaction.earnestAmount)
        : undefined,
      prorations: transaction.prorations as Record<string, number> | undefined,
      adjustments: transaction.adjustments as Record<string, number> | undefined,
    });

    // Update transaction with settlement amounts
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        platformFee: new Decimal(settlement.platformFee),
        integratorFee: new Decimal(settlement.integratorFee),
        creatorAmount: new Decimal(settlement.creatorAmount),
        netProceeds: new Decimal(settlement.netProceeds),
        prorations: settlement.prorations,
        adjustments: settlement.adjustments,
      },
    });
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus,
  ): void {
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.PENDING]: [
        TransactionStatus.EARNEST_DEPOSITED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.EARNEST_DEPOSITED]: [
        TransactionStatus.DUE_DILIGENCE,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.DUE_DILIGENCE]: [
        TransactionStatus.FUNDING,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.FUNDING]: [
        TransactionStatus.CLOSED,
        TransactionStatus.FAILED,
      ],
      [TransactionStatus.CLOSED]: [],
      [TransactionStatus.CANCELLED]: [],
      [TransactionStatus.FAILED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Map Prisma transaction to DTO
   */
  private mapToTransactionDto(transaction: any): TransactionDto {
    return {
      id: transaction.id,
      offerId: transaction.offerId,
      assetId: transaction.assetId,
      buyerId: transaction.buyerId,
      sellerId: transaction.sellerId,
      purchasePrice: Number(transaction.purchasePrice),
      earnestAmount: transaction.earnestAmount
        ? Number(transaction.earnestAmount)
        : undefined,
      earnestDepositedAt: transaction.earnestDepositedAt
        ? transaction.earnestDepositedAt.toISOString()
        : undefined,
      ddPeriod: transaction.ddPeriod || undefined,
      ddCompletedAt: transaction.ddCompletedAt
        ? transaction.ddCompletedAt.toISOString()
        : undefined,
      closingDate: transaction.closingDate
        ? transaction.closingDate.toISOString()
        : undefined,
      status: transaction.status as TransactionStatus,
      platformFee: transaction.platformFee
        ? Number(transaction.platformFee)
        : undefined,
      integratorFee: transaction.integratorFee
        ? Number(transaction.integratorFee)
        : undefined,
      creatorAmount: transaction.creatorAmount
        ? Number(transaction.creatorAmount)
        : undefined,
      prorations: transaction.prorations as Record<string, any> | undefined,
      adjustments: transaction.adjustments as Record<string, any> | undefined,
      netProceeds: transaction.netProceeds
        ? Number(transaction.netProceeds)
        : undefined,
      contingencies: transaction.contingencies as Record<string, any> | undefined,
      terms: transaction.terms as Record<string, any> | undefined,
      notes: transaction.notes || undefined,
      settlementStatement: transaction.settlementStatement as
        | Record<string, any>
        | undefined,
      onChainTxHash: transaction.onChainTxHash || undefined,
      escrowAddress: transaction.escrowAddress || undefined,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      closedAt: transaction.closedAt
        ? transaction.closedAt.toISOString()
        : undefined,
    };
  }

  /**
   * Send transaction notifications
   */
  private async sendTransactionNotifications(
    transaction: any,
    event: 'created' | 'earnest_deposited' | 'due_diligence_complete' | 'funded' | 'closed' | 'settlement_statement',
  ): Promise<void> {
    const purchasePrice = Number(transaction.purchasePrice);
    const earnestAmount = transaction.earnestAmount
      ? Number(transaction.earnestAmount)
      : undefined;
    const netProceeds = transaction.netProceeds
      ? Number(transaction.netProceeds)
      : undefined;

    const metadata = {
      transactionId: transaction.id,
      assetId: transaction.assetId,
      purchasePrice,
      earnestAmount,
      netProceeds,
    };

    let notificationType: NotificationType;
    switch (event) {
      case 'created':
        notificationType = NotificationType.TRANSACTION_CREATED;
        break;
      case 'earnest_deposited':
        notificationType = NotificationType.TRANSACTION_EARNEST_DEPOSITED;
        break;
      case 'due_diligence_complete':
        notificationType = NotificationType.TRANSACTION_DUE_DILIGENCE_COMPLETE;
        break;
      case 'funded':
        notificationType = NotificationType.TRANSACTION_FUNDED;
        break;
      case 'closed':
        notificationType = NotificationType.TRANSACTION_CLOSED;
        break;
      case 'settlement_statement':
        notificationType = NotificationType.SETTLEMENT_STATEMENT_READY;
        break;
    }

    // Send to buyer
    await this.notificationsService.sendNotification({
      userId: transaction.buyerId,
      type: notificationType,
      transactionId: transaction.id,
      metadata,
    });

    // Send to seller
    await this.notificationsService.sendNotification({
      userId: transaction.sellerId,
      type: notificationType,
      transactionId: transaction.id,
      metadata,
    });
  }
}

