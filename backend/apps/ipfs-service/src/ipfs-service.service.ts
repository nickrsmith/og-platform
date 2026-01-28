import {
  IpfsJob,
  IpfsJobPayload,
  IpfsJobType,
  IpfsPersistenceJobResult,
} from '@app/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

@Injectable()
export class IpfsServiceService {
  private readonly logger = new Logger(IpfsServiceService.name);

  constructor(
    @InjectQueue('ipfs-pinning')
    private readonly pinningQueue: Queue<
      IpfsJobPayload,
      IpfsPersistenceJobResult,
      IpfsJobType
    >,
  ) {}

  async enqueuePinningJob(job: IpfsJob) {
    const startTime = Date.now();
    const { name, data } = job;

    // Both PinReleaseFilesPayload and PinOrganizationLogoPayload have organizationId
    const organizationId =
      'organizationId' in data ? data.organizationId : 'N/A';

    this.logger.log(
      `Enqueueing IPFS job: ${name} (organizationId: ${organizationId})`,
    );

    try {
      const addedJob = await Promise.race([
        this.pinningQueue.add(name, data, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(new Error('Queue operation timed out after 5 seconds')),
            5000,
          ),
        ),
      ]);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Successfully enqueued IPFS job ${addedJob.id} (took ${duration}ms)`,
      );

      return { jobId: addedJob.id, status: 'QUEUED' };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to enqueue IPFS job after ${duration}ms`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}
