import { Test, TestingModule } from '@nestjs/testing';
import { RpcService } from './rpc.service';
import { EthersJSProvider } from '../processing/ethersjs.provider';
import { ContractAddressManager } from '../processing/contract-address.manager';
import { ethers } from 'ethers';

describe('RpcService', () => {
  let service: RpcService;
  let ethersProvider: jest.Mocked<EthersJSProvider>;
  let addressManager: jest.Mocked<ContractAddressManager>;
  let mockProvider: jest.Mocked<ethers.JsonRpcProvider>;
  let mockUsdcContract: jest.Mocked<ethers.Contract>;
  let mockRegistryContract: jest.Mocked<ethers.Contract>;
  let mockFactoryContract: jest.Mocked<ethers.Contract>;
  let mockOrgContract: jest.Mocked<ethers.Contract>;
  let mockRevenueContract: jest.Mocked<ethers.Contract>;

  beforeEach(async () => {
    // Create mock contracts
    mockUsdcContract = {
      balanceOf: jest.fn(),
    } as unknown as jest.Mocked<ethers.Contract>;

    mockRegistryContract = {
      globalAssetHashExists: jest.fn(),
    } as unknown as jest.Mocked<ethers.Contract>;

    mockFactoryContract = {
      getPlatformFees: jest.fn(),
    } as unknown as jest.Mocked<ethers.Contract>;

    mockOrgContract = {
      integrationPartner: jest.fn(),
      revenueDistributor: jest.fn(),
    } as unknown as jest.Mocked<ethers.Contract>;

    mockRevenueContract = {
      getOrgPendingTotal: jest.fn(),
    } as unknown as jest.Mocked<ethers.Contract>;

    // Create mock provider
    mockProvider = {
      getBalance: jest.fn(),
      getTransactionReceipt: jest.fn(),
    } as unknown as jest.Mocked<ethers.JsonRpcProvider>;

    // Create mock EthersJSProvider
    const mockEthersProvider = {
      getProvider: jest.fn().mockReturnValue(mockProvider),
      getContract: jest.fn(),
    };

    // Create mock ContractAddressManager
    const mockAddressManager = {
      getUsdcAddress: jest.fn(),
      getAssetRegistryAddress: jest.fn(),
      getFactoryAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RpcService,
        {
          provide: EthersJSProvider,
          useValue: mockEthersProvider,
        },
        {
          provide: ContractAddressManager,
          useValue: mockAddressManager,
        },
      ],
    }).compile();

    service = module.get<RpcService>(RpcService);
    ethersProvider = module.get(EthersJSProvider);
    addressManager = module.get(ContractAddressManager);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWalletBalance', () => {
    const walletAddress = '0x1234567890123456789012345678901234567890';
    const usdcAddress = '0xUSDC12345678901234567890123456789012345678';

    it('should return native and USDC balance', async () => {
      // Arrange
      const nativeBalance = ethers.parseEther('1.5');
      const usdcBalance = BigInt('1000000000'); // 1000 USDC (6 decimals)

      addressManager.getUsdcAddress.mockReturnValue(usdcAddress);
      mockProvider.getBalance.mockResolvedValue(nativeBalance);
      ethersProvider.getContract.mockReturnValue(mockUsdcContract);
      mockUsdcContract.balanceOf.mockResolvedValue(usdcBalance);

      // Act
      const result = await service.getWalletBalance(walletAddress);

      // Assert
      expect(result).toEqual({
        nativeBalance: nativeBalance.toString(),
        usdcBalance: usdcBalance.toString(),
      });
      expect(mockProvider.getBalance as jest.Mock).toHaveBeenCalledWith(
        walletAddress,
      );
      expect(addressManager.getUsdcAddress as jest.Mock).toHaveBeenCalled();
      expect(ethersProvider.getContract as jest.Mock).toHaveBeenCalledWith(
        'MockUSDC',
        usdcAddress,
      );
      expect(
        mockUsdcContract.balanceOf as unknown as jest.Mock,
      ).toHaveBeenCalledWith(walletAddress);
    });
  });

  describe('getTransactionReceipt', () => {
    const txHash =
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    it('should return transaction receipt when it exists', async () => {
      // Arrange
      const mockReceipt = {
        hash: txHash,
        blockNumber: 12345,
        status: 1,
      } as ethers.TransactionReceipt;

      mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);

      // Act
      const result = await service.getTransactionReceipt(txHash);

      // Assert
      expect(result).toEqual(mockReceipt);
      expect(
        mockProvider.getTransactionReceipt as jest.Mock,
      ).toHaveBeenCalledWith(txHash);
    });

    it('should return null when transaction receipt does not exist', async () => {
      // Arrange
      mockProvider.getTransactionReceipt.mockResolvedValue(null);

      // Act
      const result = await service.getTransactionReceipt(txHash);

      // Assert
      expect(result).toBeNull();
      expect(
        mockProvider.getTransactionReceipt as jest.Mock,
      ).toHaveBeenCalledWith(txHash);
    });
  });

  describe('checkAssetHash', () => {
    const hash = 'QmHash12345678901234567890123456789012345678901234567890';
    const registryAddress = '0xREGISTRY12345678901234567890123456789012345678';

    it('should return exists: true when hash exists', async () => {
      // Arrange
      addressManager.getAssetRegistryAddress.mockReturnValue(registryAddress);
      ethersProvider.getContract.mockReturnValue(mockRegistryContract);
      mockRegistryContract.globalAssetHashExists.mockResolvedValue(true);

      // Act
      const result = await service.checkAssetHash(hash);

      // Assert
      expect(result).toEqual({ exists: true });
      expect(
        addressManager.getAssetRegistryAddress as jest.Mock,
      ).toHaveBeenCalled();
      expect(ethersProvider.getContract as jest.Mock).toHaveBeenCalledWith(
        'EmpressaAssetRegistry',
        registryAddress,
      );
      expect(
        mockRegistryContract.globalAssetHashExists as unknown as jest.Mock,
      ).toHaveBeenCalledWith(hash);
    });

    it('should return exists: false when hash does not exist', async () => {
      // Arrange
      addressManager.getAssetRegistryAddress.mockReturnValue(registryAddress);
      ethersProvider.getContract.mockReturnValue(mockRegistryContract);
      mockRegistryContract.globalAssetHashExists.mockResolvedValue(false);

      // Act
      const result = await service.checkAssetHash(hash);

      // Assert
      expect(result).toEqual({ exists: false });
    });
  });

  describe('getPlatformFees', () => {
    const factoryAddress = '0xFACTORY12345678901234567890123456789012345678';

    it('should return integrator and Empressa fees', async () => {
      // Arrange
      const integratorFee = BigInt('50000000000000000'); // 0.05 ETH
      const EmpressaFee = BigInt('100000000000000000'); // 0.1 ETH

      addressManager.getFactoryAddress.mockReturnValue(factoryAddress);
      ethersProvider.getContract.mockReturnValue(mockFactoryContract);
      mockFactoryContract.getPlatformFees.mockResolvedValue([
        integratorFee,
        EmpressaFee,
      ]);

      // Act
      const result = await service.getPlatformFees();

      // Assert
      expect(result).toEqual({
        integratorFee: integratorFee.toString(),
        EmpressaFee: EmpressaFee.toString(),
      });
      expect(addressManager.getFactoryAddress as jest.Mock).toHaveBeenCalled();
      expect(ethersProvider.getContract as jest.Mock).toHaveBeenCalledWith(
        'EmpressaContractFactoryUpgradeable',
        factoryAddress,
      );
      expect(
        mockFactoryContract.getPlatformFees as unknown as jest.Mock,
      ).toHaveBeenCalled();
    });
  });

  describe('getIntegrationPartner', () => {
    const orgContractAddress = '0xORG12345678901234567890123456789012345678';
    const integrationPartner =
      '0xPARTNER12345678901234567890123456789012345678';

    it('should return integration partner address', async () => {
      // Arrange
      ethersProvider.getContract.mockReturnValue(mockOrgContract);
      mockOrgContract.integrationPartner.mockResolvedValue(integrationPartner);

      // Act
      const result = await service.getIntegrationPartner(orgContractAddress);

      // Assert
      expect(result).toEqual({ integrationPartner });
      expect(ethersProvider.getContract as jest.Mock).toHaveBeenCalledWith(
        'EmpressaOrgContract',
        orgContractAddress,
      );
      expect(
        mockOrgContract.integrationPartner as unknown as jest.Mock,
      ).toHaveBeenCalled();
    });
  });

  describe('getOrganizationEarnings', () => {
    const orgContractAddress = '0xORG12345678901234567890123456789012345678';
    const revenueDistributorAddress =
      '0xREVENUE12345678901234567890123456789012345678';
    const pendingEarnings = BigInt('2000000000'); // 2000 USDC (6 decimals)

    it('should return pending earnings for organization', async () => {
      // Arrange
      ethersProvider.getContract
        .mockReturnValueOnce(mockOrgContract)
        .mockReturnValueOnce(mockRevenueContract);
      mockOrgContract.revenueDistributor.mockResolvedValue(
        revenueDistributorAddress,
      );
      mockRevenueContract.getOrgPendingTotal.mockResolvedValue(pendingEarnings);

      // Act
      const result = await service.getOrganizationEarnings(orgContractAddress);

      // Assert
      expect(result).toEqual({
        pendingEarnings: pendingEarnings.toString(),
      });
      expect(ethersProvider.getContract as jest.Mock).toHaveBeenCalledWith(
        'EmpressaOrgContract',
        orgContractAddress,
      );
      expect(
        mockOrgContract.revenueDistributor as unknown as jest.Mock,
      ).toHaveBeenCalled();
      expect(ethersProvider.getContract as jest.Mock).toHaveBeenCalledWith(
        'EmpressaRevenueDistributor',
        revenueDistributorAddress,
      );
      expect(
        mockRevenueContract.getOrgPendingTotal as unknown as jest.Mock,
      ).toHaveBeenCalledWith(orgContractAddress);
    });
  });
});
