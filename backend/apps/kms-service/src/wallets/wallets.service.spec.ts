import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { PrismaService } from '@app/database';
import { CreateWalletRequestDto } from '@app/common';
import { Wallet } from 'ethers';

jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');
  return {
    ...originalModule,
    Wallet: {
      createRandom: jest.fn(),
      fromPhrase: jest.fn(),
    },
  };
});

const consoleErrorSpy = jest
  .spyOn(console, 'error')
  .mockImplementation(() => undefined);

describe('WalletsService', () => {
  let service: WalletsService;
  let mockPrisma: Partial<PrismaService>;
  let mockConfigService: Partial<ConfigService>;

  const mockKek = 'a'.repeat(64);
  const mockPlatformVerifierKey = 'platform-verifier-key-123';

  beforeEach(async () => {
    mockPrisma = {
      wallet: {
        findUnique: jest.fn(),
        create: jest.fn(),
      } as never,
    };

    mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'MASTER_KEK') {
          return mockKek;
        }
        if (key === 'PLATFORM_VERIFIER_PRIVATE_KEY') {
          return mockPlatformVerifierKey;
        }
        return '';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);

    jest.clearAllMocks();
  });

  describe('getPlatformVerifierKey', () => {
    it('should return platform verifier private key', () => {
      const result = service.getPlatformVerifierKey();

      expect(result).toBe(mockPlatformVerifierKey);
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith(
        'PLATFORM_VERIFIER_PRIVATE_KEY',
      );
    });
  });

  describe('createWallet', () => {
    const mockDto: CreateWalletRequestDto = {
      userId: 'user-123',
    };

    const mockWallet = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      privateKey:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      mnemonic: {
        phrase: 'test mnemonic phrase with twelve words here for wallet seed',
      },
      signingKey: {
        compressedPublicKey:
          '0x02abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
    };

    beforeEach(() => {
      (Wallet.createRandom as jest.Mock).mockReturnValue(mockWallet);
    });

    it('should create wallet successfully', async () => {
      const mockFindUnique = mockPrisma.wallet?.findUnique as jest.Mock;
      const mockCreate = mockPrisma.wallet?.create as jest.Mock;

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        userId: mockDto.userId,
        walletAddress: mockWallet.address,
        compressedPublicKey: mockWallet.signingKey.compressedPublicKey,
      });

      const encryptSpy = jest.spyOn(service as any, '_encrypt');

      const result = await service.createWallet(mockDto);

      expect(result).toEqual({
        walletAddress: mockWallet.address,
        compressedPublicKey: mockWallet.signingKey.compressedPublicKey,
      });
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userId: mockDto.userId },
      });

      expect(encryptSpy).toHaveBeenCalledTimes(2);
      expect(encryptSpy).toHaveBeenNthCalledWith(
        1,
        mockWallet.mnemonic.phrase,
        expect.any(Buffer),
      );
      expect(encryptSpy).toHaveBeenNthCalledWith(
        2,
        expect.any(Buffer),
        expect.any(Buffer),
      );

      const encryptedSeedResult = encryptSpy.mock.results[0].value;
      const encryptedDekResult = encryptSpy.mock.results[1].value;

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockDto.userId,
          walletAddress: mockWallet.address,
          compressedPublicKey: mockWallet.signingKey.compressedPublicKey,
          encryptedSeed: encryptedSeedResult,
          encryptedDek: encryptedDekResult,
        }),
      });
    });

    it('should throw ConflictException when user already has wallet', async () => {
      const mockFindUnique = mockPrisma.wallet?.findUnique as jest.Mock;

      mockFindUnique.mockResolvedValue({
        userId: mockDto.userId,
        walletAddress: '0x123',
      });

      await expect(service.createWallet(mockDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createWallet(mockDto)).rejects.toThrow(
        `User ${mockDto.userId} already has a wallet.`,
      );
    });

    it('should throw InternalServerErrorException when mnemonic is missing', async () => {
      const mockFindUnique = mockPrisma.wallet?.findUnique as jest.Mock;

      mockFindUnique.mockResolvedValue(null);
      (Wallet.createRandom as jest.Mock).mockReturnValue({
        ...mockWallet,
        mnemonic: null,
      });

      await expect(service.createWallet(mockDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getPrivateKeyForUser', () => {
    const userId = 'user-123';
    const mockMnemonic =
      'test mnemonic phrase with twelve words here for wallet seed';
    const mockPrivateKey =
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    const mockWalletRecord = {
      userId,
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      encryptedSeed: 'encrypted-seed-data',
      encryptedDek: 'encrypted-dek-data',
    };

    it('should return private key for user', async () => {
      const mockFindUnique = mockPrisma.wallet?.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockWalletRecord);

      const mockWallet = {
        privateKey: mockPrivateKey,
      };
      (Wallet.fromPhrase as jest.Mock).mockReturnValue(mockWallet);

      const encryptSpy = jest.spyOn(service as any, '_encrypt');
      const decryptSpy = jest.spyOn(service as any, '_decrypt');

      const dek = Buffer.from('a'.repeat(64), 'hex');
      const encryptedDek = (service as any)._encrypt(dek, (service as any).kek);
      const encryptedSeed = (service as any)._encrypt(mockMnemonic, dek);

      mockFindUnique.mockResolvedValue({
        ...mockWalletRecord,
        encryptedDek,
        encryptedSeed,
      });

      decryptSpy.mockImplementation((data: string, key: Buffer) => {
        if (data === encryptedDek) {
          return dek;
        }
        if (data === encryptedSeed) {
          return Buffer.from(mockMnemonic, 'utf-8');
        }
        throw new Error('Unexpected decrypt call');
      });

      const result = await service.getPrivateKeyForUser(userId);

      expect(result).toBe(mockPrivateKey);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(Wallet.fromPhrase).toHaveBeenCalledWith(mockMnemonic);

      encryptSpy.mockRestore();
      decryptSpy.mockRestore();
    });

    it('should throw NotFoundException when wallet not found', async () => {
      const mockFindUnique = mockPrisma.wallet?.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(null);

      await expect(service.getPrivateKeyForUser(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getPrivateKeyForUser(userId)).rejects.toThrow(
        `Wallet not found for user ${userId}`,
      );
    });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
});
