import { Controller, Get, UseGuards } from '@nestjs/common';
import { LeaveAccrualService } from './leave-accrual.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leave-accrual')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveAccrualController {
  constructor(private readonly leaveAccrualService: LeaveAccrualService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  async getMyAccrual(@CurrentUser() user: { id: number }) {
    const employee = await this.leaveAccrualService.getEmployeeByUserId(user.id);
    return this.leaveAccrualService.calculate(employee.id);
  }
}
