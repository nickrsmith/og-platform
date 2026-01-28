import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContractAddressManager {
  constructor(private readonly configService: ConfigService) {}

  getFactoryAddress(): string {
    return this.configService.getOrThrow<string>(
      'FACTORY_PROXY_CONTRACT_ADDRESS',
    );
  }

  getAssetRegistryAddress(): string {
    return this.configService.getOrThrow<string>(
      'ASSET_REGISTRY_CONTRACT_ADDRESS',
    );
  }

  getUsdcAddress(): string {
    return this.configService.getOrThrow<string>('USDC_CONTRACT_ADDRESS');
  }

  // Add other contract getters here as they become needed
}
