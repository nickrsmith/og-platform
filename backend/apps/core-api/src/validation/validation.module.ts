import { Module } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { ValidationController } from './validation.controller';
import { EnverusModule } from '../enverus/enverus.module';
import { AiModule } from '../ai/ai.module';
import { ConfigModule } from '@nestjs/config';
// CacheModule is registered globally in core-api.module.ts

@Module({
  imports: [ConfigModule, EnverusModule, AiModule],
  controllers: [ValidationController],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}

