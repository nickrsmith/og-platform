import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, RequestWithUser } from '@app/common';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = (request.body as { refreshToken?: string }).refreshToken;

    if (!token) {
      throw new UnauthorizedException('Refresh token not provided.');
    }

    try {
      // This verifies the token and decodes its payload.
      // It will throw an error if the token is invalid or expired.
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      // Attach the payload to the request for use in the controller/service.
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
    return true;
  }
}
