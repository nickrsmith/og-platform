import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { IpfsServiceService } from './ipfs-service.service';
import { IpfsJobType, StoragePool, IpfsJob } from '@app/common';
import type { Queue } from 'bullmq';

describe('IpfsServiceService', () => {
  let service: IpfsServiceService;
  let pinningQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpfsServiceService,
        {
          provide: getQueueToken('ipfs-pinning'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<IpfsServiceService>(IpfsServiceService);
    pinningQueue = module.get(getQueueToken('ipfs-pinning'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueuePinningJob', () => {
    const jobOptions = {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    };

    it('should enqueue a pinning job successfully', async () => {
      const mockJob = { id: 'job-123' };
      pinningQueue.add.mockResolvedValue(mockJob as any);

      const job: IpfsJob = {
        name: IpfsJobType.PIN_RELEASE_FILES,
        data: {
          pool: StoragePool.VDAS,
          userId: 'user-123',
          organizationId: 'org-123',
          releaseId: 'release-123',
          siteAddress: '0xSiteAddress',
          actorPeerId: 'peer-123',
        },
      };

      const result = await service.enqueuePinningJob(job);

      expect(pinningQueue.add).toHaveBeenCalledWith(
        IpfsJobType.PIN_RELEASE_FILES,
        job.data,
        jobOptions,
      );
      expect(result).toEqual({
        jobId: 'job-123',
        status: 'QUEUED',
      });
    });

    it('should handle different job types', async () => {
      const mockJob = { id: 'job-456' };
      pinningQueue.add.mockResolvedValue(mockJob as any);

      const job: IpfsJob = {
        name: IpfsJobType.PIN_ORGANIZATION_LOGO,
        data: { organizationId: 'org-123', tempFilePath: '/tmp/logo.jpg' },
      };

      const result = await service.enqueuePinningJob(job);

      expect(pinningQueue.add).toHaveBeenCalledWith(
        IpfsJobType.PIN_ORGANIZATION_LOGO,
        { organizationId: 'org-123', tempFilePath: '/tmp/logo.jpg' },
        jobOptions,
      );
      expect(result).toEqual({
        jobId: 'job-456',
        status: 'QUEUED',
      });
    });

    it('should handle queue errors', async () => {
      const error = new Error('Queue error');
      pinningQueue.add.mockRejectedValue(error);

      const job: IpfsJob = {
        name: IpfsJobType.PIN_RELEASE_FILES,
        data: {
          pool: StoragePool.VDAS,
          userId: 'user-123',
          organizationId: 'org-123',
          releaseId: 'release-123',
          siteAddress: '0xSiteAddress',
          actorPeerId: 'peer-123',
        },
      };

      await expect(service.enqueuePinningJob(job)).rejects.toThrow(
        'Queue error',
      );
      expect(pinningQueue.add).toHaveBeenCalledWith(
        IpfsJobType.PIN_RELEASE_FILES,
        job.data,
        jobOptions,
      );
    });
  });
});
