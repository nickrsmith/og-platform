import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
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
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard, RequestWithUser } from '@app/common';
import { SimplifyService } from './simplify.service';
import {
  CreateSimplifyNotarySessionDto,
  SimplifyNotarySessionResponseDto,
  SubmitSimplifyRecordingDto,
  SimplifyRecordingResponseDto,
  SimplifyWebhookDto,
} from './dto/simplify.dto';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('simplify')
@Controller()
export class SimplifyController {
  private readonly logger = new Logger(SimplifyController.name);

  constructor(private readonly simplifyService: SimplifyService) {}

  @Post('notary/simplify/session')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create Simplify e-notary session',
    description: 'Creates a new Simplify e-notary session for a transaction',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateSimplifyNotarySessionDto })
  @ApiResponse({
    status: 200,
    description: 'Simplify notary session created successfully',
    type: SimplifyNotarySessionResponseDto,
  })
  async createNotarySession(
    @Body(validationPipe) dto: CreateSimplifyNotarySessionDto,
  ): Promise<SimplifyNotarySessionResponseDto> {
    this.logger.log(`Creating Simplify notary session for transaction ${dto.transactionId}`);
    return this.simplifyService.createNotarySession(dto);
  }

  @Post('recording/simplify/submit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Submit recording to Simplify',
    description: 'Submits a recording to Simplify for e-recording',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: SubmitSimplifyRecordingDto })
  @ApiResponse({
    status: 200,
    description: 'Recording submitted successfully',
    type: SimplifyRecordingResponseDto,
  })
  async submitRecording(
    @Body(validationPipe) dto: SubmitSimplifyRecordingDto,
  ): Promise<SimplifyRecordingResponseDto> {
    this.logger.log(`Submitting Simplify recording for transaction ${dto.transactionId}`);
    return this.simplifyService.submitRecording(dto);
  }

  @Post('webhooks/simplify/notary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simplify e-notary webhook endpoint',
    description: 'Receives webhooks from Simplify about e-notary session updates',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleNotaryWebhook(@Body() payload: any): Promise<void> {
    // Note: In production, you should verify the webhook signature
    // See Simplify docs for webhook verification details
    this.logger.log('Received Simplify notary webhook');
    await this.simplifyService.handleNotaryWebhook(payload);
  }

  @Post('webhooks/simplify/recording')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simplify e-recording webhook endpoint',
    description: 'Receives webhooks from Simplify about e-recording status updates',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleRecordingWebhook(@Body() payload: any): Promise<void> {
    // Note: In production, you should verify the webhook signature
    // See Simplify docs for webhook verification details
    this.logger.log('Received Simplify recording webhook');
    await this.simplifyService.handleRecordingWebhook(payload);
  }
}
