import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@Injectable()
export class LeaveTypesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createLeaveTypeDto: CreateLeaveTypeDto) {
    const existing = await this.prisma.leaveType.findUnique({
      where: { name: createLeaveTypeDto.name },
    });

    if (existing) {
      throw new ConflictException('Ce type de congé existe déjà');
    }

    const leaveType = await this.prisma.leaveType.create({ data: createLeaveTypeDto });

    this.notificationsService.leaveTypeCreated(leaveType.id, leaveType.name);

    return leaveType;
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
    try {
      return await this.prisma.leaveType.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new BadRequestException(
          'Impossible de supprimer ce type de congé car il est utilisé par des demandes ou soldes existants. Désactivez-le plutôt.',
        );
      }
      throw err;
    }
  }
}
