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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.remove(id);
  }

  @Post(':departmentId/services')
  @Roles('ADMIN')
  createService(
    @Param('departmentId', ParseIntPipe) departmentId: number,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.departmentsService.createService(departmentId, createServiceDto);
  }

  @Get(':departmentId/services')
  findServicesByDepartment(
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    return this.departmentsService.findServicesByDepartment(departmentId);
  }

  @Get('services/:id')
  findServiceById(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findServiceById(id);
  }

  @Patch('services/:id')
  @Roles('ADMIN')
  updateService(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.departmentsService.updateService(id, updateServiceDto);
  }

  @Delete('services/:id')
  @Roles('ADMIN')
  removeService(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.removeService(id);
  }
}
