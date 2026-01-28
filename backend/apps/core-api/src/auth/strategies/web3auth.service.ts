import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { URL } from 'url';

// Define the expected shape of the Web3Auth JWT payload
export interface Web3AuthPayload extends JWTPayload {
  email: string;
  name: string;
  profileImage: string;
  groupedAuthConnectionId: string;
  userId: string;
}

@Injectable()
export class Web3AuthService {
  private readonly logger = new Logger(Web3AuthService.name);
  private jwks: ReturnType<typeof createRemoteJWKSet> | null;
  private issuer: string | null;
  private audience: string | null;
  private jwksUrl: string | null;
  private enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.jwksUrl = this.configService.get<string>('WEB3AUTH_JWKS_URL') || null;
    this.issuer = this.configService.get<string>('WEB3AUTH_ISSUER') || null;
    this.audience = this.configService.get<string>('WEB3AUTH_AUDIENCE') || null;
    
    if (!this.jwksUrl || !this.issuer || !this.audience) {
      this.logger.warn('Web3Auth configuration not found. Web3Auth service will be disabled.');
      this.enabled = false;
      this.jwks = null;
    } else {
      this.enabled = true;
      this.jwks = createRemoteJWKSet(new URL(this.jwksUrl));
      this.logger.log('Web3Auth service initialized');
    }
  }

  async validateToken(token: string): Promise<Web3AuthPayload> {
    if (!this.enabled || !this.jwks || !this.issuer || !this.audience) {
      throw new UnauthorizedException('Web3Auth is not configured. Please configure WEB3AUTH_JWKS_URL, WEB3AUTH_ISSUER, and WEB3AUTH_AUDIENCE.');
    }
    
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['ES256'],
      });

      // Validate the required claims
      if (
        !payload.email ||
        !payload.groupedAuthConnectionId ||
        !payload.userId
      ) {
        throw new Error(
          'Required claims (email, groupedAuthConnectionId, userId) not found in token.',
        );
      }

      return payload as Web3AuthPayload;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Web3Auth token validation failed: ${errorMessage}`);

      // Provide specific error guidance for common issues
      if (error instanceof Error) {
        if (error.message.includes('issuer')) {
          this.logger.error(
            'Issuer mismatch - Check WEB3AUTH_ISSUER configuration',
          );
        } else if (error.message.includes('audience')) {
          this.logger.error(
            'Audience mismatch - Check WEB3AUTH_AUDIENCE configuration',
          );
        } else if (error.message.includes('expired')) {
          this.logger.error('Token has expired');
        } else if (error.message.includes('signature')) {
          this.logger.error(
            'Invalid signature - Check WEB3AUTH_JWKS_URL configuration',
          );
        }
      }

      throw new UnauthorizedException('Invalid or expired Web3Auth token.');
    }
  }
}
