import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard, RequestWithUser } from '@app/common';
import { VerificationService } from './verification.service';
import {
  CreatePersonaSessionDto,
  PersonaSessionResponseDto,
  PersonaVerificationStatusDto,
} from './dto/persona.dto';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('verification')
@ApiBearerAuth('JWT-auth')
@Controller('verification')
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(private readonly verificationService: VerificationService) {}

  @Post('persona/session')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create Persona verification session',
    description: 'Creates a new Persona identity verification session for the authenticated user',
  })
  @ApiBody({ type: CreatePersonaSessionDto })
  @ApiResponse({
    status: 200,
    description: 'Persona session created successfully',
    type: PersonaSessionResponseDto,
  })
  async createPersonaSession(
    @Request() req: RequestWithUser,
    @Body(validationPipe) dto: CreatePersonaSessionDto,
  ): Promise<PersonaSessionResponseDto> {
    const userId = req.user.sub;
    this.logger.log(`Creating Persona session for user ${userId}`);
    return this.verificationService.createPersonaSession(userId, dto);
  }

  @Get('persona/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get Persona verification status',
    description: 'Returns the current Persona verification status for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification status retrieved successfully',
    type: PersonaVerificationStatusDto,
  })
  async getVerificationStatus(
    @Request() req: RequestWithUser,
  ): Promise<PersonaVerificationStatusDto> {
    const userId = req.user.sub;
    return this.verificationService.getVerificationStatus(userId);
  }

  @Post('webhooks/persona')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Persona webhook endpoint',
    description: 'Receives webhooks from Persona about verification status updates',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handlePersonaWebhook(@Body() payload: any): Promise<void> {
    // Note: In production, you should verify the webhook signature
    // See Persona docs: https://docs.withpersona.com/docs/webhooks
    this.logger.log('Received Persona webhook');
    await this.verificationService.handlePersonaWebhook(payload);
  }
}
