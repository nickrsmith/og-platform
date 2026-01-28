import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  type RequestWithUser,
  FindRoyaltyChartQueryDto,
  FindSalesQueryDto,
  JwtAuthGuard,
  PaginationQueryDto,
} from '@app/common';
import { GetP2PIdentityResponseDto } from '@app/common/dto/p2p-identity.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Request() req: RequestWithUser) {
    return this.usersService.getMyProfile(req.user.sub);
  }

  @Get('p2p/:peerId')
  findUserByPeerId(@Param('peerId') peerId: string) {
    // This is a public endpoint to resolve a P2P key to a user profile
    return this.usersService.findUserByPeerId(peerId);
  }

  @Get('me/p2p-identity')
  @UseGuards(JwtAuthGuard)
  getP2PIdentity(
    @Request() req: RequestWithUser,
  ): Promise<GetP2PIdentityResponseDto> {
    return this.usersService.getP2PIdentity(req.user.sub);
  }

  @Get('me/wallet/balance')
  @UseGuards(JwtAuthGuard)
  getMyWalletBalance(@Request() req: RequestWithUser) {
    return this.usersService.getMyWalletBalance(req.user.sub);
  }

  @Get('me/sales')
  @UseGuards(JwtAuthGuard)
  getMySales(
    @Request() req: RequestWithUser,
    @Query(new ValidationPipe({ transform: true }))
    query: Omit<FindSalesQueryDto, 'creatorPeerId'>,
  ) {
    return this.usersService.getMySales(req.user.peerId, query);
  }

  @Get('me/transaction-history')
  @UseGuards(JwtAuthGuard)
  getMyTransactionHistory(
    @Request() req: RequestWithUser,
    @Query(new ValidationPipe({ transform: true })) query: PaginationQueryDto,
  ) {
    return this.usersService.getMyTransactionHistory(req.user.peerId, query);
  }

  @Get('me/royalty-chart')
  @UseGuards(JwtAuthGuard)
  getMyRoyaltyChartData(
    @Request() req: RequestWithUser,
    @Query(new ValidationPipe({ transform: true }))
    query: Omit<FindRoyaltyChartQueryDto, 'creatorPeerId'>,
  ) {
    return this.usersService.getMyRoyaltyChartData(req.user.peerId, query);
  }
}
