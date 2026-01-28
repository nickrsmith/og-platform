import {
  FindRoyaltyChartQueryDto,
  FindSalesQueryDto,
  GetUserProfileResponseDto,
  PaginatedTransactionHistoryResponseDto,
  PaginationQueryDto,
  RoyaltyChartResponseDto,
  SalesAnalyticsResponseDto,
} from '@app/common';
import { GetP2PIdentityResponseDto } from '@app/common/dto/p2p-identity.dto';
import { PrismaService } from '@app/database';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { ethers } from 'ethers';
import { firstValueFrom } from 'rxjs';
import type { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly indexerApiUrl: string | null;
  private readonly blockchainServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.indexerApiUrl = this.configService.get<string>('INDEXER_API_URL') || null;
    this.blockchainServiceUrl = this.configService.getOrThrow(
      'BLOCKCHAIN_SERVICE_URL',
    );
    if (!this.indexerApiUrl) {
      this.logger.warn('Indexer API URL not configured. Analytics operations will be disabled.');
    }
  }

  async getMyProfile(userId: string): Promise<GetUserProfileResponseDto> {
    this.logger.log(`Fetching profile for current user: ${userId}`);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.firstName || !user.lastName || !user.profileImage) {
      throw new NotFoundException(
        `Profile data for user ${userId} is incomplete or not found.`,
      );
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
    };
  }

  async findUserByPeerId(peerId: string): Promise<GetUserProfileResponseDto> {
    this.logger.log(`Fetching user profile for Peer ID: ${peerId}`);

    // 1. Find the P2PIdentity record to get the associated userId
    const identity = await this.prisma.p2PIdentity.findUnique({
      where: { peerId },
      select: { userId: true },
    });

    if (!identity) {
      throw new NotFoundException(`No user found with Peer ID: ${peerId}`);
    }

    // 2. Find the user record using the userId
    const user = await this.prisma.user.findUnique({
      where: { id: identity.userId },
    });

    if (!user || !user.firstName || !user.lastName || !user.profileImage) {
      throw new NotFoundException(
        `Profile data for user ${identity.userId} is incomplete or not found.`,
      );
    }

    // 3. Return the public profile data
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
    };
  }

  async getP2PIdentity(userId: string): Promise<GetP2PIdentityResponseDto> {
    this.logger.log(`Fetching P2P identity for user ${userId}`);
    const identity = await this.prisma.p2PIdentity.findUnique({
      where: { userId },
    });

    if (!identity) {
      throw new NotFoundException(`P2P Identity not found for user ${userId}`);
    }

    return {
      peerId: identity.peerId,
      publicKey: identity.publicKey,
      encryptedPrivateKey: identity.encryptedPrivateKey,
      encryptedDek: identity.encryptedDek,
    };
  }

  async getMySales(
    creatorPeerId: string,
    query: Omit<FindSalesQueryDto, 'creatorPeerId'>,
  ) {
    if (!this.indexerApiUrl) {
      throw new InternalServerErrorException(
        'Sales analytics is not available. INDEXER_API_URL is not configured.',
      );
    }
    
    this.logger.log(`Fetching sales analytics for creator ${creatorPeerId}`);
    const url = `${this.indexerApiUrl}/analytics/sales`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<SalesAnalyticsResponseDto>(url, {
          params: { ...query, creatorPeerId },
        }),
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch sales for creator ${creatorPeerId}`,
        (error as AxiosError).response?.data,
      );
      throw new InternalServerErrorException(
        'Could not retrieve sales analytics.',
      );
    }
  }

  async getMyWalletBalance(userId: string): Promise<{
    nativeBalance: string;
    formattedNativeBalance: string;
    usdcBalance: string;
    formattedUsdcBalance: string;
  }> {
    this.logger.log(`Fetching wallet balance for user: ${userId}`);
    const cacheKey = `wallet-balance:${userId}`;

    // Update cache type to match new response shape
    const cachedBalance = await this.cacheManager.get<{
      nativeBalance: string;
      usdcBalance: string;
    }>(cacheKey);

    if (cachedBalance) {
      this.logger.log('Returning wallet balance from cache.');
      return {
        nativeBalance: cachedBalance.nativeBalance,
        formattedNativeBalance: ethers.formatEther(cachedBalance.nativeBalance),
        usdcBalance: cachedBalance.usdcBalance,
        formattedUsdcBalance: ethers.formatUnits(cachedBalance.usdcBalance, 6),
      };
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { walletAddress: true },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }

    const url = `${this.blockchainServiceUrl}/rpc/wallets/${wallet.walletAddress}/balance`;
    this.logger.log(`Attempting to fetch wallet balance from: ${url}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ nativeBalance: string; usdcBalance: string }>(
          url,
        ),
      );

      await this.cacheManager.set(cacheKey, data, 60);

      this.logger.log(
        `Successfully retrieved wallet balance for user ${userId}`,
      );
      return {
        nativeBalance: data.nativeBalance,
        formattedNativeBalance: ethers.formatEther(data.nativeBalance),
        usdcBalance: data.usdcBalance,
        formattedUsdcBalance: ethers.formatUnits(data.usdcBalance, 6),
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;
      const responseData = axiosError.response?.data;
      const errorMessage = axiosError.message;

      this.logger.error(
        `Failed to proxy wallet balance request for user ${userId}`,
        {
          url,
          walletAddress: wallet.walletAddress,
          statusCode,
          statusText,
          responseData,
          errorMessage,
          blockchainServiceUrl: this.blockchainServiceUrl,
        },
      );

      // Provide more specific error messages
      if (statusCode === 404) {
        throw new InternalServerErrorException(
          `Blockchain service endpoint not found. URL: ${url}. Please verify BLOCKCHAIN_SERVICE_URL is correct and blockchain-service is running.`,
        );
      } else if (statusCode === 503 || statusCode === 502) {
        throw new InternalServerErrorException(
          `Blockchain service unavailable. Please verify blockchain-service is running and healthy.`,
        );
      } else if (!axiosError.response) {
        throw new InternalServerErrorException(
          `Cannot reach Blockchain service at ${url}. Network error: ${errorMessage}`,
        );
      }

      throw new InternalServerErrorException(
        `Could not retrieve wallet balance. Status: ${statusCode} ${statusText}. Response: ${JSON.stringify(responseData)}`,
      );
    }
  }

  async getMyTransactionHistory(peerId: string, query: PaginationQueryDto) {
    if (!this.indexerApiUrl) {
      throw new InternalServerErrorException(
        'Transaction history is not available. INDEXER_API_URL is not configured.',
      );
    }
    
    this.logger.log(`Fetching transaction history for user peerId: ${peerId}`);
    const url = `${this.indexerApiUrl}/analytics/transaction-history/${peerId}`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<PaginatedTransactionHistoryResponseDto>(url, {
          params: query,
        }),
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch transaction history for user ${peerId}`,
        (error as AxiosError).response?.data,
      );
      throw new InternalServerErrorException(
        'Could not retrieve transaction history.',
      );
    }
  }

  async getMyRoyaltyChartData(
    creatorPeerId: string,
    query: Omit<FindRoyaltyChartQueryDto, 'creatorPeerId'>,
  ) {
    if (!this.indexerApiUrl) {
      throw new InternalServerErrorException(
        'Royalty chart data is not available. INDEXER_API_URL is not configured.',
      );
    }
    
    this.logger.log(`Fetching royalty chart data for creator ${creatorPeerId}`);
    const url = `${this.indexerApiUrl}/analytics/royalty-chart`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<RoyaltyChartResponseDto>(url, {
          params: { ...query, creatorPeerId },
        }),
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch royalty chart data for creator ${creatorPeerId}`,
        (error as AxiosError).response?.data,
      );
      throw new InternalServerErrorException(
        'Could not retrieve royalty chart data.',
      );
    }
  }
}
