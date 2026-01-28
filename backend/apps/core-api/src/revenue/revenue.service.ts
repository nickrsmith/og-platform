import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  CalculateRevenueSplitDto,
  RevenueSplitDto,
  RevenueStatsDto,
  OrganizationEarningsDto,
  FeeStructureDto,
  AssetCategory,
} from '@app/common';
import { PrismaService } from '@app/database';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * Revenue Distribution Service
 *
 * Calculates revenue splits based on:
 * - Asset category (Category C = free listing, 0% fees)
 * - Smart contract fee rates (read from contracts)
 * - Custom organization fees (if set)
 *
 * Provides both off-chain calculation (for preview) and
 * integration with smart contract revenue distribution.
 */
@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);
  private readonly blockchainServiceUrl: string;

  // Default platform fees (basis points: 500 = 5%, 100 = 1%)
  // These are fallbacks - actual fees are read from smart contracts
  private readonly DEFAULT_Empressa_FEE = 500; // 5%
  private readonly DEFAULT_INTEGRATOR_FEE = 100; // 1%

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.blockchainServiceUrl = this.configService.getOrThrow(
      'BLOCKCHAIN_SERVICE_URL',
    );
  }

  /**
   * Calculate revenue split for a transaction
   * This is an off-chain calculation for preview/validation
   * Actual distribution happens on-chain via smart contracts
   */
  async calculateRevenueSplit(
    dto: CalculateRevenueSplitDto,
  ): Promise<RevenueSplitDto> {
    this.logger.log(
      `Calculating revenue split for amount ${dto.amount}, category ${dto.category}`,
    );

    // Category C = free listing (0% fees)
    const isFreeListing = dto.category === AssetCategory.C;

    if (isFreeListing) {
      return {
        totalAmount: dto.amount,
        creatorAmount: dto.amount, // 100% to creator
        EmpressaFee: 0,
        integratorFee: 0,
        EmpressaFeePercentage: 0,
        integratorFeePercentage: 0,
        isFreeListing: true,
        category: dto.category,
      };
    }

    // Get fee rates from smart contract (or use defaults)
    const feeStructure = await this.getFeeStructure(dto.orgContractAddress);

    // Calculate fees using the same formula as smart contract
    // Smart contract formula: fee = (amount * feePct) / (10000 + totalFeePct)
    const totalFeePercentage =
      feeStructure.EmpressaFeePercentage + feeStructure.integratorFeePercentage;
    const EmpressaFee =
      (dto.amount * feeStructure.EmpressaFeePercentage) /
      (10000 + totalFeePercentage);
    const integratorFee =
      (dto.amount * feeStructure.integratorFeePercentage) /
      (10000 + totalFeePercentage);
    const creatorAmount =
      (dto.amount * 10000) / (10000 + totalFeePercentage);

    return {
      totalAmount: dto.amount,
      creatorAmount: Math.round(creatorAmount),
      EmpressaFee: Math.round(EmpressaFee),
      integratorFee: Math.round(integratorFee),
      EmpressaFeePercentage: feeStructure.EmpressaFeePercentage,
      integratorFeePercentage: feeStructure.integratorFeePercentage,
      isFreeListing: false,
      category: dto.category,
    };
  }

  /**
   * Get fee structure for an organization
   * Reads from smart contract (custom fees or platform defaults)
   */
  async getFeeStructure(
    orgContractAddress: string,
  ): Promise<FeeStructureDto> {
    try {
      // Try to get custom fees from revenue distributor contract
      const url = `${this.blockchainServiceUrl}/rpc/revenue-distributor/fees/${orgContractAddress}`;
      const { data } = await firstValueFrom(
        this.httpService.get<{
          EmpressaFeePct: string;
          integratorFeePct: string;
          hasCustomFees: boolean;
        }>(url),
      );

      return {
        orgContractAddress,
        EmpressaFeePercentage: parseInt(data.EmpressaFeePct, 10),
        integratorFeePercentage: parseInt(data.integratorFeePct, 10),
        hasCustomFees: data.hasCustomFees,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.warn(
        `Failed to fetch fee structure from smart contract, using defaults: ${axiosError.message}`,
      );

      // Fallback to default platform fees
      return {
        orgContractAddress,
        EmpressaFeePercentage: this.DEFAULT_Empressa_FEE,
        integratorFeePercentage: this.DEFAULT_INTEGRATOR_FEE,
        hasCustomFees: false,
      };
    }
  }

  /**
   * Get revenue statistics for an organization
   * Reads from smart contract revenue distributor
   */
  async getRevenueStats(
    orgContractAddress: string,
  ): Promise<RevenueStatsDto> {
    try {
      const url = `${this.blockchainServiceUrl}/rpc/revenue-distributor/stats/${orgContractAddress}`;
      const { data } = await firstValueFrom(
        this.httpService.get<{
          total: string;
          creatorTotal: string;
          EmpressaTotal: string;
          integratorTotal: string;
        }>(url),
      );

      // Get pending earnings
      const earningsUrl = `${this.blockchainServiceUrl}/rpc/revenue-distributor/earnings/${orgContractAddress}`;
      const earningsData = await firstValueFrom(
        this.httpService.get<{
          pendingEmpressa: string;
          pendingIntegrator: string;
          pendingCreators: string;
          distributedEmpressa: string;
          distributedIntegrator: string;
          distributedCreators: string;
        }>(earningsUrl),
      );

      return {
        orgContractAddress,
        totalRevenue: parseInt(data.total, 10),
        creatorRevenue: parseInt(data.creatorTotal, 10),
        EmpressaRevenue: parseInt(data.EmpressaTotal, 10),
        integratorRevenue: parseInt(data.integratorTotal, 10),
        pendingCreatorEarnings: parseInt(earningsData.data.pendingCreators, 10),
        pendingEmpressaEarnings: parseInt(earningsData.data.pendingEmpressa, 10),
        pendingIntegratorEarnings: parseInt(earningsData.data.pendingIntegrator, 10),
        distributedCreatorEarnings: parseInt(
          earningsData.data.distributedCreators,
          10,
        ),
        distributedEmpressaEarnings: parseInt(
          earningsData.data.distributedEmpressa,
          10,
        ),
        distributedIntegratorEarnings: parseInt(
          earningsData.data.distributedIntegrator,
          10,
        ),
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to fetch revenue stats: ${axiosError.message}`,
        axiosError.response?.data,
      );
      throw new Error('Failed to retrieve revenue statistics');
    }
  }

  /**
   * Get organization earnings (pending and distributed)
   */
  async getOrganizationEarnings(
    organizationId: string,
  ): Promise<OrganizationEarningsDto> {
    // Get organization contract address
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { contractAddress: true },
    });

    if (!org || !org.contractAddress) {
      throw new Error(
        `Organization ${organizationId} has no contract address`,
      );
    }

    try {
      const url = `${this.blockchainServiceUrl}/rpc/revenue-distributor/earnings/${org.contractAddress}`;
      const { data } = await firstValueFrom(
        this.httpService.get<{
          pendingEmpressa: string;
          pendingIntegrator: string;
          pendingCreators: string;
          distributedEmpressa: string;
          distributedIntegrator: string;
          distributedCreators: string;
        }>(url),
      );

      const pendingTotal =
        parseInt(data.pendingEmpressa, 10) +
        parseInt(data.pendingIntegrator, 10) +
        parseInt(data.pendingCreators, 10);

      const distributedTotal =
        parseInt(data.distributedEmpressa, 10) +
        parseInt(data.distributedIntegrator, 10) +
        parseInt(data.distributedCreators, 10);

      return {
        organizationId,
        orgContractAddress: org.contractAddress,
        pendingTotal,
        distributedTotal,
        pendingCreatorEarnings: parseInt(data.pendingCreators, 10),
        pendingEmpressaEarnings: parseInt(data.pendingEmpressa, 10),
        pendingIntegratorEarnings: parseInt(data.pendingIntegrator, 10),
        distributedCreatorEarnings: parseInt(data.distributedCreators, 10),
        distributedEmpressaEarnings: parseInt(data.distributedEmpressa, 10),
        distributedIntegratorEarnings: parseInt(
          data.distributedIntegrator,
          10,
        ),
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to fetch organization earnings: ${axiosError.message}`,
        axiosError.response?.data,
      );
      throw new Error('Failed to retrieve organization earnings');
    }
  }

  /**
   * Calculate net amount for creator (after fees)
   * Useful for displaying "you will receive" amounts
   */
  calculateNetCreatorAmount(
    grossAmount: number,
    category: AssetCategory,
    EmpressaFeePct: number,
    integratorFeePct: number,
  ): number {
    if (category === AssetCategory.C) {
      return grossAmount; // Free listing, no fees
    }

    const totalFeePct = EmpressaFeePct + integratorFeePct;
    return Math.round((grossAmount * 10000) / (10000 + totalFeePct));
  }

  /**
   * Calculate gross amount (including fees) from net creator amount
   * Useful for calculating listing price from desired net amount
   */
  calculateGrossAmount(
    netCreatorAmount: number,
    category: AssetCategory,
    EmpressaFeePct: number,
    integratorFeePct: number,
  ): number {
    if (category === AssetCategory.C) {
      return netCreatorAmount; // Free listing, no fees
    }

    const totalFeePct = EmpressaFeePct + integratorFeePct;
    return Math.round(
      (netCreatorAmount * (10000 + totalFeePct)) / 10000,
    );
  }
}

