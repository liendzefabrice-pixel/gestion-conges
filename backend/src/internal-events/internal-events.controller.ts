import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InternalEventsService } from './internal-events.service';
import { CreateInternalEventDto } from './dto/create-internal-event.dto';
import { UpdateInternalEventDto } from './dto/update-internal-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('internal-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternalEventsController {
  constructor(private readonly service: InternalEventsService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  create(@Body() dto: CreateInternalEventDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'HR')
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInternalEventDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
