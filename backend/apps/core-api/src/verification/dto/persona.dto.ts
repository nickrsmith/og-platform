import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePersonaSessionDto {
  @ApiPropertyOptional({
    description: 'Persona template ID to use for verification',
  })
  @IsOptional()
  @IsString()
  templateId?: string;
}

export class PersonaSessionResponseDto {
  @ApiProperty({
    description: 'Persona inquiry/session ID',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Persona client token for frontend SDK',
  })
  clientToken: string;
}

export class PersonaVerificationStatusDto {
  @ApiProperty({
    description: 'Whether the user is verified',
  })
  verified: boolean;

  @ApiProperty({
    description: 'KYC status: pending, verified, or failed',
    enum: ['pending', 'verified', 'failed'],
  })
  status: 'pending' | 'verified' | 'failed';

  @ApiPropertyOptional({
    description: 'Persona session/inquiry ID',
    nullable: true,
  })
  sessionId: string | null;

  @ApiPropertyOptional({
    description: 'Raw Persona inquiry status',
  })
  personaStatus?: string;
}
