import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { ConfigModule } from '@app/config';
import { HttpModule } from '@nestjs/axios';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { EmailModule } from '@app/common/modules/email/email.module';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 60000), // Default 60 seconds
        maxRedirects: 5,
      }),
    }),
    EmailModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, AdminJwtAuthGuard],
})
export class OrganizationsModule {}
