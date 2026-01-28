import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateWalletRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

/**
 * Defines the shape of the data returned after creating a new wallet.
 * Only public information is exposed.
 */
export class CreateWalletResponseDto {
  @IsString()
  walletAddress: string;

  @IsString()
  compressedPublicKey: string;
}
