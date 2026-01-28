import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  ValidateAssetDto,
  AssetValidationResultDto,
  ValidationStatus,
  ValidationType,
  ValidationIssueDto,
  AssetCategory,
} from '@app/common';
import { EnverusService } from '../enverus/enverus.service';
import { AiService } from '../ai/ai.service';
import * as crypto from 'crypto';

/**
 * Asset Validation Service
 * 
 * Orchestrates validation workflows combining:
 * - Enverus data validation
 * - AI document analysis
 * - Category-based business rules
 * 
 * Used during asset creation to ensure data quality and compliance.
 */
@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private readonly enableStrictValidation: boolean;
  private readonly validationCacheTtl: number; // Cache validation results for 1 hour

  constructor(
    private readonly enverusService: EnverusService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.enableStrictValidation = this.configService.get<boolean>(
      'ENABLE_STRICT_VALIDATION',
      false,
    );
    this.validationCacheTtl = this.configService.get<number>(
      'VALIDATION_CACHE_TTL',
      3600, // 1 hour default
    );
  }

  /**
   * Validate an asset before creation
   * Runs Enverus validation, AI analysis, and business rules checks
   * Results are cached to avoid redundant validation calls
   */
  async validateAsset(
    dto: ValidateAssetDto,
  ): Promise<AssetValidationResultDto> {
    const startTime = Date.now();
    this.logger.log(`Validating asset for release ${dto.releaseId}`);

    // Generate cache key from validation inputs
    const cacheKey = this.generateValidationCacheKey(dto);

    // Check cache first
    const cached = await this.cacheManager.get<AssetValidationResultDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for validation: ${cacheKey}`);
      return cached;
    }

    const result: AssetValidationResultDto = {
      overallStatus: ValidationStatus.InProgress,
      overallScore: 0,
      canProceed: true,
      issues: [],
      warnings: [],
      errors: [],
      metadata: {
        validatedAt: new Date().toISOString(),
      },
    };

    try {
      // Run validations in parallel where possible for better performance
      const validationPromises: Promise<void>[] = [];

      // Step 1: Enverus Validation (if applicable)
      if (!dto.skipEnverusValidation && (dto.county || dto.state)) {
        validationPromises.push(this.runEnverusValidation(dto, result));
      }

      // Step 2: AI Document Analysis (if document URL provided)
      if (!dto.skipAIAnalysis && dto.documentUrl) {
        validationPromises.push(this.runAIDocumentAnalysis(dto, result));
      }

      // Wait for parallel validations to complete
      await Promise.all(validationPromises);

      // Step 3: Category-based Business Rules Validation (synchronous, fast)
      if (dto.category) {
        this.validateCategoryBusinessRules(dto, result);
      }

      // Step 4: Calculate overall status and score
      this.calculateOverallStatus(result);

      const processingTime = Date.now() - startTime;
      result.metadata!.processingTimeMs = processingTime;

      // Cache the result
      await this.cacheManager.set(cacheKey, result, this.validationCacheTtl);

      this.logger.log(
        `Validation complete for release ${dto.releaseId}: ${result.overallStatus}, score: ${result.overallScore} (${processingTime}ms)`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Error during validation for release ${dto.releaseId}`, error);
      result.overallStatus = ValidationStatus.Failed;
      result.canProceed = false;
      result.errors.push('Validation process encountered an error');
      result.overallScore = 0;
      return result;
    }
  }

  /**
   * Generate cache key for validation results
   * Based on validation inputs to ensure cache hits for identical validations
   */
  private generateValidationCacheKey(dto: ValidateAssetDto): string {
    const keyData = {
      releaseId: dto.releaseId,
      county: dto.county,
      state: dto.state,
      operator: dto.operator,
      apiNumber: dto.apiNumber,
      legalDescription: dto.legalDescription,
      category: dto.category,
      assetType: dto.assetType,
      skipEnverus: dto.skipEnverusValidation,
      skipAI: dto.skipAIAnalysis,
    };
    const keyString = JSON.stringify(keyData);
    const hash = crypto.createHash('sha256').update(keyString).digest('hex');
    return `validation:${hash.substring(0, 16)}`;
  }

  /**
   * Run Enverus validation
   */
  private async runEnverusValidation(
    dto: ValidateAssetDto,
    result: AssetValidationResultDto,
  ): Promise<void> {
    try {
      if (!dto.county || !dto.state) {
        result.warnings.push('Cannot run Enverus validation: county and state required');
        return;
      }

      const enverusResult = await this.enverusService.validateAsset({
        county: dto.county,
        state: dto.state,
        operator: dto.operator,
        apiNumber: dto.apiNumber,
        legalDescription: dto.legalDescription,
      });

      result.enverusValidation = enverusResult;

      if (enverusResult.verified) {
        result.issues.push({
          type: ValidationType.Enverus,
          severity: 'info',
          message: `Enverus validation passed with ${enverusResult.matchScore}% match score`,
          metadata: {
            matchScore: enverusResult.matchScore,
            enverusId: enverusResult.enverusId,
          },
        });
      } else {
        const severity = enverusResult.matchScore >= 50 ? 'warning' : 'error';
        result.issues.push({
          type: ValidationType.Enverus,
          severity,
          message: `Enverus validation: ${enverusResult.discrepancies?.join(', ') || 'Low match score'}`,
          metadata: {
            matchScore: enverusResult.matchScore,
            discrepancies: enverusResult.discrepancies,
          },
        });

        if (severity === 'error' && this.enableStrictValidation) {
          result.errors.push(
            `Enverus validation failed: Match score ${enverusResult.matchScore}% is below threshold`,
          );
        } else {
          result.warnings.push(
            `Enverus validation warning: Match score ${enverusResult.matchScore}%`,
          );
        }
      }
    } catch (error) {
      this.logger.warn('Enverus validation error', error);
      result.warnings.push('Enverus validation unavailable or failed');
      result.issues.push({
        type: ValidationType.Enverus,
        severity: 'warning',
        message: 'Enverus validation service unavailable',
      });
    }
  }

  /**
   * Run AI document analysis
   */
  private async runAIDocumentAnalysis(
    dto: ValidateAssetDto,
    result: AssetValidationResultDto,
  ): Promise<void> {
    try {
      const aiResult = await this.aiService.analyzeDocument({
        documentUrl: dto.documentUrl!,
        documentType: this.inferDocumentType(dto.assetType),
      });

      result.aiDocumentAnalysis = aiResult.extraction;

      if (aiResult.extraction.confidence && aiResult.extraction.confidence >= 70) {
        result.issues.push({
          type: ValidationType.AI,
          severity: 'info',
          message: `AI document analysis completed with ${aiResult.extraction.confidence}% confidence`,
          metadata: {
            confidence: aiResult.extraction.confidence,
            extractedFields: aiResult.extraction.extractedFields,
          },
        });
      } else {
        result.issues.push({
          type: ValidationType.AI,
          severity: 'warning',
          message: 'AI document analysis completed with low confidence',
          metadata: {
            confidence: aiResult.extraction.confidence,
            warnings: aiResult.extraction.warnings,
          },
        });
        result.warnings.push('AI document analysis had low confidence');
      }

      // Check if extracted data matches provided data
      if (dto.legalDescription && aiResult.extraction.legalDescription) {
        if (
          aiResult.extraction.legalDescription.toLowerCase() !==
          dto.legalDescription.toLowerCase()
        ) {
          result.warnings.push(
            'Legal description from document analysis differs from provided description',
          );
          result.issues.push({
            type: ValidationType.AI,
            severity: 'warning',
            message: 'Legal description mismatch between document and provided data',
            field: 'legalDescription',
          });
        }
      }
    } catch (error) {
      this.logger.warn('AI document analysis error', error);
      result.warnings.push('AI document analysis unavailable or failed');
      result.issues.push({
        type: ValidationType.AI,
        severity: 'warning',
        message: 'AI document analysis service unavailable',
      });
    }
  }

  /**
   * Validate Category-based business rules
   */
  private validateCategoryBusinessRules(
    dto: ValidateAssetDto,
    result: AssetValidationResultDto,
  ): void {
    const category = dto.category!;

    switch (category) {
      case 'C':
        // Category C: Free listings for individual mineral owners
        this.validateCategoryCRules(dto, result);
        break;

      case 'B':
        // Category B: Brokers/Override traders
        this.validateCategoryBRules(dto, result);
        break;

      case 'A':
        // Category A: Major operators
        this.validateCategoryARules(dto, result);
        break;
    }
  }

  /**
   * Category C validation rules (Free listings for individuals)
   */
  private validateCategoryCRules(
    dto: ValidateAssetDto,
    result: AssetValidationResultDto,
  ): void {
    // Category C should be free listings (no fees)
    // This is enforced in smart contracts, but we validate here for clarity
    result.issues.push({
      type: ValidationType.Category,
      severity: 'info',
      message: 'Category C: Free listing (no platform fees will be charged)',
    });

    // Category C typically has simpler requirements
    // Warn if complex asset types are used
    if (dto.assetType === 'WorkingInterest') {
      result.warnings.push(
        'Category C typically lists Mineral or Lease assets. WorkingInterest is uncommon for individual owners.',
      );
      result.issues.push({
        type: ValidationType.Category,
        severity: 'warning',
        message: 'Category C typically does not include WorkingInterest assets',
        field: 'assetType',
      });
    }
  }

  /**
   * Category B validation rules (Brokers/Override traders)
   */
  private validateCategoryBRules(
    dto: ValidateAssetDto,
    result: AssetValidationResultDto,
  ): void {
    // Category B typically focuses on Override interests
    if (dto.assetType === 'Override') {
      result.issues.push({
        type: ValidationType.Category,
        severity: 'info',
        message: 'Category B: Override interest trading is appropriate',
      });
    } else if (dto.assetType) {
      // TypeScript knows assetType is not 'Override' here due to the if above
      result.warnings.push(
        'Category B typically focuses on Override interests (ORRI)',
      );
      result.issues.push({
        type: ValidationType.Category,
        severity: 'warning',
        message: 'Category B typically lists Override interests',
        field: 'assetType',
      });
    }
  }

  /**
   * Category A validation rules (Major operators)
   */
  private validateCategoryARules(
    dto: ValidateAssetDto,
    result: AssetValidationResultDto,
  ): void {
    // Category A typically has more complex asset types
    if (dto.assetType === 'WorkingInterest' || dto.assetType === 'Lease') {
      result.issues.push({
        type: ValidationType.Category,
        severity: 'info',
        message: 'Category A: Major operator asset types are appropriate',
      });
    }

    // Category A should have comprehensive data
    if (!dto.county || !dto.state) {
      result.warnings.push(
        'Category A listings should include complete location information',
      );
      result.issues.push({
        type: ValidationType.Category,
        severity: 'warning',
        message: 'Category A requires complete location data',
        field: 'location',
      });
    }
  }

  /**
   * Calculate overall validation status and score
   */
  private calculateOverallStatus(result: AssetValidationResultDto): void {
    const errors = result.errors.length;
    const warnings = result.warnings.length;
    const issues = result.issues;

    // Calculate score based on validation results
    let score = 100;

    // Deduct points for errors
    score -= errors * 20;

    // Deduct points for warnings
    score -= warnings * 5;

    // Consider Enverus match score
    if (result.enverusValidation) {
      const enverusWeight = 0.6;
      const otherWeight = 0.4;
      const enverusScore = result.enverusValidation.matchScore || 0;
      score = enverusScore * enverusWeight + score * otherWeight;
    }

    // Consider AI confidence
    if (result.aiDocumentAnalysis?.confidence) {
      const aiWeight = 0.3;
      const otherWeight = 0.7;
      const aiScore = result.aiDocumentAnalysis.confidence;
      score = aiScore * aiWeight + score * otherWeight;
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    result.overallScore = score;

    // Determine overall status
    if (errors > 0 && this.enableStrictValidation) {
      result.overallStatus = ValidationStatus.Failed;
      result.canProceed = false;
    } else if (errors > 0) {
      result.overallStatus = ValidationStatus.Warning;
      result.canProceed = true; // Allow with warnings in non-strict mode
    } else if (warnings > 0 || score < 80) {
      result.overallStatus = ValidationStatus.Warning;
      result.canProceed = true;
    } else {
      result.overallStatus = ValidationStatus.Passed;
      result.canProceed = true;
    }
  }

  /**
   * Infer document type from asset type
   */
  private inferDocumentType(
    assetType?: string,
  ): 'deed' | 'lease' | 'title' | 'mineral_deed' | 'assignment' | 'other' {
    switch (assetType) {
      case 'Mineral':
        return 'mineral_deed';
      case 'Lease':
        return 'lease';
      case 'Override':
        return 'assignment';
      default:
        return 'deed';
    }
  }
}

