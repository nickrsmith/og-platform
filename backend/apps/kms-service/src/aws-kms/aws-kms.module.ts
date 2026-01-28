import { Module } from '@nestjs/common';
import { AwsKmsService } from './aws-kms.service';

@Module({
  providers: [AwsKmsService],
  exports: [AwsKmsService],
})
export class AwsKmsModule {}
