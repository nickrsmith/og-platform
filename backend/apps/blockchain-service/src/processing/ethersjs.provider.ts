import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import {
  EmpressaContractFactoryUpgradeableAbi,
  EmpressaOrgContractAbi,
  EmpressaAssetRegistryAbi,
  EmpressaRevenueDistributorAbi,
  MockUSDCAbi,
} from '@app/common/abis';

type ContractName =
  | 'EmpressaContractFactoryUpgradeable'
  | 'EmpressaOrgContract'
  | 'EmpressaRevenueDistributor'
  | 'EmpressaAssetRegistry'
  | 'MockUSDC';

@Injectable()
export class EthersJSProvider {
  private readonly logger = new Logger(EthersJSProvider.name);
  private readonly provider: JsonRpcProvider;
  private readonly adminWallet: Wallet;
  private readonly faucetWallet: Wallet;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.getOrThrow<string>('RPC_URL');
    const privateKey = this.configService.getOrThrow<string>(
      'ADMIN_WALLET_PRIVATE_KEY',
    );

    const faucetPrivateKey = this.configService.getOrThrow<string>(
      'FAUCET_WALLET_PRIVATE_KEY',
    );

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.adminWallet = new ethers.Wallet(privateKey, this.provider);
    this.faucetWallet = new ethers.Wallet(faucetPrivateKey, this.provider);

    this.logger.log(
      `EthersJSProvider initialized. Connected to RPC at ${rpcUrl}.`,
    );
    this.logger.log(`Admin wallet address: ${this.adminWallet.address}`);
    this.logger.log(`Faucet wallet address: ${this.faucetWallet.address}`);
  }

  getProvider(): JsonRpcProvider {
    return this.provider;
  }
  /**
   * Gets a contract instance signed by the service's admin wallet.
   */
  getContract(
    contractName: ContractName,
    address: string,
    signer?: Wallet,
  ): Contract {
    const abi = this.getAbi(contractName);
    const wallet = signer || this.adminWallet;
    return new ethers.Contract(address, abi, wallet);
  }

  /**
   * Creates a temporary user wallet from a private key and gets a contract instance signed by it.
   */
  getContractForUser(
    contractName: ContractName,
    address: string,
    userPrivateKey: string,
  ): Contract {
    const abi = this.getAbi(contractName);
    const userWallet = new ethers.Wallet(userPrivateKey, this.provider);
    this.logger.log(
      `Created temporary signer for user wallet: ${userWallet.address}`,
    );
    return new ethers.Contract(address, abi, userWallet);
  }

  private getAbi(contractName: ContractName) {
    switch (contractName) {
      case 'EmpressaContractFactoryUpgradeable':
        return EmpressaContractFactoryUpgradeableAbi;
      case 'EmpressaOrgContract':
        return EmpressaOrgContractAbi;
      case 'EmpressaAssetRegistry':
        return EmpressaAssetRegistryAbi;
      case 'EmpressaRevenueDistributor':
        return EmpressaRevenueDistributorAbi;
      case 'MockUSDC':
        return MockUSDCAbi;
      default:
        throw new Error(
          `ABI for contract ${contractName as string} not found.`,
        );
    }
  }

  getAdminWallet(): Wallet {
    return this.adminWallet;
  }

  getFaucetWallet(): Wallet {
    return this.faucetWallet;
  }
}
