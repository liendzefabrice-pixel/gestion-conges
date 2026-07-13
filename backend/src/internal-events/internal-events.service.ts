import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInternalEventDto } from './dto/create-internal-event.dto';
import { UpdateInternalEventDto } from './dto/update-internal-event.dto';

@Injectable()
export class InternalEventsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInternalEventDto) {
    return this.prisma.internalEvent.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type as any,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        allCompany: dto.allCompany ?? true,
        departmentId: dto.departmentId ?? null,
        priority: (dto.priority as any) ?? 'MOYENNE',
      },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async findAll(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.internalEvent.findMany({
      where,
      include: { department: { select: { id: true, name: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const event = await this.prisma.internalEvent.findUnique({
      where: { id },
      include: { department: { select: { id: true, name: true } } },
    });
    if (!event) throw new NotFoundException('Événement introuvable');
    return event;
  }

  async update(id: number, dto: UpdateInternalEventDto) {
    await this.findOne(id);
    return this.prisma.internalEvent.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.allCompany !== undefined && { allCompany: dto.allCompany }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.priority !== undefined && { priority: dto.priority as any }),
        ...(dto.status !== undefined && { status: dto.status as any }),
      },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.internalEvent.delete({ where: { id } });
  }
}
