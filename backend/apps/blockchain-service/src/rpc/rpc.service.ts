import { Injectable, Logger } from '@nestjs/common';
import { ContractAddressManager } from '../processing/contract-address.manager';
import { EthersJSProvider } from '../processing/ethersjs.provider';
import { ethers } from 'ethers';

@Injectable()
export class RpcService {
  private readonly logger = new Logger(RpcService.name);

  constructor(
    private readonly ethersProvider: EthersJSProvider,
    private readonly addressManager: ContractAddressManager,
  ) {}

  async getWalletBalance(
    walletAddress: string,
  ): Promise<{ nativeBalance: string; usdcBalance: string }> {
    this.logger.log(
      `Fetching native and USDC balance for wallet: ${walletAddress}`,
    );
    const provider = this.ethersProvider.getProvider();

    // Fetch native balance (e.g., ETH, MATIC)
    const nativeBalancePromise = provider.getBalance(walletAddress);

    // Fetch USDC balance
    const usdcContract = this.ethersProvider.getContract(
      'MockUSDC',
      this.addressManager.getUsdcAddress(),
    );
    const usdcBalancePromise = usdcContract.balanceOf(
      walletAddress,
    ) as Promise<bigint>;

    const [nativeBalance, usdcBalance] = await Promise.all([
      nativeBalancePromise,
      usdcBalancePromise,
    ]);

    return {
      nativeBalance: nativeBalance.toString(),
      usdcBalance: usdcBalance.toString(),
    };
  }

  async getTransactionReceipt(
    txHash: string,
  ): Promise<ethers.TransactionReceipt | null> {
    this.logger.log(`Fetching raw transaction receipt for hash: ${txHash}`);
    const provider = this.ethersProvider.getProvider();
    return provider.getTransactionReceipt(txHash);
  }

  async checkAssetHash(hash: string): Promise<{ exists: boolean }> {
    this.logger.log(`Checking for existence of asset hash: ${hash}`);
    const registryAddress = this.addressManager.getAssetRegistryAddress();
    const registryContract = this.ethersProvider.getContract(
      'EmpressaAssetRegistry',
      registryAddress,
    );
    const exists = (await registryContract.globalAssetHashExists(
      hash,
    )) as boolean;
    return { exists };
  }

  async getPlatformFees(): Promise<{
    integratorFee: string;
    EmpressaFee: string;
  }> {
    this.logger.log('Fetching platform fees from factory contract');
    const factoryAddress = this.addressManager.getFactoryAddress();
    const factoryContract = this.ethersProvider.getContract(
      'EmpressaContractFactoryUpgradeable',
      factoryAddress,
    );

    const [integratorFee, EmpressaFee] =
      (await factoryContract.getPlatformFees()) as [bigint, bigint];

    // Convert bigints to strings before returning
    return {
      integratorFee: integratorFee.toString(),
      EmpressaFee: EmpressaFee.toString(),
    };
  }

  async getIntegrationPartner(
    orgContractAddress: string,
  ): Promise<{ integrationPartner: string }> {
    this.logger.log(
      `Fetching integration partner for org contract: ${orgContractAddress}`,
    );
    const orgContract = this.ethersProvider.getContract(
      'EmpressaOrgContract',
      orgContractAddress,
    );
    const integrationPartner =
      (await orgContract.integrationPartner()) as string;
    return { integrationPartner };
  }

  async getOrganizationEarnings(
    orgContractAddress: string,
  ): Promise<{ pendingEarnings: string }> {
    this.logger.log(
      `Fetching pending earnings for org contract: ${orgContractAddress}`,
    );
    const revenueDistributorAddress = (await this.ethersProvider
      .getContract('EmpressaOrgContract', orgContractAddress)
      .revenueDistributor()) as string;

    const revenueContract = this.ethersProvider.getContract(
      'EmpressaRevenueDistributor',
      revenueDistributorAddress,
    );

    const pendingEarnings = (await revenueContract.getOrgPendingTotal(
      orgContractAddress,
    )) as bigint;
    return { pendingEarnings: pendingEarnings.toString() };
  }

