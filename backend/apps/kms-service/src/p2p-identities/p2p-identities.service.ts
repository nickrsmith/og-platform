import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import * as crypto from 'crypto';
import nacl from 'tweetnacl';
import {
  CreateP2PIdentityRequestDto,
  CreateP2PIdentityResponseDto,
} from '@app/common';

@Injectable()
export class P2pIdentitiesService {
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly prisma: PrismaService) {}

  async createP2PIdentity(
    dto: CreateP2PIdentityRequestDto,
  ): Promise<CreateP2PIdentityResponseDto> {
    const { userId, subject } = dto;

    const existingIdentity = await this.prisma.p2PIdentity.findUnique({
      where: { userId },
    });
    if (existingIdentity) {
      throw new ConflictException(
        `P2P Identity already exists for user ${userId}`,
      );
    }

    const { generateKeyPair, privateKeyToProtobuf } = await import(
      '@libp2p/crypto/keys'
    );
    const { Ed25519PublicKey } = await import('@peerbit/crypto');
    // 1. Generate new Ed25519 keypair for Peerbit identity
    const p2pKeypair = await generateKeyPair('Ed25519');
    const p2pPrivateKeyProtobuf = privateKeyToProtobuf(p2pKeypair);

    // 2. Generate a new, cryptographically secure salt.
    const salt = crypto.randomBytes(16);

    // 3. Derive a strong encryption key from the user's stable subject and the salt.
    const derivedKey = crypto.pbkdf2Sync(subject, salt, 100000, 32, 'sha512');

    // 4. Encrypt the P2P private key with this derived key.
    const { encryptedData: encryptedPrivateKey } = this._encryptSymmetric(
      p2pPrivateKeyProtobuf,
      derivedKey,
    );
    const p2pPublicKey = new Ed25519PublicKey({
      publicKey: p2pKeypair.publicKey.raw,
    });
    try {
      await this.prisma.p2PIdentity.create({
        data: {
          userId,
          publicKey: p2pPublicKey.toString(),
          peerId: p2pPublicKey.toPeerId().toString(),
          encryptedPrivateKey,
          // Store the salt (hex-encoded) so it can be retrieved for decryption.
          // The 'encryptedDek' field will be repurposed to store the salt.
          encryptedDek: salt.toString('hex'),
        },
      });

      return { publicKey: p2pPublicKey.toString() };
    } catch (error) {
      console.error('Failed to create P2P identity in DB:', error);
      throw new InternalServerErrorException('Could not create P2P identity.');
    }
  }

  private _encryptSymmetric(data: Uint8Array, key: Buffer) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encryptedBuffer = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const combined = `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedBuffer.toString('hex')}`;
    return { encryptedData: combined };
  }

  private async _encryptAsymmetric(
    dek: Buffer,
    web3AuthPublicKey: string,
  ): Promise<string> {
    const { toString: uint8ArrayToString } = await import('uint8arrays');
    const { fromHexString } = await import('@peerbit/crypto');

    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const userPublicKeyBytes = fromHexString(web3AuthPublicKey);

    const ephemeralKeypair = nacl.box.keyPair();

    const encryptedDek = nacl.box(
      dek,
      nonce,
      userPublicKeyBytes,
      ephemeralKeypair.secretKey,
    );

    const fullPayload = new Uint8Array(
      ephemeralKeypair.publicKey.length + encryptedDek.length,
    );
    fullPayload.set(ephemeralKeypair.publicKey);
    fullPayload.set(encryptedDek, ephemeralKeypair.publicKey.length);

    return `${uint8ArrayToString(nonce, 'base64')}:${uint8ArrayToString(
      fullPayload,
      'base64',
    )}`;
  }
}
