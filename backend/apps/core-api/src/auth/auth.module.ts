import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { HttpModule } from '@nestjs/axios';
import { Web3AuthService } from './strategies/web3auth.service';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard, RefreshTokenGuard } from '@app/common';

@Module({
  imports: [DatabaseModule, HttpModule, ConfigModule, JwtModule],
  controllers: [AuthController],
  providers: [AuthService, Web3AuthService, RolesGuard, RefreshTokenGuard],
  exports: [AuthService, Web3AuthService, RolesGuard],
})
export class AuthModule {}
