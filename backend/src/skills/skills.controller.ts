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
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('skills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(createSkillDto);
  }

  @Get()
  @Roles('ADMIN', 'HR')
  findAll() {
    return this.skillsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(id, updateSkillDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.skillsService.remove(id);
  }
}
