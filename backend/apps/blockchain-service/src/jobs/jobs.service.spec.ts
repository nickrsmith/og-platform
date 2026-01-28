import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobsService } from './jobs.service';
import { PrismaService } from '@app/database';
import {
  CreateBlockchainJobRequestDto,
  ChainEventType,
  BlockchainJobStatus,
} from '@app/common';
import { Prisma } from '@prisma/client';

describe('JobsService', () => {
  let service: JobsService;
  let prismaService: {
    blockchainJob: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let blockchainJobsQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const mockPrismaService = {
      blockchainJob: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('blockchain-jobs'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    prismaService = module.get(PrismaService);
    blockchainJobsQueue = module.get(getQueueToken('blockchain-jobs'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createJob', () => {
    const idempotencyKey = 'test-idempotency-key-123';
    const dto: CreateBlockchainJobRequestDto = {
      eventType: ChainEventType.CREATE_ORG_CONTRACT,
      txId: 'tx-id-123',
      payload: { organizationId: 'org-123' },
    };

    it('should return existing job when idempotency key exists', async () => {
      // Arrange
      const existingJob = {
        id: 'existing-job-id',
        idempotencyKey,
        status: BlockchainJobStatus.QUEQUED,
        eventType: ChainEventType.CREATE_ORG_CONTRACT,
        payloadJson: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.blockchainJob.findUnique.mockResolvedValue(existingJob);

      // Act
      const result = await service.createJob(dto, idempotencyKey);

      // Assert
      expect(result).toEqual({
        jobId: existingJob.id,
        status: existingJob.status,
      });
      expect(prismaService.blockchainJob.findUnique).toHaveBeenCalledWith({
        where: { idempotencyKey },
      });
      expect(prismaService.blockchainJob.create).not.toHaveBeenCalled();
      expect(blockchainJobsQueue.add as jest.Mock).not.toHaveBeenCalled();
    });

    it('should create new job and add to queue with valid payload', async () => {
      // Arrange
      const newJob = {
        id: 'new-job-id',
        idempotencyKey,
        status: BlockchainJobStatus.QUEQUED,
        eventType: ChainEventType.CREATE_ORG_CONTRACT,
        payloadJson: {
          ...(dto.payload as Record<string, unknown>),
          txId: dto.txId,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.blockchainJob.findUnique.mockResolvedValue(null);
      prismaService.blockchainJob.create.mockResolvedValue(newJob);
      blockchainJobsQueue.add.mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof blockchainJobsQueue.add>>,
      );

      // Act
      const result = await service.createJob(dto, idempotencyKey);

      // Assert
      expect(result).toEqual({
        jobId: newJob.id,
        status: newJob.status,
      });
      expect(prismaService.blockchainJob.findUnique).toHaveBeenCalledWith({
        where: { idempotencyKey },
      });
      expect(prismaService.blockchainJob.create).toHaveBeenCalledWith({
        data: {
          idempotencyKey,
          eventType: dto.eventType,
          payloadJson: {
            ...(dto.payload as Record<string, unknown>),
            txId: dto.txId,
          } as Prisma.InputJsonValue,
        },
      });
      expect(blockchainJobsQueue.add as jest.Mock).toHaveBeenCalledWith(
        'process-chain-job',
        { jobId: newJob.id },
        {
          jobId: newJob.id,
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    });

    it('should throw BadRequestException when payload is null', async () => {
      // Arrange
      const invalidDto: CreateBlockchainJobRequestDto = {
        ...dto,
        payload: null as any,
      };

      prismaService.blockchainJob.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createJob(invalidDto, idempotencyKey),
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.blockchainJob.create).not.toHaveBeenCalled();
      expect(blockchainJobsQueue.add as jest.Mock).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payload is an array', async () => {
      // Arrange
      const invalidDto: CreateBlockchainJobRequestDto = {
        ...dto,
        payload: ['array', 'payload'] as any,
      };

      prismaService.blockchainJob.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createJob(invalidDto, idempotencyKey),
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.blockchainJob.create).not.toHaveBeenCalled();
      expect(blockchainJobsQueue.add as jest.Mock).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payload is not an object', async () => {
      // Arrange
      const invalidDto: CreateBlockchainJobRequestDto = {
        ...dto,
        payload: 'string-payload' as any,
      };

      prismaService.blockchainJob.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createJob(invalidDto, idempotencyKey),
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.blockchainJob.create).not.toHaveBeenCalled();
      expect(blockchainJobsQueue.add as jest.Mock).not.toHaveBeenCalled();
    });
  });

  describe('getJob', () => {
    const jobId = 'job-id-123';

    it('should return job data when job exists', async () => {
      // Arrange
      const job = {
        id: jobId,
        status: BlockchainJobStatus.SUCCESS,
        errorMessage: null,
        idempotencyKey: 'key-123',
        eventType: ChainEventType.CREATE_ORG_CONTRACT,
        payloadJson: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.blockchainJob.findUnique.mockResolvedValue(job);

      // Act
      const result = await service.getJob(jobId);

      // Assert
      expect(result).toEqual({
        jobId: job.id,
        status: job.status,
        error: job.errorMessage,
      });
      expect(prismaService.blockchainJob.findUnique).toHaveBeenCalledWith({
        where: { id: jobId },
      });
    });

    it('should return null when job does not exist', async () => {
      // Arrange
      prismaService.blockchainJob.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.getJob(jobId);

      // Assert
      expect(result).toBeNull();
      expect(prismaService.blockchainJob.findUnique).toHaveBeenCalledWith({
        where: { id: jobId },
      });
    });

    it('should return job with error message when job failed', async () => {
      // Arrange
      const job = {
        id: jobId,
        status: BlockchainJobStatus.ERROR,
        errorMessage: 'Transaction failed',
        idempotencyKey: 'key-123',
        eventType: ChainEventType.CREATE_ORG_CONTRACT,
        payloadJson: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.blockchainJob.findUnique.mockResolvedValue(job);

      // Act
      const result = await service.getJob(jobId);

      // Assert
      expect(result).toEqual({
        jobId: job.id,
        status: job.status,
        error: job.errorMessage,
      });
    });
  });
});
