import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateBlockchainJobRequestDto } from '@app/common';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  createJob(
    @Headers('X-Idempotency-Key') idempotencyKey: string,
    @Body(new ValidationPipe({ whitelist: true }))
    createJobDto: CreateBlockchainJobRequestDto,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('X-Idempotency-Key header is required.');
    }
    return this.jobsService.createJob(createJobDto, idempotencyKey);
  }

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string) {
    const jobStatus = await this.jobsService.getJob(jobId);
    if (!jobStatus) {
      throw new NotFoundException(`Job with ID ${jobId} not found.`);
    }
    return jobStatus;
  }
}
