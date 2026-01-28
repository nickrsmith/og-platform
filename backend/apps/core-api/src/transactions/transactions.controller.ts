import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '@app/common';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('/jobs/:jobId')
  @UseGuards(JwtAuthGuard)
  getJobStatus(@Param('jobId') jobId: string) {
    return this.transactionsService.getJob(jobId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) // Secure the endpoint
  getTransactionStatus(@Param('id') id: string) {
    return this.transactionsService.getTransaction(id);
  }
}
