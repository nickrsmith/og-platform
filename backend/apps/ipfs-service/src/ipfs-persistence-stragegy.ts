import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PinataProvider } from './providers/pinata.provider';
import { IPersistenceProvider } from './providers/persistence-provider.interface';

@Injectable()
export class PersistenceStrategy {
  private readonly logger = new Logger(PersistenceStrategy.name);
  // A prioritized list of all available providers.
  private readonly providers: IPersistenceProvider[];
  // Cache the last selected provider to avoid logging on every call
  private lastSelectedProvider: IPersistenceProvider | null = null;

  constructor(
    private readonly pinataProvider: PinataProvider,
  ) {
    // Pinata is the only IPFS provider (FuLa removed per MVP requirements).
    this.providers = [pinataProvider];
  }

  /**
   * Iterates through providers in priority order and returns the first one that is healthy.
   * Throws an error if no providers are available.
   */
  async getPrimaryProvider(): Promise<IPersistenceProvider> {
    for (const provider of this.providers) {
      if (await provider.isHealthy()) {
        // Only log when the provider changes
        if (this.lastSelectedProvider !== provider) {
          this.logger.log(`Using healthy provider: ${provider.name}`);
          this.lastSelectedProvider = provider;
        }
        return provider;
      }
      this.logger.warn(`Provider ${provider.name} is unhealthy. Trying next.`);
    }

    // If the loop completes without returning, no providers are healthy.
    this.lastSelectedProvider = null; // Reset cache when no providers are available
    throw new InternalServerErrorException(
      'All IPFS persistence providers are currently unavailable.',
    );
  }
}
