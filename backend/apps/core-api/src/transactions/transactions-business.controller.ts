import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { TransactionsBusinessService } from './transactions-business.service';
import {
  CreateTransactionDto,
  TransactionDto,
  UpdateTransactionStatusDto,
  DepositEarnestDto,
  CompleteDueDiligenceDto,
  FundTransactionDto,
  CloseTransactionDto,
  FindTransactionsQueryDto,
  SettlementStatementDto,
  TransactionStatus,
  JwtAuthGuard,
  type RequestWithUser,
  IdempotencyGuard,
} from '@app/common';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
export class TransactionsBusinessController {
  private readonly logger = new Logger(TransactionsBusinessController.name);

  constructor(
    private readonly transactionsService: TransactionsBusinessService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create transaction from accepted offer',
    description:
      'Creates a new transaction from an accepted offer. Only buyer or seller can create a transaction from their accepted offer.',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or offer not accepted' })
  @ApiResponse({ status: 403, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiBody({ type: CreateTransactionDto })
  async createTransaction(
    @Body(validationPipe) dto: CreateTransactionDto,
    @Request() req: RequestWithUser,
  ): Promise<TransactionDto> {
    this.logger.log(`POST /transactions - Creating transaction from offer ${dto.offerId}`);
    return this.transactionsService.createTransaction(dto, req.user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transaction details',
    description:
      'Retrieves transaction details by ID. Only buyer or seller can view their transactions.',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction details',
    type: TransactionDto,
  })
  @ApiResponse({ status: 403, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<TransactionDto> {
    this.logger.log(`GET /transactions/${id}`);
    return this.transactionsService.getTransaction(id, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List transactions',
    description:
      'Lists transactions with optional filters. Users can only see their own transactions (as buyer or seller).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'buyerId', required: false, type: String })
  @ApiQuery({ name: 'sellerId', required: false, type: String })
  @ApiQuery({ name: 'assetId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiResponse({
    status: 200,
    description: 'List of transactions',
  })
  async findTransactions(
    @Query(validationPipe) query: FindTransactionsQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<{
    transactions: TransactionDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    this.logger.log(`GET /transactions`);
    return this.transactionsService.findTransactions(query, req.user.sub);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update transaction status',
    description:
      'Updates transaction status. Only valid status transitions are allowed.',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ type: UpdateTransactionStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Transaction status updated',
    type: TransactionDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async updateTransactionStatus(
    @Param('id') id: string,
    @Body(validationPipe) dto: UpdateTransactionStatusDto,
    @Request() req: RequestWithUser,
  ): Promise<TransactionDto> {
    this.logger.log(`PATCH /transactions/${id}/status`);
    return this.transactionsService.updateTransactionStatus(
      id,
      dto,
      req.user.sub,
    );
  }

  @Post(':id/deposit-earnest')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deposit earnest money',
    description:
      'Records earnest money deposit for a transaction. Only buyer can deposit earnest money.',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ type: DepositEarnestDto })
  @ApiResponse({
    status: 200,
    description: 'Earnest money deposited',
    type: TransactionDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid transaction status' })
  @ApiResponse({ status: 403, description: 'Only buyer can deposit earnest money' })
  async depositEarnest(
    @Param('id') id: string,
    @Body(validationPipe) dto: DepositEarnestDto,
    @Request() req: RequestWithUser,
  ): Promise<TransactionDto> {
    this.logger.log(`POST /transactions/${id}/deposit-earnest`);
    return this.transactionsService.depositEarnest(id, dto, req.user.sub);
  }

  @Post(':id/complete-due-diligence')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete due diligence',
    description:
      'Marks due diligence as complete for a transaction. Buyer or seller can mark DD complete.',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ type: CompleteDueDiligenceDto })
  @ApiResponse({
    status: 200,
    description: 'Due diligence completed',
    type: TransactionDto,
  })
  async completeDueDiligence(
    @Param('id') id: string,
    @Body(validationPipe) dto: CompleteDueDiligenceDto,
    @Request() req: RequestWithUser,
  ): Promise<TransactionDto> {
    this.logger.log(`POST /transactions/${id}/complete-due-diligence`);
    return this.transactionsService.completeDueDiligence(id, dto, req.user.sub);
  }

  @Post(':id/fund')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fund transaction',
    description:
      'Records funding/payment for a transaction. Only buyer can record funding.',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ type: FundTransactionDto })
  @ApiResponse({
    status: 200,
    description: 'Transaction funded',
    type: TransactionDto,
  })
  async fundTransaction(
    @Param('id') id: string,
    @Body(validationPipe) dto: FundTransactionDto,
    @Request() req: RequestWithUser,
  ): Promise<TransactionDto> {
    this.logger.log(`POST /transactions/${id}/fund`);
    return this.transactionsService.fundTransaction(id, dto, req.user.sub);
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close transaction',
    description:
      'Closes a transaction and generates settlement statement. Buyer or seller can close transaction.',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ type: CloseTransactionDto })
  @ApiResponse({
    status: 200,
    description: 'Transaction closed successfully',
    type: TransactionDto,
  })
  async closeTransaction(
    @Param('id') id: string,
    @Body(validationPipe) dto: CloseTransactionDto,
    @Request() req: RequestWithUser,
  ): Promise<TransactionDto> {
    this.logger.log(`POST /transactions/${id}/close`);
    return this.transactionsService.closeTransaction(id, dto, req.user.sub);
  }

  @Get(':id/settlement-statement')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get settlement statement',
    description:
      'Retrieves or generates settlement statement for a transaction. Includes fee breakdown, prorations, adjustments, and net proceeds.',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Settlement statement',
    type: SettlementStatementDto,
  })
  async getSettlementStatement(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<SettlementStatementDto> {
    this.logger.log(`GET /transactions/${id}/settlement-statement`);
    return this.transactionsService.generateSettlementStatement(id);
  }
}

