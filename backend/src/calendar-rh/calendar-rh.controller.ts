import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CalendarRhService } from './calendar-rh.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('calendar-rh')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarRhController {
  constructor(private readonly service: CalendarRhService) {}

  @Get()
  @Roles('ADMIN', 'HR')
  getMonth(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('departmentId') departmentId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('leaveTypeId') leaveTypeId?: string,
    @Query('eventType') eventType?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getMonthData(month, year, {
      departmentId: departmentId ? Number(departmentId) : undefined,
      employeeId: employeeId ? Number(employeeId) : undefined,
      leaveTypeId: leaveTypeId ? Number(leaveTypeId) : undefined,
      eventType: eventType || undefined,
      priority: priority || undefined,
      status: status || undefined,
      search: search || undefined,
    });
  }

  @Get('stats')
  @Roles('ADMIN', 'HR')
  getStats(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.service.getStats(month, year);
  }
}
