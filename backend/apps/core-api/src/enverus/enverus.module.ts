import { Module } from '@nestjs/common';
import { EnverusService } from './enverus.service';
import { EnverusController } from './enverus.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 60000),
        maxRedirects: 5,
      }),
    }),
  ],
  controllers: [EnverusController],
  providers: [EnverusService],
  exports: [EnverusService],
})
export class EnverusModule {}

