import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@Injectable()
export class LeaveTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createLeaveTypeDto: CreateLeaveTypeDto) {
    const existing = await this.prisma.leaveType.findUnique({
      where: { name: createLeaveTypeDto.name },
    });

    if (existing) {
      throw new ConflictException('Ce type de congé existe déjà');
    }

    return this.prisma.leaveType.create({ data: createLeaveTypeDto });
  }

  async findAll() {
    return this.prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
  }

  async findActive() {
    return this.prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const leaveType = await this.prisma.leaveType.findUnique({ where: { id } });

    if (!leaveType) {
      throw new NotFoundException('Type de congé introuvable');
    }

    return leaveType;
  }

  async update(id: number, updateLeaveTypeDto: UpdateLeaveTypeDto) {
    await this.findOne(id);

    if (updateLeaveTypeDto.name) {
      const existing = await this.prisma.leaveType.findUnique({
        where: { name: updateLeaveTypeDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Ce nom de type de congé est déjà utilisé');
      }
    }

    return this.prisma.leaveType.update({
      where: { id },
      data: updateLeaveTypeDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.leaveType.delete({ where: { id } });
  }
}
