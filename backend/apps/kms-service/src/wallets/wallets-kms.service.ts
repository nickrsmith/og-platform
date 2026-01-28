import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/database';
import { AwsKmsService, EncryptionResult } from '../aws-kms/aws-kms.service';
import { Wallet } from 'ethers';
import * as crypto from 'crypto';
import { CreateWalletRequestDto, CreateWalletResponseDto } from '@app/common';

interface SerializedKmsEncryption {
  encryptedData: string;
  kmsKeyId: string;
  encryptionVersion?: string;
}

interface DeserializedKmsEncryption {
  encryptedData: Buffer;
  kmsKeyId: string;
  encryptionVersion?: string;
}

@Injectable()
export class WalletsKmsService {
  private readonly logger = new Logger(WalletsKmsService.name);
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly awsKmsService: AwsKmsService,
  ) {}

  getPlatformVerifierKey(): string {
    this.logger.log(
      'Serving platform verifier private key to internal service.',
    );
    return this.configService.getOrThrow<string>(
      'PLATFORM_VERIFIER_PRIVATE_KEY',
    );
  }

  async createWallet(
    createWalletRequestDto: CreateWalletRequestDto,
  ): Promise<CreateWalletResponseDto> {
    const { userId } = createWalletRequestDto;
    const existingWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (existingWallet) {
      throw new ConflictException(`User ${userId} already has a wallet.`);
    }

    const wallet = Wallet.createRandom();

    if (!wallet.mnemonic) {
      throw new InternalServerErrorException(
        'Failed to generate wallet mnemonic.',
      );
    }
    const mnemonic = wallet.mnemonic.phrase;

    // KMS-based encryption (only method)
    const { dek, encryptedDek: kmsEncryptedDek } =
      await this.awsKmsService.generateAndEncryptDek();

    const encryptedSeed = this._encrypt(mnemonic, dek);
    const encryptedDek = this._serializeKmsEncryption(kmsEncryptedDek);

    try {
      await this.prisma.wallet.create({
        data: {
          userId,
          walletAddress: wallet.address,
          compressedPublicKey: wallet.signingKey.compressedPublicKey,
          encryptedSeed,
          encryptedDek,
          kmsKeyId: kmsEncryptedDek.kmsKeyId,
        },
      });

      this.logger.log(`Wallet created for user ${userId} using KMS encryption`);

      return {
        walletAddress: wallet.address,
        compressedPublicKey: wallet.signingKey.compressedPublicKey,
      };
    } catch (error) {
      console.error('Failed to create wallet in DB:', error);
      throw new InternalServerErrorException('Could not create wallet.');
    }
  }

  async getPrivateKeyForUser(userId: string): Promise<string> {
    this.logger.log(`Internal request for private key of user ${userId}`);
    const walletRecord = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!walletRecord) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }

    // KMS-based decryption (only method)
    const kmsEncryption = this._deserializeKmsEncryption(
      walletRecord.encryptedDek,
    );
    const dek = await this.awsKmsService.decryptDek(
      kmsEncryption.encryptedData,
      kmsEncryption.kmsKeyId,
    );

    // Decrypt the wallet's seed phrase (mnemonic) using the DEK
    const mnemonic = this._decrypt(walletRecord.encryptedSeed, dek).toString(
      'utf-8',
    );

    // Reconstruct the wallet from the mnemonic to get the private key
    const wallet = Wallet.fromPhrase(mnemonic);
    return wallet.privateKey;
  }

  /**
   * Serialize KMS encryption result for database storage
   */
  private _serializeKmsEncryption(
    encryptionResult: EncryptionResult & { encryptionVersion?: string },
  ): string {
    return JSON.stringify({
      encryptedData: encryptionResult.encryptedData.toString('base64'),
      kmsKeyId: encryptionResult.kmsKeyId,
      encryptionVersion: encryptionResult.encryptionVersion,
    } as SerializedKmsEncryption);
  }

  /**
   * Deserialize KMS encryption data from database
   */
  private _deserializeKmsEncryption(
    serializedData: string,
  ): DeserializedKmsEncryption {
    const parsed = JSON.parse(serializedData) as SerializedKmsEncryption;
    return {
      encryptedData: Buffer.from(parsed.encryptedData, 'base64'),
      kmsKeyId: parsed.kmsKeyId,
      encryptionVersion: parsed.encryptionVersion,
    };
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private _encrypt(data: string | Buffer, key: Buffer): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encryptedBuffer = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Return a single, parsable string containing all necessary parts
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedBuffer.toString('hex')}`;
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private _decrypt(combinedData: string, key: Buffer): Buffer {
    const [ivHex, authTagHex, encryptedDataHex] = combinedData.split(':');

    // Basic validation to prevent runtime errors on malformed data
    if (!ivHex || !authTagHex || !encryptedDataHex) {
      throw new Error(
        'Invalid encrypted data format. Expected "iv:authTag:ciphertext".',
      );
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedData = Buffer.from(encryptedDataHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);
    return decrypted;
  }

  /**
   * Get encryption statistics for monitoring
   */
  async getEncryptionStats(): Promise<{
    totalWallets: number;
    kmsKeyUsage: Record<string, number>;
  }> {
    const wallets = await this.prisma.wallet.findMany({
      select: {
        kmsKeyId: true,
      },
    });

    const stats = {
      totalWallets: wallets.length,
      kmsKeyUsage: {} as Record<string, number>,
    };

    for (const wallet of wallets) {
      if (wallet.kmsKeyId) {
        stats.kmsKeyUsage[wallet.kmsKeyId] =
          (stats.kmsKeyUsage[wallet.kmsKeyId] || 0) + 1;
      }
    }

    return stats;
  }
}
