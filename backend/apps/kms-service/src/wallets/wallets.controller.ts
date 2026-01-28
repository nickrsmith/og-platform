import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { CreateWalletRequestDto } from '@app/common';
import { WalletsKmsService } from './wallets-kms.service';

// It is critical that all endpoints in this controller are protected by robust,
// network-level security (e.g., firewall, VPC) to ensure they are only
// accessible by trusted internal microservices and never exposed to the public internet.

@Controller('wallets')
export class WalletsController {
  private readonly logger = new Logger(WalletsController.name);

  constructor(private readonly walletsService: WalletsKmsService) {}

  /**
   * Creates a new wallet for a user. This is part of the user provisioning flow.
   * Endpoint: POST /wallets
   */
  @Post()
  createWallet(
    @Body(new ValidationPipe()) createWalletRequestDto: CreateWalletRequestDto,
  ) {
    return this.walletsService.createWallet(createWalletRequestDto);
  }

  /**
   * Retrieves the decrypted private key for a specific user.
   * This is a highly sensitive internal endpoint.
   * Endpoint: GET /wallets/users/:userId/private-key
   */
  @Get('users/:userId/private-key')
  async getUserPrivateKey(@Param('userId') userId: string) {
    this.logger.warn(
      `Received request for private key of user ${userId}. This is a sensitive operation.`,
    );
    const privateKey = await this.walletsService.getPrivateKeyForUser(userId);
    return { privateKey };
  }

  /**
   * Retrieves the decrypted private key for the platform's verifier wallet.
   * This is a highly sensitive internal endpoint.
   * Endpoint: GET /wallets/platform/verifier-private-key
   */
  @Get('platform/verifier-private-key')
  getPlatformVerifierKey() {
    this.logger.warn(
      'Received request for the platform verifier private key. This is a sensitive operation.',
    );
    const privateKey = this.walletsService.getPlatformVerifierKey();
    return { privateKey };
  }
}
