import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/database';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreatePersonaSessionDto, PersonaSessionResponseDto, PersonaVerificationStatusDto } from './dto/persona.dto';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly personaApiKey: string;
  private readonly personaEnvironmentId: string;
  private readonly personaBaseUrl = 'https://api.withpersona.com/api/v1';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.personaApiKey = this.configService.get<string>('PERSONA_API_KEY') || '';
    this.personaEnvironmentId = this.configService.get<string>('PERSONA_ENVIRONMENT_ID') || '';
    
    if (!this.personaApiKey) {
      this.logger.warn('PERSONA_API_KEY not configured. Persona verification will be disabled.');
    }
    if (!this.personaEnvironmentId) {
      this.logger.warn('PERSONA_ENVIRONMENT_ID not configured. Persona verification will be disabled.');
    }
  }

  /**
   * Create a new Persona verification session for a user
   */
  async createPersonaSession(userId: string, dto: CreatePersonaSessionDto): Promise<PersonaSessionResponseDto> {
    if (!this.personaApiKey || !this.personaEnvironmentId) {
      throw new Error('Persona API not configured. Please set PERSONA_API_KEY and PERSONA_ENVIRONMENT_ID.');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    try {
      // Create Persona inquiry (verification session)
      const personaResponse = await firstValueFrom(
        this.httpService.post(
          `${this.personaBaseUrl}/inquiries`,
          {
            data: {
              type: 'inquiry',
              attributes: {
                referenceId: userId,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                email: user.email,
                ...(dto.templateId && { templateId: dto.templateId }),
              },
            },
          },
          {
            headers: {
              'Persona-Version': '2024-01-15',
              'Authorization': `Bearer ${this.personaApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const inquiryId = personaResponse.data.data.id;

      // Update user with Persona session ID
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          personaSessionId: inquiryId,
          kycStatus: 'pending',
        },
      });

      this.logger.log(`Created Persona session ${inquiryId} for user ${userId}`);

      return {
        sessionId: inquiryId,
        clientToken: personaResponse.data.data.attributes.clientToken || '',
      };
    } catch (error: any) {
      this.logger.error(`Failed to create Persona session for user ${userId}:`, error.response?.data || error.message);
      throw new Error(`Failed to create Persona session: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
    }
  }

  /**
   * Get Persona verification status for a user
   */
  async getVerificationStatus(userId: string): Promise<PersonaVerificationStatusDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        personaVerified: true,
        kycStatus: true,
        personaSessionId: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // If there's a Persona session ID, check status from Persona API
    if (user.personaSessionId && this.personaApiKey) {
      try {
        const inquiryResponse = await firstValueFrom(
          this.httpService.get(
            `${this.personaBaseUrl}/inquiries/${user.personaSessionId}`,
            {
              headers: {
                'Persona-Version': '2024-01-15',
                'Authorization': `Bearer ${this.personaApiKey}`,
              },
            },
          ),
        );

        const inquiryStatus = inquiryResponse.data.data.attributes.status;
        const verificationStatus = this.mapPersonaStatusToKycStatus(inquiryStatus);

        // Update user status if it changed
        if (user.kycStatus !== verificationStatus) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              kycStatus: verificationStatus,
              personaVerified: verificationStatus === 'verified',
            },
          });
        }

        return {
          verified: user.personaVerified || verificationStatus === 'verified',
          status: verificationStatus,
          sessionId: user.personaSessionId,
          personaStatus: inquiryStatus,
        };
      } catch (error: any) {
        this.logger.warn(`Failed to fetch Persona status for session ${user.personaSessionId}:`, error.message);
        // Return cached status if API call fails
      }
    }

    return {
      verified: user.personaVerified || false,
      status: (user.kycStatus as 'pending' | 'verified' | 'failed') || 'pending',
      sessionId: user.personaSessionId || null,
    };
  }

  /**
   * Handle Persona webhook events
   */
  async handlePersonaWebhook(payload: any): Promise<void> {
    this.logger.log('Received Persona webhook:', JSON.stringify(payload, null, 2));

    const eventType = payload.data?.type;
    const inquiryId = payload.data?.id;

    if (!inquiryId) {
      this.logger.warn('Persona webhook missing inquiry ID');
      return;
    }

    // Find user by Persona session ID
    const user = await this.prisma.user.findFirst({
      where: { personaSessionId: inquiryId },
    });

    if (!user) {
      this.logger.warn(`No user found for Persona session ${inquiryId}`);
      return;
    }

    // Handle different event types
    switch (eventType) {
      case 'inquiry.updated':
      case 'inquiry.completed':
        const inquiryStatus = payload.data?.attributes?.status;
        const kycStatus = this.mapPersonaStatusToKycStatus(inquiryStatus);
        
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            kycStatus,
            personaVerified: kycStatus === 'verified',
          },
        });

        this.logger.log(`Updated verification status for user ${user.id}: ${kycStatus}`);
        break;

      default:
        this.logger.log(`Unhandled Persona webhook event type: ${eventType}`);
    }
  }

  /**
   * Map Persona inquiry status to our KYC status
   */
  private mapPersonaStatusToKycStatus(personaStatus: string): 'pending' | 'verified' | 'failed' {
    switch (personaStatus?.toLowerCase()) {
      case 'completed':
      case 'passed':
      case 'approved':
        return 'verified';
      case 'failed':
      case 'declined':
      case 'rejected':
        return 'failed';
      default:
        return 'pending';
    }
  }
}
