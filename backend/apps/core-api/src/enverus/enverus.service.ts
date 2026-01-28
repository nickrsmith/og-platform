import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  catchError,
  firstValueFrom,
  timeout,
  delay,
  retryWhen,
  concatMap,
  throwError,
  timer,
} from 'rxjs';
import { AxiosError } from 'axios';
import {
  EnverusWellsQueryDto,
  EnverusProductionQueryDto,
  EnverusRigsQueryDto,
  EnverusPermitsQueryDto,
  EnverusCompletionsQueryDto,
  EnverusTransactionsQueryDto,
  EnverusValidateAssetDto,
  EnverusWellsResponseDto,
  EnverusProductionResponseDto,
  EnverusRigsResponseDto,
  EnverusPermitsResponseDto,
  EnverusCompletionsResponseDto,
  EnverusTransactionsResponseDto,
  EnverusValidationResultDto,
  EnverusWellDto,
  EnverusCompletionDto,
  EnverusProductionDto,
  EnverusRigDto,
  EnverusPermitDto,
  EnverusTransactionDto,
} from '@app/common';

interface EnverusApiResponse<T> {
  data: T[];
  total?: number;
}

interface CacheConfig {
  wells: number; // TTL in seconds
  production: number;
  rigs: number;
  permits: number;
  completions: number;
  transactions: number;
}

@Injectable()
export class EnverusService {
  private readonly logger = new Logger(EnverusService.name);
  private readonly apiBaseUrl = 'https://app.enverus.com/direct/v3';
  private readonly secretKey: string | null;
  private readonly httpTimeout: number;
  private readonly cacheConfig: CacheConfig = {
    wells: 86400, // 24 hours
    production: 21600, // 6 hours
    rigs: 3600, // 1 hour
    permits: 14400, // 4 hours
    completions: 21600, // 6 hours
    transactions: 43200, // 12 hours
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.secretKey = this.configService.get<string>('ENVERUS_SECRET_KEY') || null;
    if (!this.secretKey) {
      this.logger.warn('Enverus secret key not configured. Enverus operations will be disabled.');
    }
    const timeoutValue = this.configService.get<string | number>(
      'HTTP_TIMEOUT',
      60000,
    );
    const parsedTimeout =
      typeof timeoutValue === 'string' ? Number(timeoutValue) : timeoutValue;
    this.httpTimeout =
      typeof parsedTimeout === 'number' &&
      !isNaN(parsedTimeout) &&
      parsedTimeout > 0
        ? parsedTimeout
        : 60000;
  }

