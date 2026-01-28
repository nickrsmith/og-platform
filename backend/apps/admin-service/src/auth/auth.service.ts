import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@app/database';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { ChangePasswordDto } from './dto/auth.dto';
import { AdminJwtPayload } from './interfaces/admin-jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async login(email: string, pass: string) {
    this.logger.log(`[LOGIN] Login attempt for email: ${email}`);

    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      this.logger.warn(`[LOGIN] Admin user not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials.');
    }

    this.logger.log(`[LOGIN] Admin user found: ${admin.id} (${admin.email})`);

    this.logger.log(`[LOGIN] Verifying password...`);
    const isPasswordMatch = await bcrypt.compare(pass, admin.passwordHash);
    if (!isPasswordMatch) {
      this.logger.warn(`[LOGIN] Password mismatch for admin: ${admin.id}`);
      throw new UnauthorizedException('Invalid credentials.');
    }

    this.logger.log(`[LOGIN] Password verified successfully`);

    const payload: Omit<AdminJwtPayload, 'iat' | 'exp'> = {
      sub: admin.id,
      email: admin.email,
      jti: uuid(),
    };

    this.logger.log(`[LOGIN] Generating JWT token for admin: ${admin.id}`);
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(`[LOGIN] Updating last login time...`);
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`[LOGIN] Login successful for admin: ${admin.id}`);
    return { accessToken };
  }

  async logout(jti: string, exp: number) {
    const now = Date.now();
    const expiresIn = exp * 1000 - now;

    if (expiresIn > 0) {
      // Add the JTI to Redis cache for immediate block
      await this.cache.set(`jti-block:${jti}`, true, expiresIn);
      // Also add to the database for persistence
      await this.prisma.jtiBlocklist.create({
        data: { jti, exp: new Date(exp * 1000) },
      });
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const admin = await this.prisma.adminUser.findUniqueOrThrow({
      where: { id: userId },
    });

    const isPasswordMatch = await bcrypt.compare(
      dto.currentPassword,
      admin.passwordHash,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Incorrect current password.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  async getMe(userId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (!admin) throw new NotFoundException('Admin user not found.');
    return admin;
  }
}
