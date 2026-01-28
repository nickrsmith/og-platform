import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { firstValueFrom, catchError, delay, retryWhen, concatMap, throwError, timer } from 'rxjs';
import { AxiosError } from 'axios';
import {
  AnalyzeDocumentDto,
  DocumentAnalysisResponseDto,
  DocumentExtractionResultDto,
  GenerateValuationDto,
  ValuationResponseDto,
  ValuationResultDto,
  AssessRiskDto,
  RiskAssessmentResponseDto,
  RiskAssessmentResultDto,
  RiskFactorDto,
  GenerateListingDto,
  GeneratedListingResponseDto,
  GeneratedListingDto,
} from '@app/common';
import { EnverusService } from '../enverus/enverus.service';

/**
 * AI Model Service
 * 
 * Provides AI-powered services for:
 * - Document analysis and data extraction
 * - Property valuation
 * - Risk assessment
 * - Listing generation
 * 
 * Uses OpenAI API (configurable to support other providers)
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openaiApiKey: string | undefined;
  private readonly openaiApiUrl = 'https://api.openai.com/v1';
  private readonly modelName: string;
  private readonly httpTimeout: number;
  private readonly enableAi: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly enverusService: EnverusService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.modelName = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o');
    this.enableAi = this.configService.get<boolean>('ENABLE_AI_SERVICES', false);
    
    const timeoutValue = this.configService.get<string | number>('HTTP_TIMEOUT', 60000);
    const parsedTimeout = typeof timeoutValue === 'string' ? Number(timeoutValue) : timeoutValue;
    this.httpTimeout = typeof parsedTimeout === 'number' && !isNaN(parsedTimeout) && parsedTimeout > 0
      ? parsedTimeout
      : 60000;

    if (!this.openaiApiKey && this.enableAi) {
      this.logger.warn('OPENAI_API_KEY not configured. AI services will return mock data.');
    }
  }

  /**
   * Analyze a document and extract structured O&G data
   */
  async analyzeDocument(
    dto: AnalyzeDocumentDto,
  ): Promise<DocumentAnalysisResponseDto> {
    this.logger.log(`Analyzing document: ${dto.documentUrl}`);

    if (!this.enableAi || !this.openaiApiKey) {
      return this.getMockDocumentAnalysis(dto);
    }

    try {
      const prompt = this.buildDocumentAnalysisPrompt(dto);
      const response = await this.callOpenAI(prompt, {
        temperature: 0.1, // Low temperature for factual extraction
        response_format: { type: 'json_object' },
      });

      const extraction = this.parseDocumentExtraction(response);
      
      return {
        extraction,
        rawResponse: response,
      };
    } catch (error) {
      this.logger.error('Error analyzing document', error);
      // Return mock data on error for graceful degradation
      return this.getMockDocumentAnalysis(dto);
    }
  }

  /**
   * Generate property valuation using AI + Enverus data
   */
  async generateValuation(
    dto: GenerateValuationDto,
  ): Promise<ValuationResponseDto> {
    this.logger.log(`Generating valuation for ${dto.county}, ${dto.state}`);

    if (!this.enableAi || !this.openaiApiKey) {
      return this.getMockValuation(dto);
    }

    try {
      // Fetch Enverus data for context
      const enverusData = await this.fetchEnverusValuationData(dto);

      const prompt = this.buildValuationPrompt(dto, enverusData);
      const response = await this.callOpenAI(prompt, {
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const valuation = this.parseValuation(response);
      
      return {
        valuation,
        metadata: {
          generatedAt: new Date().toISOString(),
          modelUsed: this.modelName,
          dataSources: ['Enverus', 'AI Model'],
        },
      };
    } catch (error) {
      this.logger.error('Error generating valuation', error);
      return this.getMockValuation(dto);
    }
  }

  /**
   * Assess transaction risk
   */
  async assessRisk(dto: AssessRiskDto): Promise<RiskAssessmentResponseDto> {
    this.logger.log(`Assessing risk for asset: ${dto.assetId}`);

    if (!this.enableAi || !this.openaiApiKey) {
      return this.getMockRiskAssessment(dto);
    }

    try {
      const prompt = this.buildRiskAssessmentPrompt(dto);
      const response = await this.callOpenAI(prompt, {
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const assessment = this.parseRiskAssessment(response);
      
      return {
        assessment,
        metadata: {
          assessedAt: new Date().toISOString(),
          modelUsed: this.modelName,
        },
      };
    } catch (error) {
      this.logger.error('Error assessing risk', error);
      return this.getMockRiskAssessment(dto);
    }
  }

  /**
   * Generate listing description and details
   */
  async generateListing(
    dto: GenerateListingDto,
  ): Promise<GeneratedListingResponseDto> {
    this.logger.log(`Generating listing for ${dto.assetType} in ${dto.county}, ${dto.state}`);

    if (!this.enableAi || !this.openaiApiKey) {
      return this.getMockListing(dto);
    }

    try {
      const prompt = this.buildListingGenerationPrompt(dto);
      const response = await this.callOpenAI(prompt, {
        temperature: 0.7, // Higher temperature for creative content
        response_format: { type: 'json_object' },
      });

      const listing = this.parseListing(response);
      
      return {
        listing,
        metadata: {
          generatedAt: new Date().toISOString(),
          modelUsed: this.modelName,
        },
      };
    } catch (error) {
      this.logger.error('Error generating listing', error);
      return this.getMockListing(dto);
    }
  }

  /**
   * Check if error is a network/connection error that should be retried
   */
  private isNetworkError(error: AxiosError): boolean {
    // Check for network-level errors
    const errorCode = (error.code as string) || '';
    const errorMessage = error.message?.toLowerCase() || '';
    
    const networkErrorCodes = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EHOSTUNREACH',
      'ECONNRESET',
      'EAI_AGAIN',
    ];
    
    const networkErrorMessages = [
      'timeout',
      'network',
      'connection',
      'econnrefused',
      'etimedout',
      'enotfound',
      'ehostunreach',
      'econnreset',
      'getaddrinfo',
      'socket hang up',
      'request timeout',
    ];
    
    // Check error code
    if (networkErrorCodes.some(code => errorCode.includes(code))) {
      return true;
    }
    
    // Check error message
    if (networkErrorMessages.some(msg => errorMessage.includes(msg))) {
      return true;
    }
    
    // Check for timeout errors (no response received)
    if (!error.response && error.request) {
      return true;
    }
    
    // Check for 5xx server errors (retryable)
    if (error.response?.status && error.response.status >= 500 && error.response.status < 600) {
      return true;
    }
    
    return false;
  }

  /**
   * Call OpenAI API with improved connection error handling
   */
  private async callOpenAI(
    prompt: string,
    options: { temperature?: number; response_format?: { type: string } } = {},
  ): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { data } = await firstValueFrom(
      this.httpService
        .post(
          `${this.openaiApiUrl}/chat/completions`,
          {
            model: this.modelName,
            messages: [
              {
                role: 'system',
                content: 'You are an expert oil & gas industry analyst. Provide accurate, detailed, and professional analysis.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: options.temperature ?? 0.5,
            response_format: options.response_format,
          },
          {
            headers: {
              Authorization: `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: this.httpTimeout,
          },
        )
        .pipe(
          retryWhen((errors) =>
            errors.pipe(
              concatMap((error: AxiosError, index: number) => {
                const retryAttempt = index + 1;
                const isNetwork = this.isNetworkError(error);
                
                // More retries for network errors (5 attempts), fewer for API errors (2 attempts)
                const maxRetries = isNetwork ? 5 : 2;
                
                if (retryAttempt > maxRetries) {
                  this.logger.error(
                    `OpenAI API call failed after ${maxRetries} attempts`,
                    {
                      error: error.message,
                      code: error.code,
                      status: error.response?.status,
                      isNetworkError: isNetwork,
                    },
                  );
                  return throwError(() => error);
                }
                
                // Exponential backoff with jitter
                const baseDelay = Math.pow(2, retryAttempt - 1) * 1000;
                const jitter = Math.random() * 1000; // Add random jitter to prevent thundering herd
                const delayMs = baseDelay + jitter;
                
                this.logger.warn(
                  `Retrying OpenAI API call (attempt ${retryAttempt}/${maxRetries}) after ${Math.round(delayMs)}ms`,
                  {
                    error: error.message,
                    code: error.code,
                    status: error.response?.status,
                    isNetworkError: isNetwork,
                  },
                );
                
                return timer(delayMs);
              }),
            ),
          ),
          catchError((error: AxiosError) => {
            const isNetwork = this.isNetworkError(error);
            const status = error.response?.status;
            const errorData = error.response?.data;
            
            // Log detailed error information
            this.logger.error('OpenAI API error', {
              message: error.message,
              code: error.code,
              status: status,
              isNetworkError: isNetwork,
              responseData: errorData,
              url: error.config?.url,
            });
            
            // Provide specific error messages based on error type
            let errorMessage = 'AI service error: ';
            
            if (status === 429) {
              errorMessage += 'Rate limit exceeded. Please try again in a few moments.';
            } else if (status === 401) {
              errorMessage += 'Authentication failed. Please check API key configuration.';
            } else if (status === 403) {
              errorMessage += 'Access forbidden. Please check API key permissions.';
            } else if (status === 400) {
              errorMessage += 'Invalid request. Please check the input parameters.';
            } else if (isNetwork) {
              errorMessage += `Connection failed. Unable to reach OpenAI API. This may be a temporary network issue. Error: ${error.message || error.code || 'Unknown network error'}`;
            } else if (status && status >= 500) {
              errorMessage += 'OpenAI service is temporarily unavailable. Please try again later.';
            } else {
              errorMessage += `Service unavailable. ${error.message || 'Unknown error'}`;
            }
            
            throw new BadRequestException(errorMessage);
          }),
        ),
    );

    return data.choices[0]?.message?.content || '';
  }

  /**
   * Build prompt for document analysis
   */
  private buildDocumentAnalysisPrompt(dto: AnalyzeDocumentDto): string {
    return `Analyze this oil & gas document and extract structured data in JSON format.

Document Type: ${dto.documentType || 'unknown'}
Document URL: ${dto.documentUrl}
${dto.context ? `Context: ${dto.context}` : ''}

Extract the following fields (use null if not found):
- legalDescription: Full legal description
- section: Section number
- township: Township
- range: Range
- county: County name
- state: State (2-letter code)
- grantor: Grantor name(s)
- grantee: Grantee name(s)
- ownerNames: Array of owner names
- mineralRights: Boolean indicating if mineral rights are included
- royaltyInterest: Royalty interest percentage
- workingInterest: Working interest percentage
- netMineralAcres: Net mineral acres
- apiNumber: API number if present
- effectiveDate: Effective date (ISO format)
- recordingDate: Recording date (ISO format)
- documentNumber: Document number
- book: Book number
- page: Page number

Also include:
- confidence: Overall confidence score (0-100)
- extractedFields: Array of field names that were successfully extracted
- warnings: Array of any warnings or issues

Return only valid JSON.`;
  }

  /**
   * Build prompt for valuation
   */
  private buildValuationPrompt(
    dto: GenerateValuationDto,
    enverusData: any,
  ): string {
    return `Generate a property valuation for an oil & gas asset.

Asset Details:
- County: ${dto.county}
- State: ${dto.state}
- Basin: ${dto.basin || 'Unknown'}
- Acreage: ${dto.acreage || 'Unknown'}
- Asset Type: ${dto.assetType || 'Unknown'}

${enverusData ? `Enverus Data: ${JSON.stringify(enverusData, null, 2)}` : 'No Enverus data available'}

${dto.productionData ? `Production Data: ${JSON.stringify(dto.productionData, null, 2)}` : ''}
${dto.comparableSales ? `Comparable Sales: ${JSON.stringify(dto.comparableSales, null, 2)}` : ''}

Provide a valuation in JSON format with:
- estimatedValue: Estimated total value in USD
- valuePerAcre: Value per acre in USD
- confidence: Confidence score (0-100)
- methodology: Valuation methodology used (DCF, Comparable Sales, Hybrid, etc.)
- valueRange: [minValue, maxValue] array
- factors: Array of factors affecting value with {factor, impact: 'positive'|'negative'|'neutral', description}
- assumptions: Array of assumptions made
- recommendations: Array of recommendations

Return only valid JSON.`;
  }

  /**
   * Build prompt for risk assessment
   */
  private buildRiskAssessmentPrompt(dto: AssessRiskDto): string {
    return `Assess the risk of an oil & gas transaction.

Asset ID: ${dto.assetId}
${dto.transactionValue ? `Transaction Value: $${dto.transactionValue.toLocaleString()}` : ''}
${dto.assetDetails ? `Asset Details: ${JSON.stringify(dto.assetDetails, null, 2)}` : ''}

Assess risks in the following categories:
- Title & Ownership
- Production & Operations
- Environmental & Regulatory
- Market & Pricing
- Legal & Contractual

Provide assessment in JSON format with:
- overallRiskScore: Overall risk score (0-100, lower is better)
- riskLevel: 'low' | 'medium' | 'high' | 'critical'
- riskFactors: Array of {category, description, severity: 0-100, level: 'low'|'medium'|'high'|'critical', recommendation}
- recommendations: Array of risk mitigation recommendations
- flags: Array of critical issues that should block transaction (if any)

Return only valid JSON.`;
  }

  /**
   * Build prompt for listing generation
   */
  private buildListingGenerationPrompt(dto: GenerateListingDto): string {
    return `Generate a professional marketplace listing for an oil & gas asset.

Asset Type: ${dto.assetType}
Location: ${dto.county}, ${dto.state}
${dto.acreage ? `Acreage: ${dto.acreage} acres` : ''}
${dto.basin ? `Basin: ${dto.basin}` : ''}
${dto.extractedData ? `Extracted Data: ${JSON.stringify(dto.extractedData, null, 2)}` : ''}
${dto.enverusData ? `Enverus Data: ${JSON.stringify(dto.enverusData, null, 2)}` : ''}

Generate a compelling listing in JSON format with:
- title: Attractive listing title (max 100 chars)
- description: Detailed description (2-3 paragraphs)
- keyFeatures: Array of 4-6 key features
- highlights: Array of 3-4 major highlights
- suggestedPrice: Suggested price if applicable
- tags: Array of relevant tags

Return only valid JSON.`;
  }

  /**
   * Fetch Enverus data for valuation context
   */
  private async fetchEnverusValuationData(dto: GenerateValuationDto): Promise<any> {
    try {
      const transactions = await this.enverusService.getTransactions({
        county: dto.county,
        state: dto.state,
        months: 12,
        pageSize: 10,
      });

      const wells = dto.wellId
        ? await this.enverusService.getProductionHistory({
            wellId: dto.wellId,
            startDate: 'gt(2020-01-01)',
          })
        : null;

      return {
        recentTransactions: transactions.data || [],
        productionHistory: wells?.data || [],
      };
    } catch (error) {
      this.logger.warn('Failed to fetch Enverus data for valuation', error);
      return null;
    }
  }

  /**
   * Parse document extraction JSON response
   */
  private parseDocumentExtraction(response: string): DocumentExtractionResultDto {
    try {
      const parsed = JSON.parse(response);
      return {
        legalDescription: parsed.legalDescription,
        section: parsed.section,
        township: parsed.township,
        range: parsed.range,
        county: parsed.county,
        state: parsed.state,
        grantor: parsed.grantor,
        grantee: parsed.grantee,
        ownerNames: parsed.ownerNames,
        mineralRights: parsed.mineralRights,
        royaltyInterest: parsed.royaltyInterest,
        workingInterest: parsed.workingInterest,
        netMineralAcres: parsed.netMineralAcres,
        apiNumber: parsed.apiNumber,
        effectiveDate: parsed.effectiveDate,
        recordingDate: parsed.recordingDate,
        documentNumber: parsed.documentNumber,
        book: parsed.book,
        page: parsed.page,
        confidence: parsed.confidence || 0,
        extractedFields: parsed.extractedFields || [],
        warnings: parsed.warnings || [],
      };
    } catch (error) {
      this.logger.error('Failed to parse document extraction response', error);
      return {
        confidence: 0,
        extractedFields: [],
        warnings: ['Failed to parse AI response'],
      };
    }
  }

  /**
   * Parse valuation JSON response
   */
  private parseValuation(response: string): ValuationResultDto {
    try {
      const parsed = JSON.parse(response);
      return {
        estimatedValue: parsed.estimatedValue || 0,
        valuePerAcre: parsed.valuePerAcre || 0,
        confidence: parsed.confidence || 0,
        methodology: parsed.methodology || 'Unknown',
        valueRange: parsed.valueRange,
        factors: parsed.factors || [],
        assumptions: parsed.assumptions || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      this.logger.error('Failed to parse valuation response', error);
      return {
        estimatedValue: 0,
        valuePerAcre: 0,
        confidence: 0,
        methodology: 'Error',
        factors: [],
        assumptions: [],
        recommendations: [],
      };
    }
  }

  /**
   * Parse risk assessment JSON response
   */
  private parseRiskAssessment(response: string): RiskAssessmentResultDto {
    try {
      const parsed = JSON.parse(response);
      return {
        overallRiskScore: parsed.overallRiskScore || 50,
        riskLevel: parsed.riskLevel || 'medium',
        riskFactors: parsed.riskFactors || [],
        recommendations: parsed.recommendations || [],
        flags: parsed.flags || [],
      };
    } catch (error) {
      this.logger.error('Failed to parse risk assessment response', error);
      return {
        overallRiskScore: 50,
        riskLevel: 'medium',
        riskFactors: [],
        recommendations: [],
        flags: [],
      };
    }
  }

  /**
   * Parse listing generation JSON response
   */
  private parseListing(response: string): GeneratedListingDto {
    try {
      const parsed = JSON.parse(response);
      return {
        title: parsed.title || 'Oil & Gas Asset',
        description: parsed.description || '',
        keyFeatures: parsed.keyFeatures || [],
        highlights: parsed.highlights || [],
        suggestedPrice: parsed.suggestedPrice,
        tags: parsed.tags || [],
      };
    } catch (error) {
      this.logger.error('Failed to parse listing response', error);
      return {
        title: 'Oil & Gas Asset',
        description: '',
        keyFeatures: [],
        highlights: [],
        tags: [],
      };
    }
  }

  /**
   * Mock document analysis (when AI is disabled)
   */
  private getMockDocumentAnalysis(dto: AnalyzeDocumentDto): DocumentAnalysisResponseDto {
    return {
      extraction: {
        confidence: 0,
        extractedFields: [],
        warnings: ['AI services are disabled. This is mock data.'],
      },
    };
  }

  /**
   * Mock valuation (when AI is disabled)
   */
  private getMockValuation(dto: GenerateValuationDto): ValuationResponseDto {
    return {
      valuation: {
        estimatedValue: 0,
        valuePerAcre: 0,
        confidence: 0,
        methodology: 'Mock',
        factors: [],
        assumptions: ['AI services are disabled. This is mock data.'],
        recommendations: [],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'mock',
        dataSources: [],
      },
    };
  }

  /**
   * Mock risk assessment (when AI is disabled)
   */
  private getMockRiskAssessment(dto: AssessRiskDto): RiskAssessmentResponseDto {
    return {
      assessment: {
        overallRiskScore: 50,
        riskLevel: 'medium',
        riskFactors: [],
        recommendations: ['AI services are disabled. This is mock data.'],
        flags: [],
      },
      metadata: {
        assessedAt: new Date().toISOString(),
        modelUsed: 'mock',
      },
    };
  }

  /**
   * Mock listing (when AI is disabled)
   */
  private getMockListing(dto: GenerateListingDto): GeneratedListingResponseDto {
    return {
      listing: {
        title: `${dto.assetType} in ${dto.county}, ${dto.state}`,
        description: 'AI services are disabled. This is mock data.',
        keyFeatures: [],
        highlights: [],
        tags: [],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'mock',
      },
    };
  }
}

