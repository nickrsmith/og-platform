import { GetUserProfileResponseDto, FindQueryDto } from '@app/common';
import { PrismaService } from '@app/database';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: 'active' | 'suspended';
  category: 'A' | 'B' | 'C' | null;
  verified: boolean;
  joinDate: string;
  lastActive: string | null;
}

interface FindAllQuery extends FindQueryDto {
  status?: 'all' | 'active' | 'inactive';
  search?: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService) {}
  
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

  async findAll(query: FindAllQuery) {
    this.logger.log(`Finding all users with filters: ${JSON.stringify(query)}`);

    const { page = 1, limit = 50, status, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Filter by status (isActive)
    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    // Search by email, firstName, or lastName
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users with organization membership info to determine category
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          memberships: {
            include: {
              organization: {
                select: { primaryIndustry: true },
              },
            },
            take: 1,
          },
          organizationRequests: {
            select: { status: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Map to admin user list format
    const items: AdminUserListItem[] = users.map((user) => {
      // Determine category from organization primary industry or request
      let category: 'A' | 'B' | 'C' | null = null;
      if (user.memberships.length > 0) {
        // Category logic: Map organization primary industry to category
        // This is a simplified mapping - adjust based on actual business logic
        const org = user.memberships[0].organization;
        if (org.primaryIndustry) {
          // Simplified: Major operators = A, Brokers = B, Individual owners = C
          // Adjust this logic based on actual classification
          category = 'A'; // Default for now
        }
      } else if (user.organizationRequests.length > 0) {
        // If user has pending request, use request category if available
        category = 'B'; // Default for pending requests
      }

      // Get last active from most recent session or createdAt
      const lastActive = user.createdAt; // TODO: Add lastActive tracking to User model

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.isActive ? 'active' : 'suspended',
        category,
        verified: user.personaVerified,
        joinDate: user.createdAt.toISOString(),
        lastActive: lastActive ? lastActive.toISOString() : null,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(
    id: string,
    dto: { firstName?: string; lastName?: string; category?: 'A' | 'B' | 'C' },
  ) {
    this.logger.log(`Updating user ${id}`);

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Update user fields (category is not directly stored on user, skip for now)
    const updateData: any = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      isActive: updated.isActive,
    };
  }

  async suspend(id: string) {
    this.logger.log(`Suspending user ${id}`);

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      id: updated.id,
      email: updated.email,
      isActive: updated.isActive,
    };
  }

  async reactivate(id: string) {
    this.logger.log(`Reactivating user ${id}`);

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return {
      id: updated.id,
      email: updated.email,
      isActive: updated.isActive,
    };
  }
}