  /**
   * Get revenue statistics for an organization
   */
  async getRevenueStats(
    orgContractAddress: string,
  ): Promise<{
    total: string;
    creatorTotal: string;
    EmpressaTotal: string;
    integratorTotal: string;
  }> {
    this.logger.log(
      `Fetching revenue stats for org contract: ${orgContractAddress}`,
    );
    const orgContract = this.ethersProvider.getContract(
      'EmpressaOrgContract',
      orgContractAddress,
    );
    const revenueDistributorAddress =
      (await orgContract.revenueDistributor()) as string;

    if (!revenueDistributorAddress || revenueDistributorAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Organization has no revenue distributor configured');
    }

    const revenueContract = this.ethersProvider.getContract(
      'EmpressaRevenueDistributor',
      revenueDistributorAddress,
    );

    const [total, creatorTotal, EmpressaTotal, integratorTotal] =
      (await revenueContract.getRevenueStats(
        orgContractAddress,
      )) as [bigint, bigint, bigint, bigint];

    return {
      total: total.toString(),
      creatorTotal: creatorTotal.toString(),
      EmpressaTotal: EmpressaTotal.toString(),
      integratorTotal: integratorTotal.toString(),
    };
  }

  /**
   * Get organization earnings breakdown
   */
  async getOrgEarningsBreakdown(
    orgContractAddress: string,
  ): Promise<{
    pendingEmpressa: string;
    pendingIntegrator: string;
    pendingCreators: string;
    distributedEmpressa: string;
    distributedIntegrator: string;
    distributedCreators: string;
  }> {
    this.logger.log(
      `Fetching earnings breakdown for org contract: ${orgContractAddress}`,
    );
    const orgContract = this.ethersProvider.getContract(
      'EmpressaOrgContract',
      orgContractAddress,
    );
    const revenueDistributorAddress =
      (await orgContract.revenueDistributor()) as string;

    if (!revenueDistributorAddress || revenueDistributorAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Organization has no revenue distributor configured');
    }

    const revenueContract = this.ethersProvider.getContract(
      'EmpressaRevenueDistributor',
      revenueDistributorAddress,
    );

    const [
      pendingEmpressa,
      pendingIntegrator,
      pendingCreators,
      distributedEmpressa,
      distributedIntegrator,
      distributedCreators,
    ] = (await revenueContract.getOrgEarnings(
      orgContractAddress,
    )) as [bigint, bigint, bigint, bigint, bigint, bigint];

    return {
      pendingEmpressa: pendingEmpressa.toString(),
      pendingIntegrator: pendingIntegrator.toString(),
      pendingCreators: pendingCreators.toString(),
      distributedEmpressa: distributedEmpressa.toString(),
      distributedIntegrator: distributedIntegrator.toString(),
      distributedCreators: distributedCreators.toString(),
    };
  }

  /**
   * Get custom fees for an organization
   */
  async getCustomFees(
    orgContractAddress: string,
  ): Promise<{
    EmpressaFeePct: string;
    integratorFeePct: string;
    hasCustomFees: boolean;
  }> {
    this.logger.log(
      `Fetching custom fees for org contract: ${orgContractAddress}`,
    );
    const orgContract = this.ethersProvider.getContract(
      'EmpressaOrgContract',
      orgContractAddress,
    );
    const revenueDistributorAddress =
      (await orgContract.revenueDistributor()) as string;

    if (!revenueDistributorAddress || revenueDistributorAddress === '0x0000000000000000000000000000000000000000') {
      // No revenue distributor, return platform defaults
      const platformFees = await this.getPlatformFees();
      return {
        EmpressaFeePct: platformFees.EmpressaFee,
        integratorFeePct: platformFees.integratorFee,
        hasCustomFees: false,
      };
    }

    const revenueContract = this.ethersProvider.getContract(
      'EmpressaRevenueDistributor',
      revenueDistributorAddress,
    );

    const [EmpressaFeePct, integratorFeePct] =
      (await revenueContract.getCustomFees(
        orgContractAddress,
      )) as [bigint, bigint];

    // Check if custom fees are set (we need to check the hasCustomFees mapping)
    // For now, we'll assume custom fees if they differ from platform defaults
    const platformFees = await this.getPlatformFees();
    const hasCustomFees =
      EmpressaFeePct.toString() !== platformFees.EmpressaFee ||
      integratorFeePct.toString() !== platformFees.integratorFee;

    return {
      EmpressaFeePct: EmpressaFeePct.toString(),
      integratorFeePct: integratorFeePct.toString(),
      hasCustomFees,
    };
  }
}
