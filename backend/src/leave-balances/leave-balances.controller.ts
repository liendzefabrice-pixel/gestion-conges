import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LeaveBalancesService } from './leave-balances.service';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leave-balances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveBalancesController {
  constructor(private readonly leaveBalancesService: LeaveBalancesService) {}

  @Get('my')
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  getMyBalances(@CurrentUser() user: { id: number }) {
    return this.leaveBalancesService.getMyBalances(user.id);
  }

  @Get()
  @Roles('HR', 'DIRECTOR', 'ADMIN')
  getAllBalances() {
    return this.leaveBalancesService.getAllBalances();
  }

  @Get(':employeeId')
  @Roles('HR', 'DIRECTOR', 'ADMIN')
  getEmployeeBalances(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.leaveBalancesService.getEmployeeBalances(employeeId);
  }

  @Post(':id/adjust')
  @Roles('ADMIN')
  adjustBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdjustBalanceDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.leaveBalancesService.adjustBalance(id, dto, user.id);
  }

  @Get(':id/adjustments')
  @Roles('ADMIN')
  getAdjustments(@Param('id', ParseIntPipe) id: number) {
    return this.leaveBalancesService.getAdjustments(id);
  }
}
