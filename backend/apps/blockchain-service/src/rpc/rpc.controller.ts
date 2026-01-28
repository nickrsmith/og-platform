import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { RpcService } from './rpc.service';

@Controller('rpc')
export class RpcController {
  constructor(private readonly rpcService: RpcService) {}

  @Get('/wallets/:walletAddress/balance')
  @HttpCode(HttpStatus.OK)
  getWalletBalance(@Param('walletAddress') walletAddress: string) {
    return this.rpcService.getWalletBalance(walletAddress);
  }

  @Get('/receipts/:txHash')
  @HttpCode(HttpStatus.OK)
  getTransactionReceipt(@Param('txHash') txHash: string) {
    return this.rpcService.getTransactionReceipt(txHash);
  }

  @Get('/assets/check-hash/:hash')
  @HttpCode(HttpStatus.OK)
  checkAssetHash(@Param('hash') hash: string) {
    return this.rpcService.checkAssetHash(hash);
  }

  @Get('/factory/fees')
  @HttpCode(HttpStatus.OK)
  getPlatformFees() {
    return this.rpcService.getPlatformFees();
  }

  @Get('/orgs/:orgContractAddress/integrator')
  @HttpCode(HttpStatus.OK)
  getIntegrationPartner(
    @Param('orgContractAddress') orgContractAddress: string,
  ) {
    return this.rpcService.getIntegrationPartner(orgContractAddress);
  }

  @Get('/orgs/:orgContractAddress/earnings')
  @HttpCode(HttpStatus.OK)
  getOrganizationEarnings(
    @Param('orgContractAddress') orgContractAddress: string,
  ) {
    return this.rpcService.getOrganizationEarnings(orgContractAddress);
  }

  @Get('/revenue-distributor/stats/:orgContractAddress')
  @HttpCode(HttpStatus.OK)
  getRevenueStats(
    @Param('orgContractAddress') orgContractAddress: string,
  ) {
    return this.rpcService.getRevenueStats(orgContractAddress);
  }

  @Get('/revenue-distributor/earnings/:orgContractAddress')
  @HttpCode(HttpStatus.OK)
  getOrgEarningsBreakdown(
    @Param('orgContractAddress') orgContractAddress: string,
  ) {
    return this.rpcService.getOrgEarningsBreakdown(orgContractAddress);
  }

  @Get('/revenue-distributor/fees/:orgContractAddress')
  @HttpCode(HttpStatus.OK)
  getCustomFees(
    @Param('orgContractAddress') orgContractAddress: string,
  ) {
    return this.rpcService.getCustomFees(orgContractAddress);
  }
}
