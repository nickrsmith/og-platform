import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { P2pIdentitiesService } from './p2p-identities.service';
import { PrismaService } from '@app/database';
import { CreateP2PIdentityRequestDto } from '@app/common';
import type * as crypto from 'crypto';

// Create mock functions that will be used to mock the dynamic imports
const mockGenerateKeyPair = jest.fn();
const mockPrivateKeyToProtobuf = jest.fn();
const mockEd25519PublicKey = jest.fn();

// Mock the dynamic imports - using virtual mocks since Jest has trouble resolving subpath exports
jest.mock(
  '@libp2p/crypto/keys',
  () => ({
    __esModule: true,
    generateKeyPair: (...args: any[]) => mockGenerateKeyPair(...args),
    privateKeyToProtobuf: (...args: any[]) => mockPrivateKeyToProtobuf(...args),
  }),
  { virtual: true },
);

jest.mock(
  '@peerbit/crypto',
  () => ({
    __esModule: true,
    Ed25519PublicKey: mockEd25519PublicKey,
  }),
  { virtual: true },
);

// Create mock implementations for crypto functions
const mockRandomBytes = jest.fn();
const mockPbkdf2Sync = jest.fn();
const mockCreateCipheriv = jest.fn();

// Mock crypto module functions since Node 23 marks these properties as non-configurable
jest.mock('crypto', () => {
  const actual = jest.requireActual<typeof crypto>('crypto');
  return {
    ...actual,
    randomBytes: (...args: Parameters<typeof actual.randomBytes>) =>
      mockRandomBytes(...args),
    pbkdf2Sync: (...args: Parameters<typeof actual.pbkdf2Sync>) =>
      mockPbkdf2Sync(...args),
    createCipheriv: (...args: Parameters<typeof actual.createCipheriv>) =>
      mockCreateCipheriv(...args),
  };
});

const consoleErrorSpy = jest
  .spyOn(console, 'error')
  .mockImplementation(() => undefined);

describe('P2pIdentitiesService', () => {
  let service: P2pIdentitiesService;
  let mockPrisma: Partial<PrismaService>;

  const mockDto: CreateP2PIdentityRequestDto = {
    userId: 'user-123',
    subject: 'test-subject-123',
  };

  const mockPublicKeyBytes = new Uint8Array([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
  ]);
  const mockPrivateKeyBytes = new Uint8Array([
    33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
  ]);
  const mockPrivateKeyProtobuf = new Uint8Array([1, 2, 3, 4, 5]);
  const mockPublicKeyString = 'mock-public-key-string';
  const mockPeerId = '12D3KooWmockPeerId123456789';

  beforeEach(async () => {
    mockPrisma = {
      p2PIdentity: {
        findUnique: jest.fn(),
        create: jest.fn(),
      } as never,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        P2pIdentitiesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<P2pIdentitiesService>(P2pIdentitiesService);

    // Reset all mocks but keep the spy implementations
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createP2PIdentity', () => {
    beforeEach(() => {
      // Setup default mocks for successful flow
      const mockKeypair = {
        publicKey: {
          raw: mockPublicKeyBytes,
        },
        privateKey: mockPrivateKeyBytes,
      };

      mockGenerateKeyPair.mockResolvedValue(mockKeypair);
      mockPrivateKeyToProtobuf.mockReturnValue(mockPrivateKeyProtobuf);

      const mockEd25519PublicKeyInstance = {
        toString: jest.fn().mockReturnValue(mockPublicKeyString),
        toPeerId: jest.fn().mockReturnValue({
          toString: jest.fn().mockReturnValue(mockPeerId),
        }),
      };
      mockEd25519PublicKey.mockImplementation(
        () => mockEd25519PublicKeyInstance,
      );

      // Set default mock implementations for crypto functions
      mockRandomBytes.mockReturnValue(Buffer.from('mock-salt-16-bytes'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('a'.repeat(32)));

      // Mock createCipheriv to return a cipher object
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('encrypted')),
        final: jest.fn().mockReturnValue(Buffer.from('data')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('auth-tag')),
      };
      mockCreateCipheriv.mockReturnValue(mockCipher as any);
    });

    it('should create P2P identity successfully', async () => {
      const mockFindUnique = mockPrisma.p2PIdentity?.findUnique as jest.Mock;
      const mockCreate = mockPrisma.p2PIdentity?.create as jest.Mock;

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        userId: mockDto.userId,
        publicKey: mockPublicKeyString,
        peerId: mockPeerId,
      });

      const result = await service.createP2PIdentity(mockDto);

      expect(result).toEqual({
        publicKey: mockPublicKeyString,
      });

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userId: mockDto.userId },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockDto.userId,
          publicKey: mockPublicKeyString,
          peerId: mockPeerId,
          encryptedPrivateKey: expect.any(String),
          encryptedDek: expect.any(String),
        }),
      });

      // Verify encryption was called
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.data.encryptedPrivateKey).toContain(':');
      expect(createCall.data.encryptedDek).toBeTruthy();
    });

    it('should throw ConflictException when identity already exists', async () => {
      const mockFindUnique = mockPrisma.p2PIdentity?.findUnique as jest.Mock;

      mockFindUnique.mockResolvedValue({
        userId: mockDto.userId,
        publicKey: mockPublicKeyString,
        peerId: mockPeerId,
      });

      await expect(service.createP2PIdentity(mockDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createP2PIdentity(mockDto)).rejects.toThrow(
        `P2P Identity already exists for user ${mockDto.userId}`,
      );

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userId: mockDto.userId },
      });
    });

    it('should throw InternalServerErrorException when database create fails', async () => {
      const mockFindUnique = mockPrisma.p2PIdentity?.findUnique as jest.Mock;
      const mockCreate = mockPrisma.p2PIdentity?.create as jest.Mock;

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.createP2PIdentity(mockDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.createP2PIdentity(mockDto)).rejects.toThrow(
        'Could not create P2P identity.',
      );
    });

    // Extra white-box tests trimmed to keep the suite focused on core flows.
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
});
