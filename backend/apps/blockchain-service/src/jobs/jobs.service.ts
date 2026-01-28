import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@app/database';
import {
  BlockchainJobStatus,
  CreateBlockchainJobRequestDto,
  CreateBlockchainJobResponseDto,
  GetJobResponseDto,
} from '@app/common';
import { ChainEventType, Prisma } from '@prisma/client';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('blockchain-jobs')
    private readonly blockchainJobsQueue: Queue,
  ) {}

  async createJob(
    dto: CreateBlockchainJobRequestDto,
    idempotencyKey: string,
  ): Promise<CreateBlockchainJobResponseDto> {
    const existingJob = await this.prisma.blockchainJob.findUnique({
      where: { idempotencyKey },
    });

    if (existingJob) {
      this.logger.log(
        `Idempotency key hit for ${idempotencyKey}. Returning existing job ${existingJob.id}.`,
      );
      return {
        jobId: existingJob.id,
        status: existingJob.status as CreateBlockchainJobResponseDto['status'],
      };
    }
    const { eventType, payload, txId } = dto;
    if (
      typeof payload !== 'object' ||
      payload === null ||
      Array.isArray(payload)
    ) {
      throw new BadRequestException('Job payload must be a valid object.');
    }

    const newJob = await this.prisma.blockchainJob.create({
      data: {
        idempotencyKey,
        eventType: eventType as ChainEventType,
        payloadJson: { ...payload, txId } as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Created new blockchain job ${newJob.id} for processing.`);

    await this.blockchainJobsQueue.add(
      'process-chain-job',
      { jobId: newJob.id },
      {
        jobId: newJob.id,
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return {
      jobId: newJob.id,
      status: newJob.status as BlockchainJobStatus,
    };
  }

  async getJob(jobId: string): Promise<GetJobResponseDto | null> {
    this.logger.log(`Fetching status for job ${jobId}`);
    const job = await this.prisma.blockchainJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return null;
    }

    return {
      jobId: job.id,
      status: job.status as BlockchainJobStatus,
      error: job.errorMessage,
    };
  }
}
