import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { LeavePlanningService } from './leave-planning.service';
import { CreateLeavePlanningDto } from './dto/create-leave-planning.dto';
import { UpdateLeavePlanningDto } from './dto/update-leave-planning.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leave-planning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeavePlanningController {
  constructor(private readonly leavePlanningService: LeavePlanningService) {}

  @Post()
  @Roles('HR', 'ADMIN')
  create(
    @Body() dto: CreateLeavePlanningDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.leavePlanningService.create(dto, user.id);
  }

  @Get()
  @Roles('HR', 'ADMIN')
  findAll() {
    return this.leavePlanningService.findAll();
  }

  @Get('my')
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  findMy(@CurrentUser() user: { id: number }) {
    return this.leavePlanningService.findMyPlanning(user.id);
  }

  @Get('eligibility')
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  async checkEligibility(@CurrentUser() user: { id: number }) {
    const employee = await this.leavePlanningService.getEmployeeByUserId(user.id);
    return this.leavePlanningService.checkEligibility(employee);
  }

  @Get('employee/:employeeId')
  @Roles('HR', 'ADMIN')
  findByEmployeeId(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('year') year?: string,
  ) {
    return this.leavePlanningService.findByEmployeeId(
      employeeId,
      year ? parseInt(year) : undefined,
    );
  }

  @Get('dashboard-stats')
  @Roles('HR', 'ADMIN')
  getDashboardStats() {
    return this.leavePlanningService.getDashboardStats();
  }

  @Get(':id')
  @Roles('HR', 'ADMIN')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.leavePlanningService.findById(id);
  }

  @Patch(':id')
  @Roles('HR', 'ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeavePlanningDto,
  ) {
    return this.leavePlanningService.update(id, dto);
  }

  @Delete(':id')
  @Roles('HR', 'ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.leavePlanningService.remove(id);
  }
}
