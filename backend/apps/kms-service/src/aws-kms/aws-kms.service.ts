import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import { randomBytes } from 'crypto';

export interface KmsKeyInfo {
  keyId: string;
  alias: string;
  region: string;
  status: 'Active' | 'PendingDeletion' | 'Disabled';
  creationDate: Date;
  lastUsedDate?: Date;
}

export interface KmsKeyPool {
  keys: KmsKeyInfo[];
  currentActiveKeys: string[];
  rotationSchedule: {
    enabled: boolean;
    intervalMonths: number;
  };
}

export interface EncryptionResult {
  encryptedData: Buffer;
  kmsKeyId: string;
  kmsRegion: string;
}

@Injectable()
export class AwsKmsService {
  private readonly logger = new Logger(AwsKmsService.name);
  private readonly kmsClient: KMSClient;
  private readonly keyPool: KmsKeyPool;
  private readonly keyAliasPrefix: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.getOrThrow<string>('AWS_REGION');
    this.keyAliasPrefix = this.configService.getOrThrow<string>(
      'KMS_KEY_ALIAS_PREFIX',
    );

    this.kmsClient = new KMSClient({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });

    this.keyPool = {
      keys: [],
      currentActiveKeys: [],
      rotationSchedule: {
        enabled: true,
        intervalMonths: 12,
      },
    };

    void this.initializeKeyPool();
  }

  /**
   * Initialize the KMS key pool by discovering available keys
   */
  private async initializeKeyPool(): Promise<void> {
    try {
      const poolSize = this.configService.get<number>('KMS_KEY_POOL_SIZE', 10);

      // In a real implementation, you would discover existing keys
      // For now, we'll generate key aliases based on the pool size
      for (let i = 1; i <= poolSize; i++) {
        const alias = `${this.keyAliasPrefix}-${i}`;
        const keyId = `alias/${alias}`;

        try {
          const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
          const response = await this.kmsClient.send(describeCommand);

          if (response.KeyMetadata) {
            this.keyPool.keys.push({
              keyId: response.KeyMetadata.KeyId!,
              alias: alias,
              region: this.region,
              status:
                response.KeyMetadata.KeyState === 'Enabled'
                  ? 'Active'
                  : 'Disabled',
              creationDate: response.KeyMetadata.CreationDate!,
            });

            if (response.KeyMetadata.KeyState === 'Enabled') {
              this.keyPool.currentActiveKeys.push(response.KeyMetadata.KeyId!);
            }
          }
        } catch (error) {
          this.logger.warn(
            `Key ${alias} not found or not accessible: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(
        `Initialized KMS key pool with ${this.keyPool.currentActiveKeys.length} active keys`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize KMS key pool:', error);
      throw new Error('KMS key pool initialization failed');
    }
  }

  /**
   * Select a random KMS key from the active pool
   */
  private selectRandomKey(): string {
    if (this.keyPool.currentActiveKeys.length === 0) {
      throw new Error('No active KMS keys available');
    }

    const randomIndex = Math.floor(
      Math.random() * this.keyPool.currentActiveKeys.length,
    );
    const selectedKeyId = this.keyPool.currentActiveKeys[randomIndex];

    // Update last used date
    const keyInfo = this.keyPool.keys.find((k) => k.keyId === selectedKeyId);
    if (keyInfo) {
      keyInfo.lastUsedDate = new Date();
    }

    return selectedKeyId;
  }

  /**
   * Encrypt data using AWS KMS
   */
  async encryptData(data: Buffer, keyId?: string): Promise<EncryptionResult> {
    try {
      const selectedKeyId = keyId || this.selectRandomKey();

      const command = new EncryptCommand({
        KeyId: selectedKeyId,
        Plaintext: data,
        // Don't specify EncryptionAlgorithm for symmetric keys (AES)
      });

      const response = await this.kmsClient.send(command);

      if (!response.CiphertextBlob) {
        throw new Error('Encryption failed: No ciphertext returned');
      }

      this.logger.debug(`Data encrypted using KMS key: ${selectedKeyId}`);

      return {
        encryptedData: Buffer.from(response.CiphertextBlob),
        kmsKeyId: selectedKeyId,
        kmsRegion: this.region,
      };
    } catch (error) {
      this.logger.error('KMS encryption failed:', error);
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Decrypt data using AWS KMS
   */
  async decryptData(encryptedData: Buffer, keyId: string): Promise<Buffer> {
    try {
      const command = new DecryptCommand({
        CiphertextBlob: encryptedData,
        KeyId: keyId,
        // Don't specify EncryptionAlgorithm for symmetric keys (AES)
      });

      const response = await this.kmsClient.send(command);

      if (!response.Plaintext) {
        throw new Error('Decryption failed: No plaintext returned');
      }

      this.logger.debug(`Data decrypted using KMS key: ${keyId}`);

      return Buffer.from(response.Plaintext);
    } catch (error) {
      this.logger.error('KMS decryption failed:', error);
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Generate a data encryption key (DEK) and encrypt it with KMS
   * This is used for envelope encryption where we encrypt the DEK with KMS
   * and use the DEK to encrypt the actual data
   */
  async generateAndEncryptDek(keyId?: string): Promise<{
    dek: Buffer;
    encryptedDek: EncryptionResult;
  }> {
    try {
      const dek = randomBytes(32); // 256-bit DEK
      const encryptedDek = await this.encryptData(dek, keyId);

      return {
        dek,
        encryptedDek,
      };
    } catch (error) {
      this.logger.error('Failed to generate and encrypt DEK:', error);
      throw new Error(
        `DEK generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Decrypt a DEK that was encrypted with KMS
   */
  async decryptDek(encryptedDek: Buffer, keyId: string): Promise<Buffer> {
    return this.decryptData(encryptedDek, keyId);
  }

  /**
   * Get information about a specific KMS key
   */
  async getKeyInfo(keyId: string): Promise<KmsKeyInfo | null> {
    try {
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await this.kmsClient.send(command);

      if (!response.KeyMetadata) {
        return null;
      }

      return {
        keyId: response.KeyMetadata.KeyId!,
        alias: response.KeyMetadata.Description || 'Unknown',
        region: this.region,
        status:
          response.KeyMetadata.KeyState === 'Enabled' ? 'Active' : 'Disabled',
        creationDate: response.KeyMetadata.CreationDate!,
      };
    } catch (error) {
      this.logger.error(`Failed to get key info for ${keyId}:`, error);
      return null;
    }
  }

  /**
   * Get the current key pool status
   */
  getKeyPoolStatus(): KmsKeyPool {
    return {
      ...this.keyPool,
      keys: [...this.keyPool.keys], // Return a copy
      currentActiveKeys: [...this.keyPool.currentActiveKeys], // Return a copy
    };
  }

  /**
   * Refresh the key pool by re-discovering keys
   */
  async refreshKeyPool(): Promise<void> {
    this.logger.log('Refreshing KMS key pool...');
    this.keyPool.keys = [];
    this.keyPool.currentActiveKeys = [];
    await this.initializeKeyPool();
  }

  /**
   * Check if a key is available and active
   */
  async isKeyAvailable(keyId: string): Promise<boolean> {
    const keyInfo = await this.getKeyInfo(keyId);
    return keyInfo?.status === 'Active';
  }
}
