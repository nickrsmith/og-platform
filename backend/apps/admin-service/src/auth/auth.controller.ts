import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto } from './dto/auth.dto';
import type { RequestWithAdmin } from './interfaces/request-with-admin.interface';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(new ValidationPipe()) loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: RequestWithAdmin) {
    const { jti, exp } = req.user;
    await this.authService.logout(jti, exp);
  }

  @Post('change-password')
  @UseGuards(AdminJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Request() req: RequestWithAdmin,
    @Body(new ValidationPipe()) changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  getMe(@Request() req: RequestWithAdmin) {
    return this.authService.getMe(req.user.sub);
  }
}
