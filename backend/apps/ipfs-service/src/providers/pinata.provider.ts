// apps/ipfs-service/src/providers/pinata.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  AddResult,
  IPersistenceProvider,
} from './persistence-provider.interface';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import { _calculateHashStream } from '@app/common';

@Injectable()
export class PinataProvider implements IPersistenceProvider {
  private readonly logger = new Logger(PinataProvider.name);
  private readonly apiUrl: string;
  private readonly jwt: string;
  private readonly uploadTimeout: number;
  private readonly pinTimeout: number;
  private readonly healthCheckTimeout: number;
  public readonly name = 'Pinata';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.getOrThrow<string>('PINATA_API_URL');
    this.jwt = this.configService.getOrThrow<string>('PINATA_JWT');
    this.uploadTimeout = this.configService.get<number>(
      'PINATA_UPLOAD_TIMEOUT',
      120000,
    ); // Default 2 minutes
    this.pinTimeout = this.configService.get<number>(
      'PINATA_PIN_TIMEOUT',
      30000,
    ); // Default 30 seconds
    this.healthCheckTimeout = this.configService.get<number>(
      'PINATA_HEALTH_CHECK_TIMEOUT',
      3000,
    ); // Default 3 seconds
  }

  async add(filePath: string, filename: string): Promise<AddResult> {
    // 1. Calculate asset hash using a stream.
    const assetHash = await _calculateHashStream(filePath);
    this.logger.log(`Calculated assetHash for ${filename}: ${assetHash}`);

    // 2. Stream the file for upload to keep memory usage low during the HTTP request.
    const form = new FormData();
    const fileStream = createReadStream(filePath);
    form.append('file', fileStream, filename);

    const response = await firstValueFrom(
      this.httpService.post<{ IpfsHash: string }>(
        `${this.apiUrl}/pinning/pinFileToIPFS`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${this.jwt}`,
          },
          timeout: this.uploadTimeout,
        },
      ),
    );

    return {
      cid: response.data.IpfsHash,
      assetHash,
    };
  }

  // For Pinata, the file is already pinned by `add`. This `pin` method
  // serves as an idempotent way to ensure the pin has a name.
  async pin(cid: string, _name: string): Promise<void> {
    this.logger.log(
      `Pinning for Pinata is handled by the 'add' step. Skipping redundant pin for CID: ${cid}`,
    );
    // Simply return a resolved promise.
    return Promise.resolve();
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Pinata's testAuthentication endpoint is a perfect health check.
      await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/data/testAuthentication`, {
          headers: { Authorization: `Bearer ${this.jwt}` },
          timeout: this.healthCheckTimeout,
        }),
      );
      return true;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.warn(
          `Pinata provider health check failed: ${error.message}`,
        );
      } else {
        this.logger.warn(
          `Pinata provider health check failed with an unknown error.`,
        );
      }
      return false;
    }
  }
}
