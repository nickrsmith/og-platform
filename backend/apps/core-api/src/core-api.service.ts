import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import type { Cache } from 'cache-manager';
import { ethers } from 'ethers';
import { PrismaService } from '@app/database';

@Injectable()
export class CoreApiService {
  private readonly logger = new Logger(CoreApiService.name);
  private readonly blockchainServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.blockchainServiceUrl = this.configService.getOrThrow(
      'BLOCKCHAIN_SERVICE_URL',
    );
  }

  async getPlatformFees(organizationId?: string): Promise<{
    integratorFee: string;
    EmpressaFee: string;
  }> {
    // Use a more specific cache key if an organizationId is provided
    const cacheKey = organizationId
      ? `platform-fees:${organizationId}`
      : 'platform-fees:default';

    const cachedFees = await this.cacheManager.get<{
      integratorFee: string;
      EmpressaFee: string;
    }>(cacheKey);

    if (cachedFees) {
      this.logger.log(
        `Returning platform fees from cache for key: ${cacheKey}`,
      );
      return cachedFees;
    }

    this.logger.log(
      `Proxying platform fees request to blockchain-service (no cache for key: ${cacheKey})`,
    );
    const feesUrl = `${this.blockchainServiceUrl}/rpc/factory/fees`;

    try {
      // Step 1: Fetch the default platform fees
      const { data: defaultFees } = await firstValueFrom(
        this.httpService.get<{ integratorFee: string; EmpressaFee: string }>(
          feesUrl,
        ),
      );

      const finalFees = { ...defaultFees };

      // Step 2: If an org ID is provided, check for an integration partner
      if (organizationId) {
        const organization = await this.prisma.organization.findUnique({
          where: { id: organizationId },
          select: { contractAddress: true },
        });

        if (organization?.contractAddress) {
          const integratorUrl = `${this.blockchainServiceUrl}/rpc/orgs/${organization.contractAddress}/integrator`;
          const { data: integratorData } = await firstValueFrom(
            this.httpService.get<{ integrationPartner: string }>(integratorUrl),
          );
          this.logger.log(
            `DEBUG: Integrator partner for org ${organizationId}: ${integratorData.integrationPartner}`,
          );
          // Step 3: If no partner, override the integrator fee to 0
          if (integratorData.integrationPartner === ethers.ZeroAddress) {
            this.logger.log(
              `Organization ${organizationId} has no integration partner. Overriding integrator fee to 0.`,
            );
            finalFees.integratorFee = '0';
          }
        }
      }

      await this.cacheManager.set(cacheKey, finalFees, 3600); // Cache for 1 hour
      return finalFees;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to proxy platform fees request`,
        axiosError.response?.data,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve platform fees.',
      );
    }
  }
}
