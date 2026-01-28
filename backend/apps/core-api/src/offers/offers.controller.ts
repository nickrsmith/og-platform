import {
  Controller,
  Post,
  Get,
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
import { OffersService } from './offers.service';
import {
  CreateOfferDto,
  UpdateOfferDto,
  FindOffersQueryDto,
  AcceptOfferDto,
  DeclineOfferDto,
  CounterOfferDto,
  OfferDto,
  JwtAuthGuard,
  type RequestWithUser,
  IdempotencyGuard,
} from '@app/common';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('offers')
@ApiBearerAuth('JWT-auth')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}
  private readonly logger = new Logger(OffersController.name);

  @Post()
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create offer on asset',
    description:
      'Creates a new offer on an asset. Buyer cannot create offer on their own asset. Sends notification to seller.',
  })
  @ApiBody({ type: CreateOfferDto })
  @ApiResponse({
    status: 201,
    description: 'Offer created successfully',
    type: OfferDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or duplicate offer' })
  async createOffer(
    @Request() req: RequestWithUser,
    @Body(validationPipe) dto: CreateOfferDto,
  ): Promise<OfferDto> {
    return this.offersService.createOffer(req.user.sub, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findOffers(
    @Request() req: RequestWithUser,
    @Query(validationPipe) query: FindOffersQueryDto,
  ) {
    return this.offersService.findOffers(req.user.sub, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findOneOffer(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<OfferDto> {
    return this.offersService.findOneOffer(id, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  async updateOffer(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body(validationPipe) dto: UpdateOfferDto,
  ): Promise<OfferDto> {
    return this.offersService.updateOffer(id, req.user.sub, dto);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept offer',
    description:
      'Accepts an offer. Only seller can accept. Declines other pending offers on the same asset. Sends notification to buyer.',
  })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiBody({ type: AcceptOfferDto })
  @ApiResponse({
    status: 200,
    description: 'Offer accepted',
    type: OfferDto,
  })
  @ApiResponse({ status: 400, description: 'Offer cannot be accepted' })
  @ApiResponse({ status: 403, description: 'Only seller can accept' })
  async acceptOffer(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body(validationPipe) dto: AcceptOfferDto,
  ): Promise<OfferDto> {
    return this.offersService.acceptOffer(id, req.user.sub, dto);
  }

  @Post(':id/decline')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  async declineOffer(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body(validationPipe) dto: DeclineOfferDto,
  ): Promise<OfferDto> {
    return this.offersService.declineOffer(id, req.user.sub, dto);
  }

  @Post(':id/withdraw')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  async withdrawOffer(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<OfferDto> {
    return this.offersService.withdrawOffer(id, req.user.sub);
  }

  @Post(':id/counter')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCounterOffer(
    @Param('id') parentOfferId: string,
    @Request() req: RequestWithUser,
    @Body(validationPipe) dto: CounterOfferDto,
  ): Promise<OfferDto> {
    return this.offersService.createCounterOffer(
      parentOfferId,
      req.user.sub,
      dto,
    );
  }
}

