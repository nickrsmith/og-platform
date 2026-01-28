import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { AssetCategory } from '@app/common';
import { RevenueService } from '../revenue/revenue.service';

export interface SettlementCalculationInput {
  purchasePrice: number;
  category: AssetCategory;
  orgContractAddress: string;
  integrationPartnerAddress?: string;
  assetOwnerAddress: string;
  earnestAmount?: number;
  prorations?: Record<string, number>;
  adjustments?: Record<string, number>;
}

export interface SettlementCalculationResult {
  purchasePrice: number;
  earnestAmount?: number;
  platformFee: number;
  integratorFee: number;
  creatorAmount: number;
  prorations: Record<string, number>;
  adjustments: Record<string, number>;
  totalProrations: number;
  totalAdjustments: number;
  netProceeds: number;
}

/**
 * Settlement Service
 *
 * Calculates settlement amounts including:
 * - Platform and integrator fees (from Revenue Distribution Service)
 * - Creator/owner proceeds
 * - Prorations (taxes, royalties, etc.)
 * - Adjustments
 * - Net proceeds to seller
 */
@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(private readonly revenueService: RevenueService) {}

  /**
   * Calculate settlement amounts for a transaction
   */
  async calculateSettlement(
    input: SettlementCalculationInput,
  ): Promise<SettlementCalculationResult> {
    this.logger.log(
      `Calculating settlement for purchase price ${input.purchasePrice}, category ${input.category}`,
    );

    // Get revenue split from Revenue Distribution Service
    const revenueSplit = await this.revenueService.calculateRevenueSplit({
      amount: input.purchasePrice,
      category: input.category,
      orgContractAddress: input.orgContractAddress,
      integrationPartnerAddress: input.integrationPartnerAddress,
      assetOwnerAddress: input.assetOwnerAddress,
    });

    // Calculate prorations total
    const prorations = input.prorations || {};
    const totalProrations = Object.values(prorations).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    // Calculate adjustments total
    const adjustments = input.adjustments || {};
    const totalAdjustments = Object.values(adjustments).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    // Net proceeds = creator amount - prorations - adjustments
    // (Prorations and adjustments are typically deducted from seller proceeds)
    const netProceeds =
      revenueSplit.creatorAmount - totalProrations - totalAdjustments;

    return {
      purchasePrice: input.purchasePrice,
      earnestAmount: input.earnestAmount,
      platformFee: revenueSplit.EmpressaFee,
      integratorFee: revenueSplit.integratorFee,
      creatorAmount: revenueSplit.creatorAmount,
      prorations,
      adjustments,
      totalProrations,
      totalAdjustments,
      netProceeds: Math.max(0, netProceeds), // Ensure non-negative
    };
  }

  /**
   * Generate settlement statement document
   */
  generateSettlementStatement(
    transactionId: string,
    calculation: SettlementCalculationResult,
    buyerName: string,
    sellerName: string,
    assetId: string,
    closingDate: Date,
  ): Record<string, any> {
    this.logger.log(`Generating settlement statement for transaction ${transactionId}`);

    return {
      transactionId,
      buyerName,
      sellerName,
      assetId,
      closingDate: closingDate.toISOString(),
      generatedAt: new Date().toISOString(),
      purchasePrice: calculation.purchasePrice,
      earnestAmount: calculation.earnestAmount || 0,
      fees: {
        platformFee: calculation.platformFee,
        integratorFee: calculation.integratorFee,
        totalFees: calculation.platformFee + calculation.integratorFee,
      },
      prorations: calculation.prorations,
      adjustments: calculation.adjustments,
      totals: {
        totalProrations: calculation.totalProrations,
        totalAdjustments: calculation.totalAdjustments,
        grossProceeds: calculation.creatorAmount,
        netProceeds: calculation.netProceeds,
      },
      breakdown: {
        purchasePrice: calculation.purchasePrice,
        minusFees: calculation.platformFee + calculation.integratorFee,
        equalsGrossProceeds: calculation.creatorAmount,
        minusProrations: calculation.totalProrations,
        minusAdjustments: calculation.totalAdjustments,
        equalsNetProceeds: calculation.netProceeds,
      },
    };
  }

  /**
   * Validate settlement calculation
   */
  validateSettlement(
    calculation: SettlementCalculationResult,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that fees + creator amount = purchase price (within rounding tolerance)
    const totalFees = calculation.platformFee + calculation.integratorFee;
    const expectedCreatorAmount = calculation.purchasePrice - totalFees;
    const tolerance = 0.01; // $0.01 tolerance for rounding

    if (
      Math.abs(calculation.creatorAmount - expectedCreatorAmount) > tolerance
    ) {
      errors.push(
        `Creator amount mismatch: expected ${expectedCreatorAmount}, got ${calculation.creatorAmount}`,
      );
    }

    // Check that net proceeds is non-negative
    if (calculation.netProceeds < 0) {
      errors.push(
        `Net proceeds is negative: ${calculation.netProceeds}. Prorations and adjustments exceed gross proceeds.`,
      );
    }

    // Check that net proceeds doesn't exceed creator amount
    if (calculation.netProceeds > calculation.creatorAmount) {
      errors.push(
        `Net proceeds (${calculation.netProceeds}) exceeds creator amount (${calculation.creatorAmount})`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

