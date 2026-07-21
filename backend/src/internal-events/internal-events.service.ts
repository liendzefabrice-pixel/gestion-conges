import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInternalEventDto } from './dto/create-internal-event.dto';
import { UpdateInternalEventDto } from './dto/update-internal-event.dto';

@Injectable()
export class InternalEventsService {
  private readonly logger = new Logger(InternalEventsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInternalEventDto, userId: number) {
    const event = await this.prisma.internalEvent.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type as any,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        allCompany: dto.allCompany ?? true,
        departmentId: dto.departmentId ?? null,
        priority: (dto.priority as any) ?? 'MOYENNE',
        status: (dto.status as any) ?? 'BROUILLON',
      },
      include: { department: { select: { id: true, name: true } } },
    });

    await this.audit('CREATE', event.id, userId, { title: event.title });
    await this.notifyCreated(event);

    return event;
  }

  async findAll(filters?: {
    year?: number;
    type?: string;
    priority?: string;
    status?: string;
    departmentId?: number;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.year) {
      const startOfYear = new Date(filters.year, 0, 1);
      const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59, 999);
      where.startDate = { gte: startOfYear, lte: endOfYear };
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

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

  async update(id: number, dto: UpdateInternalEventDto, userId: number) {
    await this.findOne(id);
    const event = await this.prisma.internalEvent.update({
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

    await this.audit('UPDATE', id, userId, { title: event.title, status: event.status });
    await this.notifyUpdated(event);

    return event;
  }

  async archive(id: number, userId: number) {
    const event = await this.findOne(id);
    const updated = await this.prisma.internalEvent.update({
      where: { id },
      data: { status: 'ARCHIVE' },
      include: { department: { select: { id: true, name: true } } },
    });

    await this.audit('ARCHIVE', id, userId, { title: event.title });
    await this.notifyArchived(updated);

    return updated;
  }

  async getStats() {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const [activeCount, upcomingCount, criticalCount, yearCount] = await Promise.all([
      this.prisma.internalEvent.count({ where: { status: 'ACTIF' } }),
      this.prisma.internalEvent.count({
        where: { status: 'ACTIF', startDate: { gte: now } },
      }),
      this.prisma.internalEvent.count({
        where: { status: 'ACTIF', priority: 'CRITIQUE' },
      }),
      this.prisma.internalEvent.count({
        where: { startDate: { gte: startOfYear, lte: endOfYear } },
      }),
    ]);

    return {
      activeCount,
      upcomingCount,
      criticalCount,
      yearCount,
    };
  }

  // ---------------------------------------------------------------------------
  // Audit
  // ---------------------------------------------------------------------------
  private async audit(action: string, entityId: number, userId: number, metadata?: Record<string, any>) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entityType: 'InternalEvent',
          entityId,
          userId,
          newValue: metadata,
        },
      });
    } catch (err) {
      this.logger.error(`Audit log failed: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Notification extension points (reserved for future use)
  // ---------------------------------------------------------------------------
  private async notifyCreated(event: any) {
    this.logger.log(`[NOTIFICATION] Événement créé : ${event.title}`);
  }

  private async notifyUpdated(event: any) {
    this.logger.log(`[NOTIFICATION] Événement modifié : ${event.title}`);
  }

  private async notifyArchived(event: any) {
    this.logger.log(`[NOTIFICATION] Événement archivé : ${event.title}`);
  }
}
