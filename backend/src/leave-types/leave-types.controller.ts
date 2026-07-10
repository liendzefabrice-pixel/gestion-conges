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
} from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('leave-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createLeaveTypeDto: CreateLeaveTypeDto) {
    return this.leaveTypesService.create(createLeaveTypeDto);
  }

  @Get()
  findAll() {
    return this.leaveTypesService.findAll();
  }

  @Get('active')
  findActive() {
    return this.leaveTypesService.findActive();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leaveTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto,
  ) {
    return this.leaveTypesService.update(id, updateLeaveTypeDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.leaveTypesService.remove(id);
  }
}
