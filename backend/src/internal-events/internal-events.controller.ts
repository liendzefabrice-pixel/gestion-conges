import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { InternalEventsService } from './internal-events.service';
import { CreateInternalEventDto } from './dto/create-internal-event.dto';
import { UpdateInternalEventDto } from './dto/update-internal-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('internal-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternalEventsController {
  constructor(private readonly service: InternalEventsService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  create(@Body() dto: CreateInternalEventDto, @CurrentUser() user: { id: number }) {
    return this.service.create(dto, user.id);
  }

  @Get()
  @Roles('ADMIN', 'HR')
  findAll(
    @Query('year') year?: string,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      year: year ? parseInt(year, 10) : undefined,
      type,
      priority,
      status,
      departmentId: departmentId ? parseInt(departmentId, 10) : undefined,
      search,
    });
  }

  @Get('stats')
  @Roles('ADMIN', 'HR')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInternalEventDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR')
  archive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.service.archive(id, user.id);
  }
}
