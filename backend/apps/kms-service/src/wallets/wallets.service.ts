import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/database';
import { Wallet } from 'ethers';
import * as crypto from 'crypto';
import { CreateWalletRequestDto, CreateWalletResponseDto } from '@app/common';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);
  private readonly kek: Buffer; // Key Encryption Key
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const hexKey = this.configService.getOrThrow<string>('MASTER_KEK');
    if (hexKey.length !== 64) {
      throw new Error('MASTER_KEK must be a 64-character hex string.');
    }
    this.kek = Buffer.from(hexKey, 'hex');
  }

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
    const dek = crypto.randomBytes(32);

    if (!wallet.mnemonic) {
      throw new InternalServerErrorException(
        'Failed to generate wallet mnemonic.',
      );
    }
    const mnemonic = wallet.mnemonic.phrase;

    // CORRECTED: _encrypt now returns a single, complete string
    const encryptedSeed = this._encrypt(mnemonic, dek);
    const encryptedDek = this._encrypt(dek, this.kek);

    try {
      await this.prisma.wallet.create({
        data: {
          userId,
          walletAddress: wallet.address,
          compressedPublicKey: wallet.signingKey.compressedPublicKey,
          encryptedSeed, // Store the complete string
          encryptedDek, // Store the complete string
        },
      });

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

    // Step 1: Decrypt the Data Encryption Key (DEK) using the master KEK.
    const dek = this._decrypt(walletRecord.encryptedDek, this.kek);

    // Step 2: Decrypt the wallet's seed phrase (mnemonic) using the DEK.
    const mnemonic = this._decrypt(walletRecord.encryptedSeed, dek).toString(
      'utf-8',
    );

    // Step 3: Reconstruct the wallet from the mnemonic to get the private key.
    const wallet = Wallet.fromPhrase(mnemonic);
    return wallet.privateKey;
  }

  // --- CORRECTED _encrypt METHOD ---
  private _encrypt(data: string | Buffer, key: Buffer): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encryptedBuffer = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Return a single, parsable string containing all necessary parts.
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedBuffer.toString('hex')}`;
  }

  // --- CORRECTED _decrypt METHOD ---
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
}
