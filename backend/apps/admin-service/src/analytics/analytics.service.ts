import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformMetrics() {
    this.logger.log('Fetching platform metrics');

    // Get counts from database
    const [users, organizations, releases, transactions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count(),
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM releases
      `.then((result) => Number(result[0]?.count || 0)),
      this.prisma.transaction.count(),
    ]);

    // Get active users (users with isActive = true)
    const activeUsers = await this.prisma.user.count({
      where: { isActive: true },
    });

    // Get verified users (users with personaVerified = true)
    const verifiedUsers = await this.prisma.user.count({
      where: { personaVerified: true },
    });

    return {
      users: {
        total: users,
        active: activeUsers,
        verified: verifiedUsers,
        pending: users - activeUsers,
      },
      organizations: {
        total: organizations,
        active: await this.prisma.organization.count({
          where: { status: 'ACTIVE' },
        }),
        unclaimed: await this.prisma.organization.count({
          where: { status: 'UNCLAIMED' },
        }),
      },
      releases: {
        total: releases,
        // TODO: Add more release metrics when available
      },
      transactions: {
        total: transactions,
        // TODO: Add more transaction metrics when available
      },
    };
  }

  async getRevenueData() {
    this.logger.log('Fetching revenue data');

    // TODO: Implement revenue calculation based on transactions
    // For now, return placeholder data
    return {
      totalRevenue: 0,
      monthlyRevenue: [],
      byCategory: {
        A: 0,
        B: 0,
        C: 0,
      },
    };
  }

  async getFunnelData() {
    this.logger.log('Fetching funnel data');

    // Get funnel stages
    const visitors = await this.prisma.user.count(); // Approximate
    const signedUp = await this.prisma.user.count();
    const verified = await this.prisma.user.count({
      where: { personaVerified: true },
    });
    const organizationsCreated = await this.prisma.organization.count();
    const releasesCreated = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM releases
    `.then((result) => Number(result[0]?.count || 0)));

    return {
      stages: [
        { name: 'Visitors', count: visitors, conversionRate: 100 },
        { name: 'Signed Up', count: signedUp, conversionRate: signedUp > 0 ? (signedUp / visitors) * 100 : 0 },
        { name: 'Verified', count: verified, conversionRate: verified > 0 ? (verified / signedUp) * 100 : 0 },
        { name: 'Organization Created', count: organizationsCreated, conversionRate: organizationsCreated > 0 ? (organizationsCreated / verified) * 100 : 0 },
        { name: 'Release Created', count: releasesCreated, conversionRate: releasesCreated > 0 ? (releasesCreated / organizationsCreated) * 100 : 0 },
      ],
    };
  }

  async getUsersByCategory() {
    this.logger.log('Fetching users by category');

    // Get all users with their organization memberships
    const users = await this.prisma.user.findMany({
      include: {
        memberships: {
          include: {
            organization: {
              select: { primaryIndustry: true },
            },
          },
        },
        organizationRequests: {
          select: { status: true },
        },
      },
    });

    // Categorize users (simplified logic - adjust based on actual business rules)
    const categoryCounts = {
      A: 0, // Major Operators
      B: 0, // Brokers
      C: 0, // Individual Mineral Owners
    };

    users.forEach((user) => {
      if (user.memberships.length > 0) {
        // User is part of an organization - likely Category A or B
        categoryCounts.A++; // Simplified: treat all org members as Category A
      } else if (user.organizationRequests.length > 0) {
        // User has requested organization - likely Category B
        categoryCounts.B++;
      } else {
        // User with no organization - likely Category C
        categoryCounts.C++;
      }
    });

    return categoryCounts;
  }
}
