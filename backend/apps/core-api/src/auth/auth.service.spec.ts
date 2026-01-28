import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '@app/database';
import { Web3AuthService } from './strategies/web3auth.service';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpService: jest.Mocked<HttpService>;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let web3AuthService: jest.Mocked<Web3AuthService>;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    };

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const urls: Record<string, string> = {
          KMS_SERVICE_URL: 'http://kms-service',
          LENS_MANAGER_URL: 'http://lens-manager',
          BLOCKCHAIN_SERVICE_URL: 'http://blockchain-service',
          INDEXER_API_URL: 'http://indexer-api',
        };
        return urls[key] || '';
      }),
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'JWT_SECRET') {
          return 'test-secret';
        }
        if (key === 'JWT_ACCESS_TOKEN_EXPIRATION') {
          return '1h';
        }
        if (key === 'JWT_REFRESH_TOKEN_EXPIRATION') {
          return '7d';
        }
        if (key === 'HTTP_TIMEOUT') {
          return defaultValue ?? 100000;
        }
        return defaultValue;
      }),
    };

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userAuthentication: {
        count: jest.fn(),
        create: jest.fn(),
      },
      wallet: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      p2PIdentity: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      organizationMember: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      organization: {
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      organizationInvitation: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      sessionRefreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockWeb3AuthService = {
      validateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: Web3AuthService,
          useValue: mockWeb3AuthService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    httpService = module.get(HttpService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    web3AuthService = module.get(Web3AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const mockWeb3AuthPayload = {
      email: 'test@example.com',
      name: 'Test User',
      profileImage: 'https://example.com/image.jpg',
      groupedAuthConnectionId: 'google',
      userId: 'provider-user-123',
    };

    const mockWallet = {
      walletAddress: '0x123',
      compressedPublicKey: 'pubkey',
    };

    const mockP2PIdentity = {
      peerId: 'peer-123',
      publicKey: 'p2p-pubkey',
    };

    it('should login new user successfully', async () => {
      // Mock Web3Auth token validation
      web3AuthService.validateToken.mockResolvedValue(mockWeb3AuthPayload);

      // Mock user not found (new user)
      prismaService.user.findUnique.mockResolvedValue(null);

      // Mock profile image fetch
      httpService.get.mockReturnValue(
        of({
          data: Buffer.from('image'),
          headers: { 'content-type': 'image/jpeg' },
        }) as any,
      );

      // Mock KMS service calls for wallet and P2P identity provisioning
      // The service uses httpService.post().pipe(catchError()) pattern
      // We need to return an Observable that supports pipe() operations
      let postCallCount = 0;
      httpService.post.mockImplementation(
        (url: string, payload?: any, _config?: any) => {
          postCallCount++;
          // First call: Create wallet via KMS service
          if (
            url.includes('/wallets') ||
            (postCallCount === 1 && payload?.userId)
          ) {
            return of({
              data: { walletAddress: '0x123', compressedPublicKey: 'pubkey' },
            }) as any;
          }
          // Second call: Create P2P identity via KMS service
          if (
            url.includes('/p2p-identities') ||
            (postCallCount === 2 && payload?.userId)
          ) {
            return of({
              data: { peerId: 'peer-123', publicKey: 'p2p-pubkey' },
            }) as any;
          }
          // Third call: Enqueue faucet job via blockchain service
          if (url.includes('/jobs')) {
            return of({
              data: { jobId: 'faucet-job-123' },
            }) as any;
          }
          // Default response
          return of({ data: {} }) as any;
        },
      );

      // Mock user creation with nested authentication creation
      prismaService.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        isActive: false,
      } as any);

      // Mock user activation after provisioning
      prismaService.user.update.mockResolvedValue({
        id: 'user-123',
        isActive: true,
      } as any);

      // Mock wallet and P2P identity retrieval after provisioning
      prismaService.wallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaService.p2PIdentity.findUnique.mockResolvedValue(
        mockP2PIdentity as any,
      );

      // Mock organization member check (user has no org)
      prismaService.organizationMember.findFirst.mockResolvedValue(null);

      // Mock JWT token generation
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Mock refresh token storage
      prismaService.sessionRefreshToken.create.mockResolvedValue({
        id: 'session-123',
      } as any);

      const result = await service.login({
        token: 'web3auth-token',
      } as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prismaService.user.create).toHaveBeenCalled();
      // Verify wallet provisioning was called
      expect(httpService.post).toHaveBeenCalledWith(
        'http://kms-service/wallets',
        { userId: 'user-123' },
        expect.objectContaining({ timeout: 30000 }),
      );
      // Verify P2P identity provisioning was called
      expect(httpService.post).toHaveBeenCalledWith(
        'http://kms-service/p2p-identities',
        expect.objectContaining({ userId: 'user-123' }),
        expect.objectContaining({ timeout: 30000 }),
      );
    });

    it('should login returning user successfully', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        isActive: true,
      };
      web3AuthService.validateToken.mockResolvedValue(mockWeb3AuthPayload);
      prismaService.user.findUnique.mockResolvedValue(existingUser as any);
      prismaService.userAuthentication.count.mockResolvedValue(1);
      prismaService.wallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaService.p2PIdentity.findUnique.mockResolvedValue(
        mockP2PIdentity as any,
      );
      prismaService.organizationMember.findFirst.mockResolvedValue(null);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      prismaService.sessionRefreshToken.create.mockResolvedValue({
        id: 'session-123',
      } as any);

      const result = await service.login({
        token: 'web3auth-token',
      } as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw InternalServerErrorException when user is inactive', async () => {
      const inactiveUser = {
        id: 'user-123',
        email: 'test@example.com',
        isActive: false,
      };
      web3AuthService.validateToken.mockResolvedValue(mockWeb3AuthPayload);
      prismaService.user.findUnique.mockResolvedValue(inactiveUser as any);

      await expect(
        service.login({ token: 'web3auth-token' } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when wallet provisioning fails', async () => {
      web3AuthService.validateToken.mockResolvedValue(mockWeb3AuthPayload);
      prismaService.user.findUnique.mockResolvedValue(null);
      httpService.get.mockReturnValue(
        of({ data: Buffer.from('image') }) as any,
      );
      const axiosError = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      } as AxiosError;
      httpService.post.mockReturnValue(throwError(() => axiosError) as any);
      prismaService.user.create.mockResolvedValue({
        id: 'user-123',
        isActive: false,
      } as any);

      await expect(
        service.login({ token: 'web3auth-token' } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('refreshToken', () => {
    const mockSession = {
      id: 'session-123',
      userId: 'user-123',
      tokenHash: 'hash',
      isRevoked: false,
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const mockWallet = {
      compressedPublicKey: 'pubkey',
    };

    const mockP2PIdentity = {
      peerId: 'peer-123',
      publicKey: 'p2p-pubkey',
    };

    it('should refresh token successfully', async () => {
      prismaService.sessionRefreshToken.findUnique.mockResolvedValue(
        mockSession as any,
      );
      prismaService.sessionRefreshToken.update.mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      } as any);
      prismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser as any);
      prismaService.organizationMember.findFirst.mockResolvedValue(null);
      prismaService.p2PIdentity.findUnique.mockResolvedValue(
        mockP2PIdentity as any,
      );
      prismaService.wallet.findUnique.mockResolvedValue(mockWallet as any);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      prismaService.sessionRefreshToken.create.mockResolvedValue({
        id: 'new-session-123',
      } as any);

      const result = await service.refreshToken('user-123', 'refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prismaService.sessionRefreshToken.update).toHaveBeenCalledWith({
        where: { id: mockSession.id },
        data: { isRevoked: true },
      });
    });

    it('should throw UnauthorizedException when session not found', async () => {
      prismaService.sessionRefreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken('user-123', 'invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when session is revoked', async () => {
      const revokedSession = {
        ...mockSession,
        isRevoked: true,
      };
      prismaService.sessionRefreshToken.findUnique.mockResolvedValue(
        revokedSession as any,
      );

      await expect(
        service.refreshToken('user-123', 'revoked-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when userId mismatch', async () => {
      const wrongUserSession = {
        ...mockSession,
        userId: 'other-user',
      };
      prismaService.sessionRefreshToken.findUnique.mockResolvedValue(
        wrongUserSession as any,
      );

      await expect(
        service.refreshToken('user-123', 'wrong-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const mockSession = {
      id: 'session-123',
      userId: 'user-123',
      isRevoked: false,
    };

    it('should revoke session successfully', async () => {
      prismaService.sessionRefreshToken.findUnique.mockResolvedValue(
        mockSession as any,
      );
      prismaService.sessionRefreshToken.update.mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      } as any);

      await service.logout({ refreshToken: 'token' } as any);

      expect(prismaService.sessionRefreshToken.update).toHaveBeenCalledWith({
        where: { id: mockSession.id },
        data: { isRevoked: true },
      });
    });

    it('should not throw when session not found', async () => {
      prismaService.sessionRefreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.logout({ refreshToken: 'token' } as any),
      ).resolves.not.toThrow();
    });

    it('should not update when session already revoked', async () => {
      const revokedSession = {
        ...mockSession,
        isRevoked: true,
      };
      prismaService.sessionRefreshToken.findUnique.mockResolvedValue(
        revokedSession as any,
      );

      await service.logout({ refreshToken: 'token' } as any);

      expect(prismaService.sessionRefreshToken.update).not.toHaveBeenCalled();
    });
  });

  describe('startSession', () => {
    const mockJwtPayload = {
      sub: 'user-123',
      siteAddress: 'site-123',
    };

    it('should start session successfully', () => {
      httpService.patch.mockReturnValue(of({ data: {} }) as any);

      const result = service.startSession(mockJwtPayload as any);

      expect(result).toEqual(mockJwtPayload);
      // Note: httpService.patch may or may not be called since it's now fire-and-forget
      // The call happens asynchronously, so we can't reliably test it here
    });

    it('should start session without site address', () => {
      const payloadWithoutSite = {
        sub: 'user-123',
      };

      const result = service.startSession(payloadWithoutSite as any);

      expect(result).toEqual(payloadWithoutSite);
      expect(httpService.patch).not.toHaveBeenCalled();
    });

    it('should handle 404 errors gracefully when site not found', () => {
      const axiosError = {
        response: { status: 404 },
        message: 'Not Found',
      } as AxiosError;
      httpService.patch.mockReturnValue(throwError(() => axiosError) as any);

      const result = service.startSession(mockJwtPayload as any);

      // Should not throw, just log warning
      expect(result).toEqual(mockJwtPayload);
    });

    it('should handle network errors (ENOTFOUND) gracefully', () => {
      const axiosError = {
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND lens-manager',
      } as AxiosError;
      httpService.patch.mockReturnValue(throwError(() => axiosError) as any);

      const result = service.startSession(mockJwtPayload as any);

      // Should not throw, just log warning
      expect(result).toEqual(mockJwtPayload);
    });

    it('should handle connection refused errors gracefully', () => {
      const axiosError = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      } as AxiosError;
      httpService.patch.mockReturnValue(throwError(() => axiosError) as any);

      const result = service.startSession(mockJwtPayload as any);

      // Should not throw, just log warning
      expect(result).toEqual(mockJwtPayload);
    });

    it('should handle timeout errors gracefully', () => {
      const axiosError = {
        code: 'ETIMEDOUT',
        message: 'Connection timeout',
      } as AxiosError;
      httpService.patch.mockReturnValue(throwError(() => axiosError) as any);

      const result = service.startSession(mockJwtPayload as any);

      // Should not throw, just log warning
      expect(result).toEqual(mockJwtPayload);
    });

    it('should complete session even with non-network errors', () => {
      const axiosError = {
        response: { status: 500 },
        message: 'Internal Server Error',
      } as AxiosError;
      httpService.patch.mockReturnValue(throwError(() => axiosError) as any);

      // Should still complete the session, but log the error
      const result = service.startSession(mockJwtPayload as any);
      expect(result).toEqual(mockJwtPayload);
    });
  });
});
