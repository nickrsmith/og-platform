import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateP2PIdentityRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  subject: string;
}

export class CreateP2PIdentityResponseDto {
  @IsString()
  @IsNotEmpty()
  publicKey: string;
}

export class GetP2PIdentityResponseDto {
  @IsString()
  @IsNotEmpty()
  peerId: string;

  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @IsString()
  @IsNotEmpty()
  encryptedPrivateKey: string;

  @IsString()
  @IsNotEmpty()
  encryptedDek: string;
}
