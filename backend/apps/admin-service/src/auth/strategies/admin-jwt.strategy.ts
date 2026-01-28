import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '@app/database';
import { AdminJwtPayload } from '../interfaces/admin-jwt-payload.interface';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminJwtPayload> {
    const { sub, jti } = payload;

    // 1. Check Redis cache first for a blocked JTI
    const isBlocked = await this.cache.get<boolean>(`jti-block:${jti}`);
    if (isBlocked) {
      throw new UnauthorizedException('Token has been logged out.');
    }

    // 2. Fallback check against the database blocklist
    const blockedJti = await this.prisma.jtiBlocklist.findUnique({
      where: { jti },
    });
    if (blockedJti) {
      // If found in DB, add it to Redis for faster future lookups
      await this.cache.set(
        `jti-block:${jti}`,
        true,
        blockedJti.exp.getTime() - Date.now(),
      );
      throw new UnauthorizedException('Token has been logged out.');
    }

    // 3. Ensure the user still exists and is active
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: sub },
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin user not found or is inactive.');
    }

    return payload; // Attach payload to request.user
  }
}
