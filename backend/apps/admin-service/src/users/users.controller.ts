import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Body,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { FindQueryDto } from '@app/common';
import { IsOptional, IsString, IsEnum } from 'class-validator';

enum UserStatus {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(['A', 'B', 'C'])
  category?: 'A' | 'B' | 'C';
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('p2p/:peerId')
  findUserByPeerId(@Param('peerId') peerId: string) {
    // This is a public endpoint to resolve a P2P key to a user profile
    return this.usersService.findUserByPeerId(peerId);
  }

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  findAll(
    @Query(new ValidationPipe({ transform: true })) query: FindQueryDto & { status?: UserStatus; search?: string },
  ) {
    return this.usersService.findAll(query);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe()) dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/suspend')
  @UseGuards(AdminJwtAuthGuard)
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.suspend(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(AdminJwtAuthGuard)
  reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.reactivate(id);
  }
}
