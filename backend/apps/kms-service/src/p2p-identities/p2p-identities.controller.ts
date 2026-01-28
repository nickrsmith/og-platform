import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { P2pIdentitiesService } from './p2p-identities.service';
import { CreateP2PIdentityRequestDto } from '@app/common';

@Controller('p2p-identities')
export class P2pIdentitiesController {
  constructor(private readonly p2pIdentitiesService: P2pIdentitiesService) {}

  @Post()
  createP2PIdentity(
    @Body(new ValidationPipe())
    createP2PIdentityRequestDto: CreateP2PIdentityRequestDto,
  ) {
    return this.p2pIdentitiesService.createP2PIdentity(
      createP2PIdentityRequestDto,
    );
  }
}
