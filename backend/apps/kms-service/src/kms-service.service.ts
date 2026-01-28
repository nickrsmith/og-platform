import { Injectable } from '@nestjs/common';

@Injectable()
export class KmsServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
