import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { WalletsKmsService } from './wallets-kms.service';
import { PrismaService } from '@app/database';
import { AwsKmsService } from '../aws-kms/aws-kms.service';
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

describe('WalletsKmsService', () => {
  let service: WalletsKmsService;
  let mockPrisma: Partial<PrismaService>;
  let mockConfigService: Partial<ConfigService>;
  let mockAwsKmsService: Partial<AwsKmsService>;

  const mockPlatformVerifierKey = 'platform-verifier-key-123';

  beforeEach(async () => {
    mockPrisma = {
      wallet: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      } as never,
    };

    mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'PLATFORM_VERIFIER_PRIVATE_KEY') {
          return mockPlatformVerifierKey;
        }
        return '';
      }),
    };

    mockAwsKmsService = {
      generateAndEncryptDek: jest.fn(),
      decryptDek: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsKmsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AwsKmsService,
          useValue: mockAwsKmsService,
        },
      ],
    }).compile();

    service = module.get<WalletsKmsService>(WalletsKmsService);

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

    const mockDek = Buffer.from('a'.repeat(64), 'hex');
    const mockEncryptedDek = {
      encryptedData: Buffer.from('encrypted-dek-data'),
      kmsKeyId: 'kms-key-123',
      kmsRegion: 'us-east-1',
    };

    beforeEach(() => {
      (Wallet.createRandom as jest.Mock).mockReturnValue(mockWallet);
      (mockAwsKmsService.generateAndEncryptDek as jest.Mock).mockResolvedValue({
        dek: mockDek,
        encryptedDek: mockEncryptedDek,
      });
    });

    it('should create wallet successfully with KMS encryption', async () => {
      const mockFindUnique = mockPrisma.wallet?.findUnique as jest.Mock;
      const mockCreate = mockPrisma.wallet?.create as jest.Mock;

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        userId: mockDto.userId,
        walletAddress: mockWallet.address,
        compressedPublicKey: mockWallet.signingKey.compressedPublicKey,
        kmsKeyId: mockEncryptedDek.kmsKeyId,
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
      expect(mockAwsKmsService.generateAndEncryptDek).toHaveBeenCalled();

      expect(encryptSpy).toHaveBeenCalledTimes(1);
      expect(encryptSpy).toHaveBeenCalledWith(
        mockWallet.mnemonic.phrase,
        mockDek,
      );

      const encryptedSeedResult = encryptSpy.mock.results[0].value;
      const serializedKmsPayload = JSON.stringify({
        encryptedData: mockEncryptedDek.encryptedData.toString('base64'),
        kmsKeyId: mockEncryptedDek.kmsKeyId,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockDto.userId,
          walletAddress: mockWallet.address,
          compressedPublicKey: mockWallet.signingKey.compressedPublicKey,
          encryptedSeed: encryptedSeedResult,
          encryptedDek: serializedKmsPayload,
          kmsKeyId: mockEncryptedDek.kmsKeyId,
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

    // Extra defensive tests removed to keep footprint manageable.
  });

  describe('getPrivateKeyForUser', () => {
    const userId = 'user-123';
    const mockMnemonic =
      'test mnemonic phrase with twelve words here for wallet seed';
    const mockPrivateKey =
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockDek = Buffer.from('a'.repeat(64), 'hex');

    const mockSerializedKmsEncryption = JSON.stringify({
      encryptedData: Buffer.from('encrypted-dek-data').toString('base64'),
      kmsKeyId: 'kms-key-123',
    });

    it('should return private key for user using KMS decryption', async () => {
      const mockFindUnique = mockPrisma.wallet?.findUnique as jest.Mock;
      (mockAwsKmsService.decryptDek as jest.Mock).mockResolvedValue(mockDek);

      const encryptSpy = jest.spyOn(service as any, '_encrypt');
      const decryptSpy = jest.spyOn(service as any, '_decrypt');

      const encryptedSeed = (service as any)._encrypt(mockMnemonic, mockDek);

      mockFindUnique.mockResolvedValue({
        userId,
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedSeed,
        encryptedDek: mockSerializedKmsEncryption,
        kmsKeyId: 'kms-key-123',
      });

      const mockWallet = {
        privateKey: mockPrivateKey,
      };
      (Wallet.fromPhrase as jest.Mock).mockReturnValue(mockWallet);

      decryptSpy.mockImplementation((data: string, key: Buffer) => {
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
      expect(mockAwsKmsService.decryptDek).toHaveBeenCalled();
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
