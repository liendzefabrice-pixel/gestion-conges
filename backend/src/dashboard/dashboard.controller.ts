import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@CurrentUser() user: { id: number; role: { name: string } }) {
    switch (user.role.name) {
      case 'ADMIN':
        return this.dashboardService.getAdminStats();
      case 'HR':
        return this.dashboardService.getHrStats();
      case 'DIRECTOR':
        return this.dashboardService.getDirectorStats();
      case 'EMPLOYEE':
        return this.dashboardService.getEmployeeStats(user.id);
      default:
        return {};
    }
  }
}
