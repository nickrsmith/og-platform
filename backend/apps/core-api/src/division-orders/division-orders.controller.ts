import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  Logger,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { DivisionOrdersService } from './division-orders.service';
import {
  CreateDivisionOrderDto,
  UpdateDivisionOrderDto,
  CreateOwnershipTransferDto,
  ApproveTransferDto,
  RejectTransferDto,
  DivisionOrderCalculateRevenueSplitDto,
  DivisionOrderDto,
  OwnershipTransferDto,
  DivisionOrderRevenueSplitDto,
  DivisionOrderStatus,
  JwtAuthGuard,
} from '@app/common';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('division-orders')
@ApiBearerAuth('JWT-auth')
@Controller('division-orders')
export class DivisionOrdersController {
  private readonly logger = new Logger(DivisionOrdersController.name);

  constructor(
    private readonly divisionOrdersService: DivisionOrdersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create division order',
    description: 'Creates a new division order for a well/lease with owners and their decimal interests.',
  })
  @ApiBody({ type: CreateDivisionOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Division order created',
    type: DivisionOrderDto,
  })
  async createDivisionOrder(
    @Body(validationPipe) dto: CreateDivisionOrderDto,
    @Request() req: any,
  ): Promise<DivisionOrderDto> {
    this.logger.log(`POST /division-orders`);
    return this.divisionOrdersService.createDivisionOrder(
      dto,
      req.user.userId,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'List division orders',
    description: 'Lists division orders with optional filters for organization, status, and well.',
  })
  @ApiQuery({ name: 'operatorOrgId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: DivisionOrderStatus })
  @ApiQuery({ name: 'wellId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'List of division orders',
  })
  async listDivisionOrders(
    @Query('operatorOrgId') operatorOrgId?: string,
    @Query('status') status?: DivisionOrderStatus,
    @Query('wellId') wellId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(`GET /division-orders`);
    return this.divisionOrdersService.listDivisionOrders(
      operatorOrgId,
      status,
      wellId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get division order by ID',
    description: 'Retrieves a division order with all owners and details.',
  })
  @ApiParam({ name: 'id', description: 'Division order ID' })
  @ApiResponse({
    status: 200,
    description: 'Division order',
    type: DivisionOrderDto,
  })
  @ApiResponse({ status: 404, description: 'Division order not found' })
  async getDivisionOrderById(
    @Param('id') id: string,
  ): Promise<DivisionOrderDto> {
    this.logger.log(`GET /division-orders/${id}`);
    return this.divisionOrdersService.getDivisionOrderById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update division order',
    description: 'Updates division order details. Status changes require appropriate permissions.',
  })
  @ApiParam({ name: 'id', description: 'Division order ID' })
  @ApiBody({ type: UpdateDivisionOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Division order updated',
    type: DivisionOrderDto,
  })
  async updateDivisionOrder(
    @Param('id') id: string,
    @Body(validationPipe) dto: UpdateDivisionOrderDto,
    @Request() req: any,
  ): Promise<DivisionOrderDto> {
    this.logger.log(`PATCH /division-orders/${id}`);
    return this.divisionOrdersService.updateDivisionOrder(
      id,
      dto,
      req.user.userId,
    );
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Approve division order',
    description: 'Approves a division order (analyst only). Validates that total equals 100%.',
  })
  @ApiParam({ name: 'id', description: 'Division order ID' })
  @ApiResponse({
    status: 200,
    description: 'Division order approved',
    type: DivisionOrderDto,
  })
  async approveDivisionOrder(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<DivisionOrderDto> {
    this.logger.log(`POST /division-orders/${id}/approve`);
    return this.divisionOrdersService.approveDivisionOrder(
      id,
      req.user.userId,
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Reject division order',
    description: 'Rejects a division order with a reason (analyst only).',
  })
  @ApiParam({ name: 'id', description: 'Division order ID' })
  @ApiBody({ schema: { properties: { rejectedReason: { type: 'string' } } } })
  @ApiResponse({
    status: 200,
    description: 'Division order rejected',
    type: DivisionOrderDto,
  })
  async rejectDivisionOrder(
    @Param('id') id: string,
    @Body('rejectedReason') rejectedReason: string,
    @Request() req: any,
  ): Promise<DivisionOrderDto> {
    this.logger.log(`POST /division-orders/${id}/reject`);
    return this.divisionOrdersService.rejectDivisionOrder(
      id,
      rejectedReason,
      req.user.userId,
    );
  }

  @Post(':id/transfers')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create ownership transfer',
    description: 'Creates an ownership transfer for a division order. Updates ownership percentages after approval.',
  })
  @ApiParam({ name: 'id', description: 'Division order ID' })
  @ApiBody({ type: CreateOwnershipTransferDto })
  @ApiResponse({
    status: 201,
    description: 'Transfer created',
    type: OwnershipTransferDto,
  })
  async createOwnershipTransfer(
    @Param('id') divisionOrderId: string,
    @Body(validationPipe) dto: CreateOwnershipTransferDto,
    @Request() req: any,
  ): Promise<OwnershipTransferDto> {
    this.logger.log(`POST /division-orders/${divisionOrderId}/transfers`);
    return this.divisionOrdersService.createOwnershipTransfer(
      divisionOrderId,
      dto,
      req.user.userId,
    );
  }

  @Post(':id/transfers/:transferId/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Approve ownership transfer',
    description: 'Approves an ownership transfer and updates division order ownership percentages.',
  })
  @ApiParam({ name: 'id', description: 'Division order ID' })
  @ApiParam({ name: 'transferId', description: 'Transfer ID' })
  @ApiBody({ type: ApproveTransferDto })
  @ApiResponse({
    status: 200,
    description: 'Transfer approved',
    type: OwnershipTransferDto,
  })
  async approveTransfer(
    @Param('id') divisionOrderId: string,
    @Param('transferId') transferId: string,
    @Body(validationPipe) dto: ApproveTransferDto,
    @Request() req: any,
  ): Promise<OwnershipTransferDto> {
    this.logger.log(
      `POST /division-orders/${divisionOrderId}/transfers/${transferId}/approve`,
    );
    return this.divisionOrdersService.approveTransfer(
      divisionOrderId,
      transferId,
      dto,
      req.user.userId,
    );
  }

  @Post(':id/transfers/:transferId/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Reject ownership transfer',
    description: 'Rejects an ownership transfer with a reason.',
  })
  @ApiParam({ name: 'id', description: 'Division order ID' })
  @ApiParam({ name: 'transferId', description: 'Transfer ID' })
  @ApiBody({ type: RejectTransferDto })
  @ApiResponse({
    status: 200,
    description: 'Transfer rejected',
    type: OwnershipTransferDto,
  })
  async rejectTransfer(
    @Param('id') divisionOrderId: string,
    @Param('transferId') transferId: string,
    @Body(validationPipe) dto: RejectTransferDto,
    @Request() req: any,
  ): Promise<OwnershipTransferDto> {
    this.logger.log(
      `POST /division-orders/${divisionOrderId}/transfers/${transferId}/reject`,
    );
    return this.divisionOrdersService.rejectTransfer(
      divisionOrderId,
      transferId,
      dto,
      req.user.userId,
    );
  }

  @Post(':id/calculate-revenue')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Calculate revenue split',
    description: 'Calculates revenue distribution for each owner based on their decimal interest.',
  })
  @ApiParam({ name: 'id', description: 'Division order ID' })
  @ApiBody({ type: DivisionOrderCalculateRevenueSplitDto })
  @ApiResponse({
    status: 200,
    description: 'Revenue split calculated',
    type: DivisionOrderRevenueSplitDto,
  })
  async calculateRevenueSplit(
    @Param('id') id: string,
    @Body(validationPipe) dto: DivisionOrderCalculateRevenueSplitDto,
  ): Promise<DivisionOrderRevenueSplitDto> {
    this.logger.log(`POST /division-orders/${id}/calculate-revenue`);
    return this.divisionOrdersService.calculateRevenueSplit(id, dto);
  }
}
