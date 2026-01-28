import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a Simplify e-notary session
 */
export class CreateSimplifyNotarySessionDto {
  @ApiProperty({
    description: 'Transaction ID for which to create the notary session',
  })
  @IsUUID()
  transactionId: string;

  @ApiPropertyOptional({
    description: 'Additional options for the notary session',
  })
  @IsOptional()
  @IsString()
  options?: string;
}

/**
 * Response DTO for Simplify e-notary session creation
 */
export class SimplifyNotarySessionResponseDto {
  @ApiProperty({
    description: 'Simplify notary session ID',
  })
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Client token or URL for frontend integration',
  })
  clientToken?: string;

  @ApiPropertyOptional({
    description: 'Redirect URL for notary session',
  })
  redirectUrl?: string;
}

/**
 * DTO for submitting a recording to Simplify
 */
export class SubmitSimplifyRecordingDto {
  @ApiProperty({
    description: 'Transaction ID for which to submit the recording',
  })
  @IsUUID()
  transactionId: string;

  @ApiPropertyOptional({
    description: 'Additional recording metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Response DTO for Simplify recording submission
 */
export class SimplifyRecordingResponseDto {
  @ApiProperty({
    description: 'Recording submission ID',
  })
  submissionId: string;

  @ApiPropertyOptional({
    description: 'Recording status',
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Recording file number (once recorded)',
  })
  fileNumber?: string;

  @ApiPropertyOptional({
    description: 'Recording book page (once recorded)',
  })
  bookPage?: string;
}

/**
 * DTO for Simplify webhook payloads
 */
export class SimplifyWebhookDto {
  @ApiProperty({
    description: 'Webhook event type',
  })
  eventType: string;

  @ApiProperty({
    description: 'Webhook payload data',
  })
  data: any;

  @ApiPropertyOptional({
    description: 'Webhook signature for verification',
  })
  signature?: string;
}
