import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { EnverusService } from './enverus.service';
import {
  EnverusWellsQueryDto,
  EnverusProductionQueryDto,
  EnverusRigsQueryDto,
  EnverusPermitsQueryDto,
  EnverusCompletionsQueryDto,
  EnverusTransactionsQueryDto,
  EnverusValidateAssetDto,
  EnverusWellsResponseDto,
  EnverusProductionResponseDto,
  EnverusRigsResponseDto,
  EnverusPermitsResponseDto,
  EnverusCompletionsResponseDto,
  EnverusTransactionsResponseDto,
  EnverusValidationResultDto,
  JwtAuthGuard,
} from '@app/common';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('enverus')
@ApiBearerAuth('JWT-auth')
@Controller('enverus')
export class EnverusController {
  private readonly logger = new Logger(EnverusController.name);

  constructor(private readonly enverusService: EnverusService) {}

  @Get('wells')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getWells(
    @Query(validationPipe) query: EnverusWellsQueryDto,
  ): Promise<EnverusWellsResponseDto> {
    this.logger.log(`GET /enverus/wells - ${JSON.stringify(query)}`);
    return this.enverusService.getWellsByCounty(query);
  }

  @Get('production')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getProduction(
    @Query(validationPipe) query: EnverusProductionQueryDto,
  ): Promise<EnverusProductionResponseDto> {
    this.logger.log(`GET /enverus/production - ${JSON.stringify(query)}`);
    return this.enverusService.getProductionHistory(query);
  }

  @Get('rigs')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getRigs(
    @Query(validationPipe) query: EnverusRigsQueryDto,
  ): Promise<EnverusRigsResponseDto> {
    this.logger.log(`GET /enverus/rigs - ${JSON.stringify(query)}`);
    return this.enverusService.getRigs(query);
  }

  @Get('permits')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getPermits(
    @Query(validationPipe) query: EnverusPermitsQueryDto,
  ): Promise<EnverusPermitsResponseDto> {
    this.logger.log(`GET /enverus/permits - ${JSON.stringify(query)}`);
    return this.enverusService.getPermits(query);
  }

  @Get('completions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getCompletions(
    @Query(validationPipe) query: EnverusCompletionsQueryDto,
  ): Promise<EnverusCompletionsResponseDto> {
    this.logger.log(`GET /enverus/completions - ${JSON.stringify(query)}`);
    return this.enverusService.getCompletions(query);
  }

  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getTransactions(
    @Query(validationPipe) query: EnverusTransactionsQueryDto,
  ): Promise<EnverusTransactionsResponseDto> {
    this.logger.log(`GET /enverus/transactions - ${JSON.stringify(query)}`);
    return this.enverusService.getTransactions(query);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async validateAsset(
    @Body(validationPipe) dto: EnverusValidateAssetDto,
  ): Promise<EnverusValidationResultDto> {
    this.logger.log(`POST /enverus/validate - ${JSON.stringify(dto)}`);
    return this.enverusService.validateAsset(dto);
  }
}

