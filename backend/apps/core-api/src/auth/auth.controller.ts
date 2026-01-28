import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  ValidationPipe,
  Request,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  JwtAuthGuard,
  LoginRequestDto,
  LoginResponseDto,
  LogoutRequestDto,
  RefreshTokenDto,
  RefreshTokenGuard,
  type RequestWithUser,
} from '@app/common';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
});
@Controller('auth') // Sets base path to /auth
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login/web3auth') // Full path: /auth/login/web3auth
  login(@Body(validationPipe) loginDto: LoginRequestDto) {
    this.logger.log('[CONTROLLER] Received login request');
    this.logger.log(
      `[CONTROLLER] Token length: ${loginDto.token?.length || 0} chars`,
    );
    this.logger.log(
      `[CONTROLLER] Token preview: ${loginDto.token?.substring(0, 50)}...`,
    );
    this.logger.log(
      `[CONTROLLER] Has invitationToken: ${!!loginDto.invitationToken}`,
    );
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body(validationPipe) logoutDto: LogoutRequestDto,
  ): Promise<void> {
    await this.authService.logout(logoutDto);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard) // Protects the route and validates the token
  @HttpCode(HttpStatus.OK)
  refreshToken(
    @Request() req: RequestWithUser,
    @Body(validationPipe) refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    const userId = req.user.sub;
    const refreshToken = refreshTokenDto.refreshToken;
    return this.authService.refreshToken(userId, refreshToken);
  }

  @Post('session/start')
  @UseGuards(JwtAuthGuard)
  startSession(@Request() req: RequestWithUser) {
    return this.authService.startSession(req.user);
  }
}
