// libs/common/src/dto/auth.dto.ts

import { IsJWT, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string; // This is the JWT from Web3Auth

  @IsOptional()
  @IsString()
  invitationToken?: string;
}

/**
 * Defines the shape of the data returned upon a successful login.
 */
export class LoginResponseDto {
  @IsJWT()
  accessToken: string;

  @IsJWT()
  refreshToken: string;
}

export class LogoutRequestDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RefreshTokenDto {
  @IsJWT()
  @IsNotEmpty()
  refreshToken: string;
}
