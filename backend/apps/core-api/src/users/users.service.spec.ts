import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '@app/database';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { ethers } from 'ethers';

describe('UsersService', () => {
  let service: UsersService;
  let httpService: jest.Mocked<HttpService>;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheManager: jest.Mocked<any>;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
    };

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'INDEXER_API_URL') {
          return 'http://indexer-api';
        }
        if (key === 'BLOCKCHAIN_SERVICE_URL') {
          return 'http://blockchain-service';
        }
        return '';
      }),
    };

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
      p2PIdentity: {
        findUnique: jest.fn(),
      },
      wallet: {
        findUnique: jest.fn(),
      },
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
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
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    httpService = module.get(HttpService);
    prismaService = module.get(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyProfile', () => {
    const mockUser = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      profileImage: 'https://example.com/image.jpg',
      email: 'john@example.com',
    };

    it('should return user profile', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.getMyProfile('user-123');

      expect(result).toEqual({
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        profileImage: mockUser.profileImage,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyProfile('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when profile data is incomplete', async () => {
      const incompleteUser = {
        id: 'user-123',
        firstName: null,
        lastName: 'Doe',
        profileImage: 'https://example.com/image.jpg',
      };
      prismaService.user.findUnique.mockResolvedValue(incompleteUser as any);

      await expect(service.getMyProfile('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findUserByPeerId', () => {
    const mockIdentity = {
      userId: 'user-123',
    };
    const mockUser = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      profileImage: 'https://example.com/image.jpg',
    };

    it('should return user profile by peer ID', async () => {
      prismaService.p2PIdentity.findUnique.mockResolvedValue(
        mockIdentity as any,
      );
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.findUserByPeerId('peer-123');

      expect(result).toEqual({
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        profileImage: mockUser.profileImage,
      });
    });

    it('should throw NotFoundException when peer ID not found', async () => {
      prismaService.p2PIdentity.findUnique.mockResolvedValue(null);

      await expect(service.findUserByPeerId('peer-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user profile is incomplete', async () => {
      prismaService.p2PIdentity.findUnique.mockResolvedValue(
        mockIdentity as any,
      );
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        firstName: null,
      } as any);

      await expect(service.findUserByPeerId('peer-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getP2PIdentity', () => {
    const mockIdentity = {
      peerId: 'peer-123',
      publicKey: 'public-key',
      encryptedPrivateKey: 'encrypted-key',
      encryptedDek: 'encrypted-dek',
    };

    it('should return P2P identity', async () => {
      prismaService.p2PIdentity.findUnique.mockResolvedValue(
        mockIdentity as any,
      );

      const result = await service.getP2PIdentity('user-123');

      expect(result).toEqual(mockIdentity);
      expect(prismaService.p2PIdentity.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should throw NotFoundException when identity not found', async () => {
      prismaService.p2PIdentity.findUnique.mockResolvedValue(null);

      await expect(service.getP2PIdentity('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMySales', () => {
    const mockSalesData = {
      totalSales: 1000,
      totalRevenue: '5000',
    };

    it('should return sales analytics', async () => {
      httpService.get.mockReturnValue(of({ data: mockSalesData }) as any);

      const result = await service.getMySales('peer-123', {});

      expect(result).toEqual(mockSalesData);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://indexer-api/analytics/sales',
        { params: { creatorPeerId: 'peer-123' } },
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(service.getMySales('peer-123', {})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getMyWalletBalance', () => {
    const mockWallet = {
      walletAddress: '0x123',
    };
    const mockBalance = {
      nativeBalance: ethers.parseEther('1.0').toString(),
      usdcBalance: ethers.parseUnits('100', 6).toString(),
    };

    it('should return cached balance when available', async () => {
      cacheManager.get.mockResolvedValue(mockBalance);

      const result = await service.getMyWalletBalance('user-123');

      expect(result.nativeBalance).toBe(mockBalance.nativeBalance);
      expect(result.usdcBalance).toBe(mockBalance.usdcBalance);
      expect(result.formattedNativeBalance).toBe('1.0');
      expect(result.formattedUsdcBalance).toBe('100.0');
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should fetch and cache balance when not cached', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.wallet.findUnique.mockResolvedValue(mockWallet as any);
      httpService.get.mockReturnValue(of({ data: mockBalance }) as any);

      const result = await service.getMyWalletBalance('user-123');

      expect(result.nativeBalance).toBe(mockBalance.nativeBalance);
      expect(result.usdcBalance).toBe(mockBalance.usdcBalance);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'wallet-balance:user-123',
        mockBalance,
        60,
      );
    });

    it('should throw NotFoundException when wallet not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.wallet.findUnique.mockResolvedValue(null);

      await expect(service.getMyWalletBalance('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException when blockchain service fails', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.wallet.findUnique.mockResolvedValue(mockWallet as any);
      const axiosError = {
        response: { status: 404 },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(service.getMyWalletBalance('user-123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getMyTransactionHistory', () => {
    const mockHistory = {
      transactions: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    };

    it('should return transaction history', async () => {
      httpService.get.mockReturnValue(of({ data: mockHistory }) as any);

      const result = await service.getMyTransactionHistory('peer-123', {
        page: 1,
        pageSize: 20,
      });

      expect(result).toEqual(mockHistory);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://indexer-api/analytics/transaction-history/peer-123',
        { params: { page: 1, pageSize: 20 } },
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.getMyTransactionHistory('peer-123', {}),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getMyRoyaltyChartData', () => {
    const mockChartData = {
      data: [],
      labels: [],
    };

    it('should return royalty chart data', async () => {
      httpService.get.mockReturnValue(of({ data: mockChartData }) as any);

      const result = await service.getMyRoyaltyChartData('peer-123', {});

      expect(result).toEqual(mockChartData);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://indexer-api/analytics/royalty-chart',
        { params: { creatorPeerId: 'peer-123' } },
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.getMyRoyaltyChartData('peer-123', {}),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
