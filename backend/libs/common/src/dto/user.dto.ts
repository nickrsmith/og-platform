import { IsNotEmpty, IsString, IsUrl, IsUUID } from 'class-validator';

export class GetUserProfileResponseDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsUrl()
  @IsNotEmpty()
  profileImage: string;
}
