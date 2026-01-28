import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Web3AuthService, Web3AuthPayload } from './web3auth.service';
import { jwtVerify, createRemoteJWKSet } from 'jose';

jest.mock('jose');

describe('Web3AuthService', () => {
  let service: Web3AuthService;
  let mockJwks: jest.Mock;

  beforeEach(async () => {
    mockJwks = jest.fn();
    (createRemoteJWKSet as jest.Mock).mockReturnValue(mockJwks);

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'WEB3AUTH_JWKS_URL') {
          return 'https://auth.web3auth.io/jwks';
        }
        if (key === 'WEB3AUTH_ISSUER') {
          return 'https://auth.web3auth.io';
        }
        if (key === 'WEB3AUTH_AUDIENCE') {
          return 'test-audience';
        }
        return '';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Web3AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<Web3AuthService>(Web3AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateToken', () => {
    const mockPayload: Web3AuthPayload = {
      email: 'test@example.com',
      name: 'Test User',
      profileImage: 'https://example.com/image.jpg',
      groupedAuthConnectionId: 'google',
      userId: 'user-123',
      sub: 'user-123',
      iss: 'https://auth.web3auth.io',
      aud: 'test-audience',
    };

    it('should validate token successfully', async () => {
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
      });

      const result = await service.validateToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwtVerify).toHaveBeenCalledWith('valid-token', mockJwks, {
        issuer: 'https://auth.web3auth.io',
        audience: 'test-audience',
        algorithms: ['ES256'],
      });
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const error = new Error('Invalid token');
      (jwtVerify as jest.Mock).mockRejectedValue(error);

      await expect(service.validateToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const error = new Error('Token expired');
      error.message = 'expired';
      (jwtVerify as jest.Mock).mockRejectedValue(error);

      await expect(service.validateToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when required claims are missing', async () => {
      const incompletePayload = {
        email: 'test@example.com',
        // Missing groupedAuthConnectionId and userId
      };
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: incompletePayload,
      });

      await expect(service.validateToken('incomplete-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when issuer mismatch', async () => {
      const error = new Error('Issuer mismatch');
      error.message = 'issuer';
      (jwtVerify as jest.Mock).mockRejectedValue(error);

      await expect(service.validateToken('wrong-issuer-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when audience mismatch', async () => {
      const error = new Error('Audience mismatch');
      error.message = 'audience';
      (jwtVerify as jest.Mock).mockRejectedValue(error);

      await expect(
        service.validateToken('wrong-audience-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when signature is invalid', async () => {
      const error = new Error('Invalid signature');
      error.message = 'signature';
      (jwtVerify as jest.Mock).mockRejectedValue(error);

      await expect(
        service.validateToken('invalid-signature-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
