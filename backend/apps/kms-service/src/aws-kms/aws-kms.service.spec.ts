import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AwsKmsService } from './aws-kms.service';
import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';

jest.mock('@aws-sdk/client-kms');

describe('AwsKmsService', () => {
  let service: AwsKmsService;
  let mockKmsClient: {
    send: jest.Mock<Promise<unknown>, [unknown]>;
  };
  let mockConfigService: Partial<ConfigService>;

  const mockConfig: Record<string, string | number> = {
    AWS_REGION: 'us-east-1',
    KMS_KEY_ALIAS_PREFIX: 'Empressa-kms',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    KMS_KEY_POOL_SIZE: 3,
  };

  beforeEach(() => {
    mockConfigService = {
      getOrThrow: jest.fn((key: string) => mockConfig[key] as string),
      get: jest.fn((key: string, defaultValue?: any) =>
        mockConfig[key] !== undefined ? mockConfig[key] : defaultValue,
      ),
    };

    mockKmsClient = {
      send: jest.fn<Promise<unknown>, [unknown]>(),
    };

    (KMSClient as jest.Mock).mockImplementation(() => mockKmsClient);

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize KMS client with correct credentials', async () => {
      await Test.createTestingModule({
        providers: [
          AwsKmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      expect(KMSClient).toHaveBeenCalledWith({
        region: mockConfig.AWS_REGION,
        credentials: {
          accessKeyId: mockConfig.AWS_ACCESS_KEY_ID,
          secretAccessKey: mockConfig.AWS_SECRET_ACCESS_KEY,
        },
      });
    });

    it('should initialize key pool with correct aliases and rotation schedule', async () => {
      mockKmsClient.send
        .mockResolvedValueOnce({
          KeyMetadata: {
            KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-1',
            KeyState: 'Enabled',
            CreationDate: new Date('2024-01-01'),
          },
        })
        .mockResolvedValueOnce({
          KeyMetadata: {
            KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-2',
            KeyState: 'Enabled',
            CreationDate: new Date('2024-01-01'),
          },
        })
        .mockResolvedValueOnce({
          KeyMetadata: {
            KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-3',
            KeyState: 'Enabled',
            CreationDate: new Date('2024-01-01'),
          },
        });

      const module = await Test.createTestingModule({
        providers: [
          AwsKmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<AwsKmsService>(AwsKmsService);

      await service['initializeKeyPool']();

      const keyPool = service.getKeyPoolStatus();
      expect(keyPool.currentActiveKeys).toEqual([
        'arn:aws:kms:us-east-1:123456789012:key/test-key-1',
        'arn:aws:kms:us-east-1:123456789012:key/test-key-2',
        'arn:aws:kms:us-east-1:123456789012:key/test-key-3',
      ]);
      expect(keyPool.rotationSchedule).toEqual({
        enabled: true,
        intervalMonths: 12,
      });
    });
  });

  describe('encryptData', () => {
    beforeEach(async () => {
      const mockDescribeResponse = {
        KeyMetadata: {
          KeyId: 'key-123',
          KeyState: 'Enabled',
          CreationDate: new Date(),
        },
      };

      mockKmsClient.send.mockResolvedValue(mockDescribeResponse);

      const module = await Test.createTestingModule({
        providers: [
          AwsKmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<AwsKmsService>(AwsKmsService);

      const initializeKeyPoolSpy = jest.spyOn(
        service as any,
        'initializeKeyPool',
      );
      if (!initializeKeyPoolSpy.mock.calls.length) {
        await service['initializeKeyPool']();
      }

      jest.clearAllMocks();
    });

    it('should encrypt data successfully with specified key', async () => {
      const data = Buffer.from('test data');
      const keyId = 'key-123';
      const mockCiphertext = new Uint8Array([1, 2, 3, 4]);

      mockKmsClient.send.mockResolvedValue({
        CiphertextBlob: mockCiphertext,
      });

      const result = await service.encryptData(data, keyId);

      expect(result).toEqual({
        encryptedData: Buffer.from(mockCiphertext),
        kmsKeyId: keyId,
        kmsRegion: mockConfig.AWS_REGION,
      });
      expect(EncryptCommand).toHaveBeenCalledWith({
        KeyId: keyId,
        Plaintext: data,
      });
      expect(mockKmsClient.send).toHaveBeenCalledWith(
        expect.any(EncryptCommand),
      );
    });

    it('should encrypt data with random key from pool when no key specified', async () => {
      const data = Buffer.from('test data');
      const mockCiphertext = new Uint8Array([1, 2, 3, 4]);
      const expectedKeyId = 'key-123';

      jest
        .spyOn(service as any, 'selectRandomKey')
        .mockReturnValue(expectedKeyId);

      mockKmsClient.send.mockResolvedValue({
        CiphertextBlob: mockCiphertext,
      });

      const result = await service.encryptData(data);

      expect(service['selectRandomKey']).toHaveBeenCalled();
      expect(result.encryptedData).toEqual(Buffer.from(mockCiphertext));
      expect(result.kmsKeyId).toBe(expectedKeyId);
      expect(result.kmsRegion).toBe(mockConfig.AWS_REGION);
      expect(EncryptCommand).toHaveBeenCalledWith({
        KeyId: expectedKeyId,
        Plaintext: data,
      });
      expect(mockKmsClient.send).toHaveBeenCalled();
    });

    it('should throw error when no ciphertext is returned', async () => {
      const data = Buffer.from('test data');
      const keyId = 'key-123';

      mockKmsClient.send.mockResolvedValue({
        CiphertextBlob: null,
      });

      await expect(service.encryptData(data, keyId)).rejects.toThrow(
        'Encryption failed: No ciphertext returned',
      );
    });

    it('should throw error when KMS encryption fails', async () => {
      const data = Buffer.from('test data');
      const keyId = 'key-123';

      mockKmsClient.send.mockRejectedValue(new Error('KMS error'));

      await expect(service.encryptData(data, keyId)).rejects.toThrow(
        'Encryption failed: KMS error',
      );
    });

    it('should throw error when no active keys available', async () => {
      const freshModule = await Test.createTestingModule({
        providers: [
          AwsKmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const freshService = freshModule.get<AwsKmsService>(AwsKmsService);

      jest
        .spyOn(freshService as any, 'selectRandomKey')
        .mockImplementation(() => {
          throw new Error('No active keys available');
        });

      const data = Buffer.from('test data');

      await expect(freshService.encryptData(data)).rejects.toThrow(
        'No active keys available',
      );
    });
  });

  describe('decryptData', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          AwsKmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<AwsKmsService>(AwsKmsService);

      jest.clearAllMocks();
    });

    it('should decrypt data successfully', async () => {
      const encryptedData = Buffer.from([1, 2, 3, 4]);
      const keyId = 'key-123';
      const mockPlaintext = new Uint8Array([5, 6, 7, 8]);

      mockKmsClient.send.mockResolvedValue({
        Plaintext: mockPlaintext,
      });

      const result = await service.decryptData(encryptedData, keyId);

      expect(result).toEqual(Buffer.from(mockPlaintext));
      expect(DecryptCommand).toHaveBeenCalledWith({
        KeyId: keyId,
        CiphertextBlob: encryptedData,
      });
      expect(mockKmsClient.send).toHaveBeenCalledWith(
        expect.any(DecryptCommand),
      );
    });

    it('should throw error when no plaintext is returned', async () => {
      const encryptedData = Buffer.from([1, 2, 3, 4]);
      const keyId = 'key-123';

      mockKmsClient.send.mockResolvedValue({
        Plaintext: null,
      });

      await expect(service.decryptData(encryptedData, keyId)).rejects.toThrow(
        'Decryption failed: No plaintext returned',
      );
    });

    it('should throw error when KMS decryption fails', async () => {
      const encryptedData = Buffer.from([1, 2, 3, 4]);
      const keyId = 'key-123';

      mockKmsClient.send.mockRejectedValue(new Error('Invalid ciphertext'));

      await expect(service.decryptData(encryptedData, keyId)).rejects.toThrow(
        'Decryption failed: Invalid ciphertext',
      );
    });
  });

  describe('generateAndEncryptDek', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          AwsKmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<AwsKmsService>(AwsKmsService);

      jest.clearAllMocks();
    });

    it('should generate and encrypt DEK successfully', async () => {
      const keyId = 'key-123';
      const mockCiphertext = new Uint8Array([1, 2, 3, 4]);

      mockKmsClient.send.mockResolvedValue({
        CiphertextBlob: mockCiphertext,
      });

      const encryptDataSpy = jest.spyOn(service, 'encryptData');

      const result = await service.generateAndEncryptDek(keyId);

      expect(result.dek).toBeInstanceOf(Buffer);
      expect(result.dek).toHaveLength(32);
      expect(result.encryptedDek.encryptedData).toEqual(
        Buffer.from(mockCiphertext),
      );
      expect(result.encryptedDek.kmsKeyId).toBe(keyId);
      expect(encryptDataSpy).toHaveBeenCalledWith(result.dek, keyId);
      expect(encryptDataSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw error when encryption fails', async () => {
      const keyId = 'key-123';

      mockKmsClient.send.mockRejectedValue(new Error('Encryption failed'));

      await expect(service.generateAndEncryptDek(keyId)).rejects.toThrow(
        'DEK generation failed',
      );
    });
  });

  describe('decryptDek', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          AwsKmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<AwsKmsService>(AwsKmsService);

      jest.clearAllMocks();
    });

    it('should decrypt DEK successfully', async () => {
      const encryptedDek = Buffer.from([1, 2, 3, 4]);
      const keyId = 'key-123';
      const mockPlaintext = new Uint8Array([5, 6, 7, 8]);

      mockKmsClient.send.mockResolvedValue({
        Plaintext: mockPlaintext,
      });

      const result = await service.decryptDek(encryptedDek, keyId);

      expect(result).toEqual(Buffer.from(mockPlaintext));
    });
  });

  describe('getKeyInfo', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          AwsKmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<AwsKmsService>(AwsKmsService);

      jest.clearAllMocks();
    });

    it('should return key info when key exists', async () => {
      const keyId = 'key-123';
      const mockResponse = {
        KeyMetadata: {
          KeyId: keyId,
          Description: 'Test Key',
          KeyState: 'Enabled',
          CreationDate: new Date('2024-01-01'),
        },
      };

      mockKmsClient.send.mockResolvedValue(mockResponse);

      const result = await service.getKeyInfo(keyId);

      expect(result).toEqual({
        keyId,
        alias: 'Test Key',
        region: mockConfig.AWS_REGION,
        status: 'Active',
        creationDate: mockResponse.KeyMetadata.CreationDate,
      });
    });

    it('should return null when key metadata is missing', async () => {
      const keyId = 'key-123';

      mockKmsClient.send.mockResolvedValue({
        KeyMetadata: null,
      });

      const result = await service.getKeyInfo(keyId);

      expect(result).toBeNull();
    });

    it('should return null when KMS call fails', async () => {
      const keyId = 'key-123';

      mockKmsClient.send.mockRejectedValue(new Error('Key not found'));

      const result = await service.getKeyInfo(keyId);

      expect(result).toBeNull();
    });

    it('should return Disabled status for disabled keys', async () => {
      const keyId = 'key-123';
      const mockResponse = {
        KeyMetadata: {
          KeyId: keyId,
          Description: 'Disabled Key',
          KeyState: 'Disabled',
          CreationDate: new Date('2024-01-01'),
        },
      };

      mockKmsClient.send.mockResolvedValue(mockResponse);

      const result = await service.getKeyInfo(keyId);

      expect(result?.status).toBe('Disabled');
    });
  });

  describe('isKeyAvailable', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          AwsKmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<AwsKmsService>(AwsKmsService);

      jest.clearAllMocks();
    });

    it('should return true when key is active', async () => {
      const keyId = 'key-123';
      const mockResponse = {
        KeyMetadata: {
          KeyId: keyId,
          KeyState: 'Enabled',
          CreationDate: new Date(),
        },
      };

      mockKmsClient.send.mockResolvedValue(mockResponse);

      const result = await service.isKeyAvailable(keyId);

      expect(result).toBe(true);
    });

    it('should return false when key is disabled', async () => {
      const keyId = 'key-123';
      const mockResponse = {
        KeyMetadata: {
          KeyId: keyId,
          KeyState: 'Disabled',
          CreationDate: new Date(),
        },
      };

      mockKmsClient.send.mockResolvedValue(mockResponse);

      const result = await service.isKeyAvailable(keyId);

      expect(result).toBe(false);
    });

    it('should return false when key info cannot be retrieved', async () => {
      const keyId = 'key-123';

      mockKmsClient.send.mockRejectedValue(new Error('Key not found'));

      const result = await service.isKeyAvailable(keyId);

      expect(result).toBe(false);
    });
  });
});
