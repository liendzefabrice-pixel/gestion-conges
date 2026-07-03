import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionRequestDto } from './dto/create-permission-request.dto';
import { HrReviewDto } from './dto/hr-review.dto';
import { DirectorDecisionDto } from './dto/director-decision.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post('requests')
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  async create(
    @CurrentUser() user: { id: number },
    @Body() dto: CreatePermissionRequestDto,
  ) {
    const employee = await this.permissionsService.getEmployeeByUserId(user.id);
    return this.permissionsService.create(employee.id, dto);
  }

  @Get('requests/my')
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  async findMyRequests(@CurrentUser() user: { id: number }) {
    const employee = await this.permissionsService.getEmployeeByUserId(user.id);
    return this.permissionsService.findByEmployee(employee.id);
  }

  @Get('requests')
  @Roles('HR', 'DIRECTOR', 'ADMIN')
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('requests/pending')
  @Roles('HR', 'ADMIN')
  findPending() {
    return this.permissionsService.findPending();
  }

  @Get('requests/hr-reviewed')
  @Roles('DIRECTOR', 'ADMIN')
  findHrReviewed() {
    return this.permissionsService.findHrReviewed();
  }

  @Get('requests/:id')
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findById(id);
  }

  @Patch('requests/:id/hr-review')
  @Roles('HR', 'ADMIN')
  hrReview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
    @Body() dto: HrReviewDto,
  ) {
    return this.permissionsService.hrReview(id, user.id, dto);
  }

  @Patch('requests/:id/decide')
  @Roles('DIRECTOR', 'ADMIN')
  directorDecision(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
    @Body() dto: DirectorDecisionDto,
  ) {
    return this.permissionsService.directorDecision(id, user.id, dto);
  }
}
