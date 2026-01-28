import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetChainTransactionDto,
  CreateChainTransactionRequestDto,
  GetJobResponseDto,
  UpdateChainTransactionRequestDto,
} from '@app/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ethers } from 'ethers';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  private readonly blockchainServiceUrl: string;
  private readonly indexerApiUrl: string | null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.blockchainServiceUrl = this.configService.getOrThrow(
      'BLOCKCHAIN_SERVICE_URL',
    );
    this.indexerApiUrl = this.configService.get<string>('INDEXER_API_URL') || null;
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Transaction indexing operations will be disabled.');
    }
  }

  async getTransaction(id: string): Promise<GetChainTransactionDto> {
    if (!this.indexerApiUrl) {
      throw new InternalServerErrorException(
        'Transaction indexing is not available. INDEXER_API_URL is not configured.',
      );
    }
    
    const url = `${this.indexerApiUrl}/transactions/${id}`;
    this.logger.log(`Proxying status request for txId ${id}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<GetChainTransactionDto>(url),
      );
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to fetch transaction status for ${id}`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve transaction status.',
      );
    }
  }

  async getJob(jobId: string): Promise<GetJobResponseDto> {
    const url = `${this.blockchainServiceUrl}/jobs/${jobId}`;
    this.logger.log(`Proxying job status request for jobId ${jobId}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<GetJobResponseDto>(url),
      );
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to fetch job status for ${jobId}`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException('Failed to retrieve job status.');
    }
  }

  async indexTransaction(dto: CreateChainTransactionRequestDto): Promise<void> {
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Skipping transaction indexing.');
      return;
    }
    
    const url = `${this.indexerApiUrl}/transactions`;
    await firstValueFrom(
      this.httpService.post(url, dto).pipe(
        catchError((err: AxiosError) => {
          this.logger.error(err.response?.data);
          throw new InternalServerErrorException(
            'Failed to index transaction.',
          );
        }),
      ),
    );
  }

  async reindexTransaction(
    id: string,
    dto: UpdateChainTransactionRequestDto,
  ): Promise<void> {
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Skipping transaction reindexing.');
      return;
    }
    
    const url = `${this.indexerApiUrl}/transactions/${id}`;
    await firstValueFrom(
      this.httpService.patch(url, dto).pipe(
        catchError((err: AxiosError) => {
          this.logger.error(
            `Failed to reindex transaction ${dto.txHash}`,
            err.response?.data,
          );
          throw new InternalServerErrorException(
            'Failed to reindex transaction.',
          );
        }),
      ),
    );
  }

  async getRawTransactionReceipt(txHash: string) {
    const url = `${this.blockchainServiceUrl}/rpc/receipts/${txHash}`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<ethers.TransactionReceipt>(url),
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch raw transaction receipt for hash ${txHash}`,
        (error as AxiosError).response?.data,
      );
      throw new InternalServerErrorException(
        'Could not retrieve transaction receipt.',
      );
    }
  }
}
