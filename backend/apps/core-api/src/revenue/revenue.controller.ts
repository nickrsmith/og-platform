import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RevenueService } from './revenue.service';
import {
  CalculateRevenueSplitDto,
  RevenueSplitDto,
  RevenueStatsDto,
  OrganizationEarningsDto,
  FeeStructureDto,
  JwtAuthGuard,
} from '@app/common';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('revenue')
@ApiBearerAuth('JWT-auth')
@Controller('revenue')
export class RevenueController {
  private readonly logger = new Logger(RevenueController.name);

  constructor(private readonly revenueService: RevenueService) {}

  @Post('calculate-split')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Calculate revenue split',
    description:
      'Calculates revenue split for a transaction amount based on asset category and organization fee structure. Category C assets have 0% fees (free listing).',
  })
  @ApiBody({ type: CalculateRevenueSplitDto })
  @ApiResponse({
    status: 200,
    description: 'Revenue split calculated',
    type: RevenueSplitDto,
  })
  async calculateRevenueSplit(
    @Body(validationPipe) dto: CalculateRevenueSplitDto,
  ): Promise<RevenueSplitDto> {
    this.logger.log(`POST /revenue/calculate-split`);
    return this.revenueService.calculateRevenueSplit(dto);
  }

  @Get('fee-structure/:orgContractAddress')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get fee structure',
    description:
      'Retrieves fee structure for an organization. Returns custom fees if set, otherwise platform defaults.',
  })
  @ApiParam({
    name: 'orgContractAddress',
    description: 'Organization contract address',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Fee structure',
    type: FeeStructureDto,
  })
  async getFeeStructure(
    @Param('orgContractAddress') orgContractAddress: string,
  ): Promise<FeeStructureDto> {
    this.logger.log(
      `GET /revenue/fee-structure/${orgContractAddress}`,
    );
    return this.revenueService.getFeeStructure(orgContractAddress);
  }

  @Get('stats/:orgContractAddress')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get revenue statistics',
    description:
      'Retrieves revenue statistics for an organization including total revenue, creator revenue, platform fees, and earnings breakdown.',
  })
  @ApiParam({
    name: 'orgContractAddress',
    description: 'Organization contract address',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue statistics',
    type: RevenueStatsDto,
  })
  async getRevenueStats(
    @Param('orgContractAddress') orgContractAddress: string,
  ): Promise<RevenueStatsDto> {
    this.logger.log(`GET /revenue/stats/${orgContractAddress}`);
    return this.revenueService.getRevenueStats(orgContractAddress);
  }

  @Get('earnings/:organizationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get organization earnings',
    description:
      'Retrieves earnings breakdown for an organization including pending and distributed amounts.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization ID',
    example: 'org-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization earnings',
    type: OrganizationEarningsDto,
  })
  @ApiResponse({ status: 404, description: 'Organization not found or has no contract address' })
  async getOrganizationEarnings(
    @Param('organizationId') organizationId: string,
  ): Promise<OrganizationEarningsDto> {
    this.logger.log(`GET /revenue/earnings/${organizationId}`);
    try {
      return await this.revenueService.getOrganizationEarnings(
        organizationId,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('has no contract')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}

