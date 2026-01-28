import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ValidationService } from './validation.service';
import {
  ValidateAssetDto,
  AssetValidationResultDto,
  JwtAuthGuard,
} from '@app/common';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('validation')
@ApiBearerAuth('JWT-auth')
@Controller('validation')
export class ValidationController {
  private readonly logger = new Logger(ValidationController.name);

  constructor(private readonly validationService: ValidationService) {}

  @Post('asset')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Validate asset',
    description:
      'Validates an asset using Enverus data, AI document analysis, and category-based business rules. Returns validation status, score, and issues.',
  })
  @ApiBody({ type: ValidateAssetDto })
  @ApiResponse({
    status: 200,
    description: 'Asset validation result',
    type: AssetValidationResultDto,
  })
  async validateAsset(
    @Body(validationPipe) dto: ValidateAssetDto,
  ): Promise<AssetValidationResultDto> {
    this.logger.log(`POST /validation/asset - Release ${dto.releaseId}`);
    return this.validationService.validateAsset(dto);
  }
}

