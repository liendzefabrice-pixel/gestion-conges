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
import { LeaveService } from './leave.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { HrReviewDto } from './dto/hr-review.dto';
import { DirectorDecisionDto } from './dto/director-decision.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post('types')
  @Roles('ADMIN')
  createLeaveType(@Body() createLeaveTypeDto: CreateLeaveTypeDto) {
    return this.leaveService.createLeaveType(createLeaveTypeDto);
  }

  @Get('types')
  findAllLeaveTypes() {
    return this.leaveService.findAllLeaveTypes();
  }

  @Get('types/:id')
  findLeaveTypeById(@Param('id', ParseIntPipe) id: number) {
    return this.leaveService.findLeaveTypeById(id);
  }

  @Patch('types/:id')
  @Roles('ADMIN')
  updateLeaveType(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto,
  ) {
    return this.leaveService.updateLeaveType(id, updateLeaveTypeDto);
  }

  @Delete('types/:id')
  @Roles('ADMIN')
  removeLeaveType(@Param('id', ParseIntPipe) id: number) {
    return this.leaveService.removeLeaveType(id);
  }

  @Post('requests')
  @Roles('EMPLOYEE')
  async createRequest(
    @CurrentUser() user: { id: number; role: { name: string } },
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
  ) {
    const employee = await this.leaveService.getEmployeeByUserId(user.id);
    return this.leaveService.createRequest(employee.id, createLeaveRequestDto);
  }

  @Patch('requests/:id/cancel')
  @Roles('EMPLOYEE')
  async cancelRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    const employee = await this.leaveService.getEmployeeByUserId(user.id);
    return this.leaveService.cancelRequest(id, employee.id);
  }

  @Get('requests/my')
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  async findMyRequests(
    @CurrentUser() user: { id: number; role: { name: string } },
  ) {
    const employee = await this.leaveService.getEmployeeByUserId(user.id);
    return this.leaveService.findMyRequests(employee.id);
  }

  @Get('requests')
  @Roles('HR', 'DIRECTOR', 'ADMIN')
  findAllRequests() {
    return this.leaveService.findAllRequests();
  }

  @Get('requests/pending')
  @Roles('HR', 'ADMIN')
  findPendingRequests() {
    return this.leaveService.findRequestsByStatus(['EN_ATTENTE_RH']);
  }

  @Get('requests/hr-reviewed')
  @Roles('DIRECTOR', 'ADMIN')
  findHrReviewedRequests() {
    return this.leaveService.findRequestsByStatus(['AVIS_RH_RENDU']);
  }

  @Get('requests/:id')
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  findRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.leaveService.findRequestById(id);
  }

  @Patch('requests/:id/hr-review')
  @Roles('HR', 'ADMIN')
  hrReview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
    @Body() hrReviewDto: HrReviewDto,
  ) {
    return this.leaveService.hrReview(id, user.id, hrReviewDto);
  }

  @Patch('requests/:id/decide')
  @Roles('DIRECTOR', 'ADMIN')
  directorDecision(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
    @Body() directorDecisionDto: DirectorDecisionDto,
  ) {
    return this.leaveService.directorDecision(id, user.id, directorDecisionDto);
  }

  @Get('balance')
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  async getMyBalances(
    @CurrentUser() user: { id: number; role: { name: string } },
  ) {
    const employee = await this.leaveService.getEmployeeByUserId(user.id);
    return this.leaveService.getLeaveBalances(employee.id);
  }
}
