import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import {
  GetChainTransactionDto,
  CreateChainTransactionRequestDto,
  GetJobResponseDto,
  UpdateChainTransactionRequestDto,
} from '@app/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    };

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'BLOCKCHAIN_SERVICE_URL') {
          return 'http://blockchain-service';
        }
        if (key === 'INDEXER_API_URL') {
          return 'http://indexer-api';
        }
        return '';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    httpService = module.get(HttpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTransaction', () => {
    const mockTransaction: GetChainTransactionDto = {
      id: 'tx-123',
      txId: 'tx-123',
      txHash: '0xabc',
      eventType: 'CREATE_ASSET',
      status: 'PENDING',
      submittedAt: '2024-01-01T00:00:00Z',
      relatedObjectId: 'release-123',
    };

    it('should return transaction data', async () => {
      httpService.get.mockReturnValue(of({ data: mockTransaction }) as any);

      const result = await service.getTransaction('tx-123');

      expect(result).toEqual(mockTransaction);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://indexer-api/transactions/tx-123',
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Not found' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(service.getTransaction('tx-123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getJob', () => {
    const mockJob: GetJobResponseDto = {
      id: 'job-123',
      status: 'COMPLETED',
      result: { txHash: '0xabc' },
    };

    it('should return job data', async () => {
      httpService.get.mockReturnValue(of({ data: mockJob }) as any);

      const result = await service.getJob('job-123');

      expect(result).toEqual(mockJob);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://blockchain-service/jobs/job-123',
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Not found' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(service.getJob('job-123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('indexTransaction', () => {
    const mockDto: CreateChainTransactionRequestDto = {
      txId: 'tx-123',
      eventType: 'CREATE_ASSET',
      submittedAt: '2024-01-01T00:00:00Z',
      relatedObjectId: 'release-123',
    };

    it('should index transaction successfully', async () => {
      httpService.post.mockReturnValue(of({ data: {} }) as any);

      await service.indexTransaction(mockDto);

      expect(httpService.post).toHaveBeenCalledWith(
        'http://indexer-api/transactions',
        mockDto,
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.post.mockReturnValue(throwError(() => axiosError) as any);

      await expect(service.indexTransaction(mockDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('reindexTransaction', () => {
    const mockDto: UpdateChainTransactionRequestDto = {
      txHash: '0xabc',
      status: 'CONFIRMED',
    };

    it('should reindex transaction successfully', async () => {
      httpService.patch.mockReturnValue(of({ data: {} }) as any);

      await service.reindexTransaction('tx-123', mockDto);

      expect(httpService.patch).toHaveBeenCalledWith(
        'http://indexer-api/transactions/tx-123',
        mockDto,
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.patch.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.reindexTransaction('tx-123', mockDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getRawTransactionReceipt', () => {
    const mockReceipt = {
      transactionHash: '0xabc',
      blockNumber: 12345,
      status: 1,
    };

    it('should return transaction receipt', async () => {
      httpService.get.mockReturnValue(of({ data: mockReceipt }) as any);

      const result = await service.getRawTransactionReceipt('0xabc');

      expect(result).toEqual(mockReceipt);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://blockchain-service/rpc/receipts/0xabc',
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Not found' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(service.getRawTransactionReceipt('0xabc')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
