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
import { AiService } from './ai.service';
import {
  AnalyzeDocumentDto,
  DocumentAnalysisResponseDto,
  GenerateValuationDto,
  ValuationResponseDto,
  AssessRiskDto,
  RiskAssessmentResponseDto,
  GenerateListingDto,
  GeneratedListingResponseDto,
  JwtAuthGuard,
} from '@app/common';

const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('ai')
@ApiBearerAuth('JWT-auth')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('analyze-document')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async analyzeDocument(
    @Body(validationPipe) dto: AnalyzeDocumentDto,
  ): Promise<DocumentAnalysisResponseDto> {
    this.logger.log(`POST /ai/analyze-document - ${dto.documentUrl}`);
    return this.aiService.analyzeDocument(dto);
  }

  @Post('generate-valuation')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async generateValuation(
    @Body(validationPipe) dto: GenerateValuationDto,
  ): Promise<ValuationResponseDto> {
    this.logger.log(`POST /ai/generate-valuation - ${dto.county}, ${dto.state}`);
    return this.aiService.generateValuation(dto);
  }

  @Post('assess-risk')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async assessRisk(
    @Body(validationPipe) dto: AssessRiskDto,
  ): Promise<RiskAssessmentResponseDto> {
    this.logger.log(`POST /ai/assess-risk - ${dto.assetId}`);
    return this.aiService.assessRisk(dto);
  }

  @Post('generate-listing')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async generateListing(
    @Body(validationPipe) dto: GenerateListingDto,
  ): Promise<GeneratedListingResponseDto> {
    this.logger.log(`POST /ai/generate-listing - ${dto.assetType}`);
    return this.aiService.generateListing(dto);
  }
}