  /**
   * Generic method to query Enverus API with caching and error handling
   */
  private async queryEnverus<T>(
    endpoint: string,
    params: Record<string, any>,
    cacheKey: string,
    ttl: number,
  ): Promise<EnverusApiResponse<T>> {
    if (!this.secretKey) {
      throw new InternalServerErrorException(
        'Enverus operations are not available. ENVERUS_SECRET_KEY is not configured.',
      );
    }

    // Check cache first
    const cached = await this.cacheManager.get<EnverusApiResponse<T>>(
      cacheKey,
    );
    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    // Build query parameters
    const queryParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams[key] = String(value);
      }
    }

    // Make API request
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get<EnverusApiResponse<T>>(`${this.apiBaseUrl}/${endpoint}`, {
            params: queryParams,
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
            timeout: this.httpTimeout,
          })
          .pipe(
            timeout(this.httpTimeout),
            retryWhen((errors) =>
              errors.pipe(
                concatMap((error: AxiosError, index: number) => {
                  const retryAttempt = index + 1;
                  // Exponential backoff: 1s, 2s, 4s
                  const delayMs = Math.pow(2, retryAttempt - 1) * 1000;
                  
                  if (retryAttempt > 3) {
                    this.logger.error(
                      `Max retries reached for ${endpoint}`,
                      error.message,
                    );
                    return throwError(() => error);
                  }
                  
                  this.logger.warn(
                    `Retrying Enverus API call (attempt ${retryAttempt}/3) after ${delayMs}ms`,
                  );
                  return timer(delayMs);
                }),
              ),
            ),
            catchError((error: AxiosError) => {
              this.handleEnverusError(error, endpoint, params);
              throw error;
            }),
          ),
      );

      // Cache the response
      await this.cacheManager.set(cacheKey, data, ttl * 1000); // TTL in milliseconds

      return data;
    } catch (error) {
      // If error and we have cached data, return stale cache
      const staleCache = await this.cacheManager.get<EnverusApiResponse<T>>(
        cacheKey,
      );
      if (staleCache) {
        this.logger.warn(
          `Enverus API error, returning stale cache for ${cacheKey}`,
        );
        return staleCache;
      }
      throw error;
    }
  }

  /**
   * Handle Enverus API errors
   */
  private handleEnverusError(
    error: AxiosError,
    endpoint: string,
    params: Record<string, any>,
  ): void {
    const status = error.response?.status;
    const message = error.response?.data || error.message;

    this.logger.error(
      `Enverus API error for ${endpoint}`,
      JSON.stringify({ status, params, message }),
    );

    switch (status) {
      case 401:
        throw new BadRequestException(
          'Invalid or expired Enverus API key. Please contact administrator.',
        );
      case 403:
        throw new BadRequestException(
          'Enverus API subscription limit reached. Please try again later.',
        );
      case 404:
        // Return empty data instead of error for 404
        this.logger.warn(`No data found for ${endpoint}`, params);
        break;
      case 429:
        throw new BadRequestException(
          'Enverus API rate limit exceeded. Please try again later.',
        );
      case 500:
      case 502:
      case 503:
        throw new InternalServerErrorException(
          'Enverus API is temporarily unavailable. Please try again later.',
        );
      default:
        throw new InternalServerErrorException(
          `Failed to query Enverus API: ${message}`,
        );
    }
  }

  /**
   * Generate cache key from endpoint and params
   */
  private generateCacheKey(
    endpoint: string,
    params: Record<string, any>,
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join('|');
    return `enverus:${endpoint}:${sortedParams}`;
  }

  /**
   * Get wells by county/state
   */
  async getWellsByCounty(
    query: EnverusWellsQueryDto,
  ): Promise<EnverusWellsResponseDto> {
    this.logger.log(`Querying wells: ${JSON.stringify(query)}`);

    const params: Record<string, any> = {};
    if (query.county) params.county = query.county.toUpperCase();
    if (query.state) params.stateprovince = query.state;
    if (query.basin) params.basin = query.basin;
    if (query.wellId) params.wellid = query.wellId;
    if (query.operator) params.operator = query.operator;
    if (query.updatedDate) params.updateddate = query.updatedDate;
    if (query.deletedDate !== undefined) params.deleteddate = query.deletedDate;
    if (query.pageSize) params.pagesize = query.pageSize;

    const cacheKey = this.generateCacheKey('wells', params);
    const result = await this.queryEnverus<EnverusWellDto>(
      'wells',
      params,
      cacheKey,
      this.cacheConfig.wells,
    );

    return {
      data: result.data || [],
      total: result.total,
    };
  }

  /**
   * Get production history for a well
   */
  async getProductionHistory(
    query: EnverusProductionQueryDto,
  ): Promise<EnverusProductionResponseDto> {
    this.logger.log(`Querying production for well: ${query.wellId}`);

    const params: Record<string, any> = {
      wellid: query.wellId,
    };
    if (query.startDate) params.productiondate = `gt(${query.startDate})`;
    if (query.endDate) {
      params.productiondate = params.productiondate
        ? `${params.productiondate},lt(${query.endDate})`
        : `lt(${query.endDate})`;
    }
    if (query.pageSize) params.pagesize = query.pageSize;

    const cacheKey = this.generateCacheKey('production', params);
    const result = await this.queryEnverus<EnverusProductionDto>(
      'production',
      params,
      cacheKey,
      this.cacheConfig.production,
    );

    return {
      data: result.data || [],
      total: result.total,
    };
  }

  /**
   * Get rigs data
   */
  async getRigs(query: EnverusRigsQueryDto): Promise<EnverusRigsResponseDto> {
    this.logger.log(`Querying rigs: ${JSON.stringify(query)}`);

    const params: Record<string, any> = {};
    if (query.county) params.county = query.county.toUpperCase();
    if (query.state) params.stateprovince = query.state;
    if (query.basin) params.basin = query.basin;
    if (query.operator) params.operator = query.operator;
    if (query.status) params.status = query.status;
    if (query.pageSize) params.pagesize = query.pageSize;

    const cacheKey = this.generateCacheKey('rigs', params);
    const result = await this.queryEnverus<EnverusRigDto>(
      'rigs',
      params,
      cacheKey,
      this.cacheConfig.rigs,
    );

    return {
      data: result.data || [],
      total: result.total,
    };
  }

  /**
   * Get permits data
   */
  async getPermits(
    query: EnverusPermitsQueryDto,
  ): Promise<EnverusPermitsResponseDto> {
    this.logger.log(`Querying permits: ${JSON.stringify(query)}`);

    const params: Record<string, any> = {};
    if (query.county) params.county = query.county.toUpperCase();
    if (query.state) params.stateprovince = query.state;
    if (query.operator) params.operator = query.operator;
    if (query.permitDate) params.permitdate = query.permitDate;
    if (query.pageSize) params.pagesize = query.pageSize;

    const cacheKey = this.generateCacheKey('permits', params);
    const result = await this.queryEnverus<EnverusPermitDto>(
      'permits',
      params,
      cacheKey,
      this.cacheConfig.permits,
    );

    return {
      data: result.data || [],
      total: result.total,
    };
  }

  /**
   * Get completions data
   */
  async getCompletions(
    query: EnverusCompletionsQueryDto,
  ): Promise<EnverusCompletionsResponseDto> {
    this.logger.log(`Querying completions for well: ${query.wellId}`);

    const params: Record<string, any> = {
      wellid: query.wellId,
    };
    if (query.completionDate)
      params.completiondate = query.completionDate;
    if (query.pageSize) params.pagesize = query.pageSize;

    const cacheKey = this.generateCacheKey('completions', params);
    const result = await this.queryEnverus<EnverusCompletionDto>(
      'completions',
      params,
      cacheKey,
      this.cacheConfig.completions,
    );

    return {
      data: result.data || [],
      total: result.total,
    };
  }

  /**
   * Get transactions/comparable sales
   */
  async getTransactions(
    query: EnverusTransactionsQueryDto,
  ): Promise<EnverusTransactionsResponseDto> {
    this.logger.log(`Querying transactions: ${JSON.stringify(query)}`);

    const params: Record<string, any> = {};
    if (query.county) params.county = query.county.toUpperCase();
    if (query.state) params.stateprovince = query.state;
    if (query.assetType) params.assettype = query.assetType;

    // Calculate transaction date filter from months
    if (query.months) {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - query.months);
      params.transactiondate = `gt(${cutoffDate.toISOString().split('T')[0]})`;
    } else if (query.transactionDate) {
      params.transactiondate = query.transactionDate;
    }

    if (query.pageSize) params.pagesize = query.pageSize;

    const cacheKey = this.generateCacheKey('transactions', params);
    const result = await this.queryEnverus<EnverusTransactionDto>(
      'transactions',
      params,
      cacheKey,
      this.cacheConfig.transactions,
    );

    return {
      data: result.data || [],
      total: result.total,
    };
  }

  /**
   * Validate asset against Enverus data
   * This implements the AI verification pipeline
   */
  async validateAsset(
    dto: EnverusValidateAssetDto,
  ): Promise<EnverusValidationResultDto> {
    this.logger.log(`Validating asset: ${JSON.stringify(dto)}`);

    // Step 1: Find matching wells
    const wellsQuery: EnverusWellsQueryDto = {
      county: dto.county,
      state: dto.state,
      deletedDate: 'null', // Only active wells
    };
    if (dto.operator) wellsQuery.operator = dto.operator;

    const wellsResult = await this.getWellsByCounty(wellsQuery);
    const wells = wellsResult.data || [];

    if (wells.length === 0) {
      return {
        verified: false,
        matchScore: 0,
        discrepancies: ['No matching wells found in Enverus database'],
      };
    }

    // Step 2: Calculate match scores for each well
    const matches = wells.map((well) => {
      const matchResult = this.calculateMatchScore(dto, well);
      return {
        well,
        ...matchResult,
      };
    });

    // Step 3: Find best match
    const bestMatch = matches.sort((a, b) => b.score - a.score)[0];

    // Step 4: Find discrepancies
    const discrepancies = this.findDiscrepancies(dto, bestMatch.well);

    return {
      verified: bestMatch.score >= 80,
      matchScore: bestMatch.score,
      enverusId: bestMatch.well.WellID,
      matchedWell: bestMatch.well,
      matchedFields: bestMatch.matchedFields,
      discrepancies,
    };
  }

  /**
   * Calculate match score between asset data and Enverus well
   */
  private calculateMatchScore(
    asset: EnverusValidateAssetDto,
    well: EnverusWellDto,
  ): { score: number; matchedFields: string[] } {
    let score = 0;
    const matchedFields: string[] = [];

    // API Number exact match = 40 points
    if (asset.apiNumber && well.WellID) {
      if (asset.apiNumber === well.WellID) {
        score += 40;
        matchedFields.push('apiNumber');
      }
    }

    // County + State match = 20 points (required)
    if (
      asset.county?.toUpperCase() === well.County?.toUpperCase() &&
      asset.state?.toUpperCase() === well.State?.toUpperCase()
    ) {
      score += 20;
      matchedFields.push('county', 'state');
    }

    // Operator fuzzy match = 20 points
    if (asset.operator && well.Operator) {
      const assetOp = asset.operator.toLowerCase().trim();
      const wellOp = well.Operator.toLowerCase().trim();
      if (assetOp === wellOp) {
        score += 20;
        matchedFields.push('operator');
      } else if (assetOp.includes(wellOp) || wellOp.includes(assetOp)) {
        score += 10; // Partial match
        matchedFields.push('operator (partial)');
      }
    }

    // Legal description fuzzy match = 20 points
    if (asset.legalDescription && well.WellName) {
      const assetDesc = asset.legalDescription.toLowerCase();
      const wellName = well.WellName.toLowerCase();
      // Simple fuzzy matching - could be enhanced
      if (assetDesc.includes(wellName) || wellName.includes(assetDesc)) {
        score += 20;
        matchedFields.push('legalDescription');
      }
    }

    // Section/Township/Range match = 20 points
    if (asset.sectionTownshipRange && well.WellName) {
      const assetStr = asset.sectionTownshipRange.toLowerCase();
      const wellStr = well.WellName.toLowerCase();
      if (assetStr.includes(wellStr) || wellStr.includes(assetStr)) {
        score += 20;
        matchedFields.push('sectionTownshipRange');
      }
    }

    return { score: Math.min(score, 100), matchedFields };
  }

  /**
   * Find discrepancies between asset data and Enverus well
   */
  private findDiscrepancies(
    asset: EnverusValidateAssetDto,
    well: EnverusWellDto,
  ): string[] {
    const discrepancies: string[] = [];

    // Check operator mismatch
    if (asset.operator && well.Operator) {
      const assetOp = asset.operator.toLowerCase().trim();
      const wellOp = well.Operator.toLowerCase().trim();
      if (assetOp !== wellOp && !assetOp.includes(wellOp) && !wellOp.includes(assetOp)) {
        discrepancies.push(
          `Operator mismatch: provided "${asset.operator}" vs Enverus "${well.Operator}"`,
        );
      }
    }

    // Check county/state mismatch
    if (
      asset.county?.toUpperCase() !== well.County?.toUpperCase() ||
      asset.state?.toUpperCase() !== well.State?.toUpperCase()
    ) {
      discrepancies.push(
        `Location mismatch: provided "${asset.county}, ${asset.state}" vs Enverus "${well.County}, ${well.State}"`,
      );
    }

    // Check well status
    if (well.Status && well.Status.toLowerCase() !== 'active') {
      discrepancies.push(`Well status is "${well.Status}" (not active)`);
    }

    return discrepancies;
  }
}

