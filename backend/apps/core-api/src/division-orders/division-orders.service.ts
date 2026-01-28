import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  CreateDivisionOrderDto,
  UpdateDivisionOrderDto,
  CreateOwnershipTransferDto,
  ApproveTransferDto,
  RejectTransferDto,
  DivisionOrderCalculateRevenueSplitDto,
  DistributeRevenueDto,
  DivisionOrderDto,
  DivisionOrderOwnerDto,
  OwnershipTransferDto,
  DivisionOrderRevenueSplitDto,
  DivisionOrderStatus,
  OwnerType,
  TransferType,
  TransferStatus,
  RevenueType,
} from '@app/common';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DivisionOrdersService {
  private readonly logger = new Logger(DivisionOrdersService.name);
  private readonly REQUIRED_TOTAL = new Decimal('100.00000000'); // 100% with 8 decimals

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate that total decimal interest equals exactly 100.00000000%
   */
  private validateTotalDecimalInterest(total: Decimal): void {
    if (!total.equals(this.REQUIRED_TOTAL)) {
      throw new BadRequestException(
        `Total decimal interest must equal exactly 100.00000000%. Current total: ${total.toString()}%`,
      );
    }
  }

  /**
   * Calculate total decimal interest from owners
   */
  private calculateTotalDecimalInterest(
    owners: Array<{ decimalInterest: number | Decimal }>,
  ): Decimal {
    const total = owners.reduce((sum, owner) => {
      const interest = new Decimal(owner.decimalInterest);
      return sum.plus(interest);
    }, new Decimal(0));

    return total;
  }

  /**
   * Create a new division order
   */
  async createDivisionOrder(
    dto: CreateDivisionOrderDto,
    userId: string,
  ): Promise<DivisionOrderDto> {
    this.logger.log(`Creating division order for well ${dto.wellId}`);

    // Validate owners
    if (!dto.owners || dto.owners.length === 0) {
      throw new BadRequestException('At least one owner is required');
    }

    // Calculate and validate total decimal interest
    const totalDecimalInterest = this.calculateTotalDecimalInterest(
      dto.owners,
    );
    this.validateTotalDecimalInterest(totalDecimalInterest);

    // Verify organization exists and user has access
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.operatorOrgId },
    });

    if (!org) {
      throw new NotFoundException(
        `Organization ${dto.operatorOrgId} not found`,
      );
    }

    // Check if user is member of organization
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: dto.operatorOrgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a member of the operator organization to create division orders',
      );
    }

    // Create division order with owners
    const divisionOrder = await this.prisma.divisionOrder.create({
      data: {
        wellId: dto.wellId,
        wellName: dto.wellName,
        operatorOrgId: dto.operatorOrgId,
        productionStartDate: dto.productionStartDate
          ? new Date(dto.productionStartDate)
          : null,
        totalDecimalInterest: totalDecimalInterest,
        status: DivisionOrderStatus.PENDING,
        owners: {
          create: dto.owners.map((owner) => ({
            ownerType: owner.ownerType,
            userId: owner.userId,
            externalName: owner.externalName,
            externalEmail: owner.externalEmail,
            externalAddress: owner.externalAddress,
            decimalInterest: new Decimal(owner.decimalInterest),
            nri: owner.nri ? new Decimal(owner.nri) : null,
            wi: owner.wi ? new Decimal(owner.wi) : null,
            paymentAddress: owner.paymentAddress,
            paymentMethod: owner.paymentMethod,
          })),
        },
      },
      include: {
        owners: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        operatorOrg: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDivisionOrderDto(divisionOrder);
  }

  /**
   * Get division order by ID
   */
  async getDivisionOrderById(id: string): Promise<DivisionOrderDto> {
    const divisionOrder = await this.prisma.divisionOrder.findUnique({
      where: { id },
      include: {
        owners: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        operatorOrg: {
          select: {
            id: true,
            name: true,
          },
        },
        transfers: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!divisionOrder) {
      throw new NotFoundException(`Division order ${id} not found`);
    }

    return this.mapToDivisionOrderDto(divisionOrder);
  }

  /**
   * List division orders with filters
   */
  async listDivisionOrders(
    operatorOrgId?: string,
    status?: DivisionOrderStatus,
    wellId?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (operatorOrgId) where.operatorOrgId = operatorOrgId;
    if (status) where.status = status;
    if (wellId) where.wellId = wellId;

    const [divisionOrders, total] = await Promise.all([
      this.prisma.divisionOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owners: {
            where: { isActive: true },
          },
          operatorOrg: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.divisionOrder.count({ where }),
    ]);

    return {
      data: divisionOrders.map((divisionOrder) => this.mapToDivisionOrderDto(divisionOrder)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update division order
   */
  async updateDivisionOrder(
    id: string,
    dto: UpdateDivisionOrderDto,
    userId: string,
  ): Promise<DivisionOrderDto> {
    const divisionOrder = await this.prisma.divisionOrder.findUnique({
      where: { id },
    });

    if (!divisionOrder) {
      throw new NotFoundException(`Division order ${id} not found`);
    }

    // Check permissions
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: divisionOrder.operatorOrgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a member of the operator organization to update division orders',
      );
    }

    const updated = await this.prisma.divisionOrder.update({
      where: { id },
      data: {
        wellName: dto.wellName,
        productionStartDate: dto.productionStartDate
          ? new Date(dto.productionStartDate)
          : undefined,
        status: dto.status,
        notes: dto.notes,
      },
      include: {
        owners: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        operatorOrg: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDivisionOrderDto(updated);
  }

  /**
   * Create ownership transfer
   */
  async createOwnershipTransfer(
    divisionOrderId: string,
    dto: CreateOwnershipTransferDto,
    userId: string,
  ): Promise<OwnershipTransferDto> {
    this.logger.log(
      `Creating ownership transfer for division order ${divisionOrderId}`,
    );

    const divisionOrder = await this.prisma.divisionOrder.findUnique({
      where: { id: divisionOrderId },
      include: {
        owners: {
          where: { isActive: true },
        },
      },
    });

    if (!divisionOrder) {
      throw new NotFoundException(
        `Division order ${divisionOrderId} not found`,
      );
    }

    // Find from owner
    const fromOwner = divisionOrder.owners.find(
      (o) => o.id === dto.fromOwnerId,
    );

    if (!fromOwner) {
      throw new NotFoundException(`Owner ${dto.fromOwnerId} not found`);
    }

    // Validate interest amount
    const interestAmount = new Decimal(dto.interestAmount);
    const fromOwnerInterest = new Decimal(fromOwner.decimalInterest);

    if (interestAmount.greaterThan(fromOwnerInterest)) {
      throw new BadRequestException(
        `Transfer amount (${interestAmount}) exceeds owner's interest (${fromOwnerInterest})`,
      );
    }

    // Check permissions
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: divisionOrder.operatorOrgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a member of the operator organization to create transfers',
      );
    }

    // Create transfer record
    const transfer = await this.prisma.divisionOrderTransfer.create({
      data: {
        divisionOrderId,
        fromOwnerId: dto.fromOwnerId,
        toOwnerId: dto.toOwnerId,
        toExternalName: dto.toExternalName,
        interestAmount,
        transferType: dto.transferType,
        transactionId: dto.transactionId,
        assignmentDocId: dto.assignmentDocId,
        status: TransferStatus.PENDING,
        notes: dto.notes,
      },
    });

    return this.mapToTransferDto(transfer);
  }

  /**
   * Approve ownership transfer
   */
  async approveTransfer(
    divisionOrderId: string,
    transferId: string,
    dto: ApproveTransferDto,
    userId: string,
  ): Promise<OwnershipTransferDto> {
    const transfer = await this.prisma.divisionOrderTransfer.findUnique({
      where: { id: transferId },
      include: {
        divisionOrder: true,
      },
    });

    if (!transfer || transfer.divisionOrderId !== divisionOrderId) {
      throw new NotFoundException(`Transfer ${transferId} not found`);
    }

    // Check if user has analyst role (for now, check if user is org member)
    // TODO: Add proper analyst role check
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: transfer.divisionOrder.operatorOrgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a member of the operator organization to approve transfers',
      );
    }

    // Update transfer
    const updatedTransfer = await this.prisma.divisionOrderTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.APPROVED,
        approvedAt: new Date(),
        courthouseFiledAt: dto.courthouseFiledAt
          ? new Date(dto.courthouseFiledAt)
          : null,
        courthouseFileNumber: dto.courthouseFileNumber,
        notes: dto.notes,
      },
    });

    // Update division order ownership
    await this.updateOwnershipAfterTransfer(transfer);

    return this.mapToTransferDto(updatedTransfer);
  }

  /**
   * Reject ownership transfer
   */
  async rejectTransfer(
    divisionOrderId: string,
    transferId: string,
    dto: RejectTransferDto,
    userId: string,
  ): Promise<OwnershipTransferDto> {
    const transfer = await this.prisma.divisionOrderTransfer.findUnique({
      where: { id: transferId },
    });

    if (!transfer || transfer.divisionOrderId !== divisionOrderId) {
      throw new NotFoundException(`Transfer ${transferId} not found`);
    }

    // Check permissions
    const divisionOrder = await this.prisma.divisionOrder.findUnique({
      where: { id: divisionOrderId },
    });

    if (!divisionOrder) {
      throw new NotFoundException('Division order not found');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: divisionOrder.operatorOrgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a member of the operator organization to reject transfers',
      );
    }

    const updatedTransfer = await this.prisma.divisionOrderTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.REJECTED,
        rejectedReason: dto.rejectedReason,
      },
    });

    return this.mapToTransferDto(updatedTransfer);
  }

  /**
   * Update ownership after transfer approval
   */
  private async updateOwnershipAfterTransfer(
    transfer: any,
  ): Promise<void> {
    const divisionOrder = await this.prisma.divisionOrder.findUnique({
      where: { id: transfer.divisionOrderId },
      include: {
        owners: {
          where: { isActive: true },
        },
      },
    });

    if (!divisionOrder) {
      throw new NotFoundException('Division order not found');
    }

    // Reduce from owner's interest
    const fromOwner = divisionOrder.owners.find(
      (o) => o.id === transfer.fromOwnerId,
    );

    if (fromOwner) {
      const newInterest = new Decimal(fromOwner.decimalInterest).minus(
        transfer.interestAmount,
      );

      await this.prisma.divisionOrderOwner.update({
        where: { id: transfer.fromOwnerId },
        data: {
          decimalInterest: newInterest,
        },
      });
    }

    // Add to owner (existing or new)
    if (transfer.toOwnerId) {
      // Existing owner
      const toOwner = divisionOrder.owners.find(
        (o) => o.id === transfer.toOwnerId,
      );

      if (toOwner) {
        const newInterest = new Decimal(toOwner.decimalInterest).plus(
          transfer.interestAmount,
        );

        await this.prisma.divisionOrderOwner.update({
          where: { id: transfer.toOwnerId },
          data: {
            decimalInterest: newInterest,
          },
        });
      } else {
        // Create new owner entry
        await this.prisma.divisionOrderOwner.create({
          data: {
            divisionOrderId: transfer.divisionOrderId,
            userId: transfer.toOwnerId,
            ownerType: OwnerType.WORKING_INTEREST, // Default, should be configurable
            decimalInterest: transfer.interestAmount,
          },
        });
      }
    } else if (transfer.toExternalName) {
      // New external owner
      await this.prisma.divisionOrderOwner.create({
        data: {
          divisionOrderId: transfer.divisionOrderId,
          externalName: transfer.toExternalName,
          ownerType: OwnerType.WORKING_INTEREST, // Default
          decimalInterest: transfer.interestAmount,
        },
      });
    }

    // Recalculate and validate total
    const updatedOwners = await this.prisma.divisionOrderOwner.findMany({
      where: {
        divisionOrderId: transfer.divisionOrderId,
        isActive: true,
      },
    });

    const total = this.calculateTotalDecimalInterest(updatedOwners);
    this.validateTotalDecimalInterest(total);

    // Update division order total
    await this.prisma.divisionOrder.update({
      where: { id: transfer.divisionOrderId },
      data: {
        totalDecimalInterest: total,
        status: DivisionOrderStatus.UNDER_REVIEW, // Needs re-approval
      },
    });
  }

  /**
   * Calculate revenue split for division order
   */
  async calculateRevenueSplit(
    divisionOrderId: string,
    dto: DivisionOrderCalculateRevenueSplitDto,
  ): Promise<DivisionOrderRevenueSplitDto> {
    const divisionOrder = await this.prisma.divisionOrder.findUnique({
      where: { id: divisionOrderId },
      include: {
        owners: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!divisionOrder) {
      throw new NotFoundException(
        `Division order ${divisionOrderId} not found`,
      );
    }

    if (divisionOrder.status !== DivisionOrderStatus.ACTIVE) {
      throw new BadRequestException(
        'Division order must be active to calculate revenue split',
      );
    }

    const ownerPayments = divisionOrder.owners.map((owner) => {
      const decimalInterest = new Decimal(owner.decimalInterest);
      const paymentAmount = new Decimal(dto.totalRevenue)
        .times(decimalInterest)
        .dividedBy(100);

      return {
        ownerId: owner.id,
        ownerName:
          owner.externalName ||
          `${owner.user?.firstName || ''} ${owner.user?.lastName || ''}`.trim() ||
          'Unknown',
        decimalInterest: decimalInterest.toNumber(),
        paymentAmount: paymentAmount.toNumber(),
      };
    });

    const totalDistributed = ownerPayments.reduce(
      (sum, payment) => sum + payment.paymentAmount,
      0,
    );

    return {
      totalRevenue: dto.totalRevenue,
      revenueType: dto.revenueType,
      ownerPayments,
      totalDistributed,
    };
  }

  /**
   * Approve division order (by analyst)
   */
  async approveDivisionOrder(
    id: string,
    userId: string,
  ): Promise<DivisionOrderDto> {
    const divisionOrder = await this.prisma.divisionOrder.findUnique({
      where: { id },
    });

    if (!divisionOrder) {
      throw new NotFoundException(`Division order ${id} not found`);
    }

    // Check permissions (analyst role)
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: divisionOrder.operatorOrgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a member of the operator organization to approve division orders',
      );
    }

    // Validate total
    const owners = await this.prisma.divisionOrderOwner.findMany({
      where: {
        divisionOrderId: id,
        isActive: true,
      },
    });

    const total = this.calculateTotalDecimalInterest(owners);
    this.validateTotalDecimalInterest(total);

    const updated = await this.prisma.divisionOrder.update({
      where: { id },
      data: {
        status: DivisionOrderStatus.ACTIVE,
        approvedAt: new Date(),
        approvedBy: userId,
      },
      include: {
        owners: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        operatorOrg: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDivisionOrderDto(updated);
  }

  /**
   * Reject division order
   */
  async rejectDivisionOrder(
    id: string,
    rejectedReason: string,
    userId: string,
  ): Promise<DivisionOrderDto> {
    const divisionOrder = await this.prisma.divisionOrder.findUnique({
      where: { id },
    });

    if (!divisionOrder) {
      throw new NotFoundException(`Division order ${id} not found`);
    }

    // Check permissions
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: divisionOrder.operatorOrgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a member of the operator organization to reject division orders',
      );
    }

    const updated = await this.prisma.divisionOrder.update({
      where: { id },
      data: {
        status: DivisionOrderStatus.REJECTED,
        rejectedReason,
      },
      include: {
        owners: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        operatorOrg: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDivisionOrderDto(updated);
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDivisionOrderDto(divisionOrder: any): DivisionOrderDto {
    return {
      id: divisionOrder.id,
      wellId: divisionOrder.wellId,
      wellName: divisionOrder.wellName,
      operatorOrgId: divisionOrder.operatorOrgId,
      operatorOrgName: divisionOrder.operatorOrg?.name,
      status: divisionOrder.status as DivisionOrderStatus,
      productionStartDate: divisionOrder.productionStartDate?.toISOString(),
      totalDecimalInterest: divisionOrder.totalDecimalInterest.toNumber(),
      notes: divisionOrder.notes,
      createdAt: divisionOrder.createdAt.toISOString(),
      updatedAt: divisionOrder.updatedAt.toISOString(),
      approvedAt: divisionOrder.approvedAt?.toISOString(),
      approvedBy: divisionOrder.approvedBy,
      owners: divisionOrder.owners.map((owner: any) =>
        this.mapToOwnerDto(owner),
      ),
    };
  }

  /**
   * Map owner to DTO
   */
  private mapToOwnerDto(owner: any): DivisionOrderOwnerDto {
    return {
      id: owner.id,
      ownerType: owner.ownerType as OwnerType,
      userId: owner.userId,
      externalName: owner.externalName,
      externalEmail: owner.externalEmail,
      decimalInterest: owner.decimalInterest.toNumber(),
      nri: owner.nri?.toNumber(),
      wi: owner.wi?.toNumber(),
      paymentAddress: owner.paymentAddress,
      isActive: owner.isActive,
      createdAt: owner.createdAt.toISOString(),
      updatedAt: owner.updatedAt.toISOString(),
    };
  }

  /**
   * Map transfer to DTO
   */
  private mapToTransferDto(transfer: any): OwnershipTransferDto {
    return {
      id: transfer.id,
      divisionOrderId: transfer.divisionOrderId,
      fromOwnerId: transfer.fromOwnerId,
      toOwnerId: transfer.toOwnerId,
      toExternalName: transfer.toExternalName,
      interestAmount: transfer.interestAmount.toNumber(),
      transferType: transfer.transferType as TransferType,
      transactionId: transfer.transactionId,
      status: transfer.status as TransferStatus,
      submittedAt: transfer.submittedAt?.toISOString(),
      approvedAt: transfer.approvedAt?.toISOString(),
      courthouseFiledAt: transfer.courthouseFiledAt?.toISOString(),
      notes: transfer.notes,
      createdAt: transfer.createdAt.toISOString(),
    };
  }
}
