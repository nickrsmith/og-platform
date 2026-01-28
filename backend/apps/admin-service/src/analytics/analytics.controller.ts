import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

@Controller('analytics')
@UseGuards(AdminJwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('metrics')
  getPlatformMetrics() {
    return this.analyticsService.getPlatformMetrics();
  }

  @Get('revenue')
  getRevenueData() {
    return this.analyticsService.getRevenueData();
  }

  @Get('funnel')
  getFunnelData() {
    return this.analyticsService.getFunnelData();
  }

  @Get('users-by-category')
  getUsersByCategory() {
    return this.analyticsService.getUsersByCategory();
  }
}
