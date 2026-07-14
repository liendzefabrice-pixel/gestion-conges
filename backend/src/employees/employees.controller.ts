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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @Roles('ADMIN', 'HR', 'DIRECTOR')
  findAll() {
    return this.employeesService.findAll();
  }

  @Get('me')
  @Roles('EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN')
  findMe(@CurrentUser() user: { id: number }) {
    return this.employeesService.findByUserId(user.id);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'DIRECTOR')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.remove(id);
  }

  @Post(':id/skills')
  @Roles('ADMIN', 'HR')
  updateSkills(
    @Param('id', ParseIntPipe) id: number,
    @Body('skillIds') skillIds: number[],
  ) {
    return this.employeesService.updateSkills(id, skillIds);
  }

  @Get(':id/replacements')
  @Roles('ADMIN', 'HR')
  getReplacements(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.getReplacements(id);
  }

  @Post(':id/replacements')
  @Roles('ADMIN', 'HR')
  setReplacements(
    @Param('id', ParseIntPipe) id: number,
    @Body('replacementIds') replacementIds: number[],
  ) {
    return this.employeesService.setReplacements(id, replacementIds);
  }

  @Get(':id/eligible-replacements')
  @Roles('ADMIN', 'HR')
  getEligibleReplacements(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.getEligibleReplacements(id);
  }
}
