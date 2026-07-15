import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@Injectable()
export class PositionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createPositionDto: CreatePositionDto, currentUserId: number) {
    const name = createPositionDto.name?.trim();
    if (!name) {
      throw new BadRequestException('Le nom du poste est obligatoire');
    }

    const department = await this.prisma.department.findUnique({
      where: { id: createPositionDto.departmentId },
    });
    if (!department) {
      throw new NotFoundException('Département introuvable');
    }
    if (!department.isActive) {
      throw new BadRequestException('Impossible de créer un poste dans un département désactivé');
    }

    const existing = await this.prisma.position.findUnique({
      where: { name_departmentId: { name, departmentId: createPositionDto.departmentId } },
    });
    if (existing) {
      throw new ConflictException('Ce poste existe déjà dans ce département');
    }

    const position = await this.prisma.position.create({
      data: { ...createPositionDto, name },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'POSITION_CREATED',
        entityType: 'POSITION',
        entityId: position.id,
        newValue: { name: position.name, departmentId: position.departmentId, isCritical: position.isCritical } as any,
        userId: currentUserId,
      },
    });

    this.notificationsService.positionCreated(position.id, position.name);

    return position;
  }

  async findAll(userRole?: string) {
    const where: any = {};
    if (!userRole || userRole !== 'ADMIN') {
      where.isActive = true;
    }

    return this.prisma.position.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async findActive() {
    return this.prisma.position.findMany({
      where: { isActive: true, department: { isActive: true } },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async findOne(id: number) {
    const position = await this.prisma.position.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });

    if (!position) {
      throw new NotFoundException('Poste introuvable');
    }

    return position;
  }

  async update(id: number, updatePositionDto: UpdatePositionDto, currentUserId: number) {
    const position = await this.findOne(id);

    let newName = updatePositionDto.name;
    if (newName !== undefined) {
      newName = newName.trim();
      if (!newName) {
        throw new BadRequestException('Le nom du poste est obligatoire');
      }
    }

    const effectiveDeptId = updatePositionDto.departmentId ?? position.departmentId;

    if (updatePositionDto.departmentId !== undefined) {
      const department = await this.prisma.department.findUnique({
        where: { id: updatePositionDto.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Département introuvable');
      }
      if (!department.isActive) {
        throw new BadRequestException('Impossible de déplacer un poste vers un département désactivé');
      }
    }

    if (newName && effectiveDeptId) {
      const existing = await this.prisma.position.findUnique({
        where: { name_departmentId: { name: newName, departmentId: effectiveDeptId } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Ce nom de poste existe déjà dans ce département');
      }
    }

    const updated = await this.prisma.position.update({
      where: { id },
      data: {
        ...updatePositionDto,
        name: newName,
      },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });

    const changedFields: string[] = [];
    if (newName !== undefined && newName !== position.name) changedFields.push('name');
    if (updatePositionDto.departmentId !== undefined && updatePositionDto.departmentId !== position.departmentId) changedFields.push('departmentId');
    if (updatePositionDto.isActive !== undefined && updatePositionDto.isActive !== position.isActive) changedFields.push('isActive');
    if (updatePositionDto.isCritical !== undefined && updatePositionDto.isCritical !== position.isCritical) changedFields.push('isCritical');
    if (updatePositionDto.canBeReplaced !== undefined && updatePositionDto.canBeReplaced !== position.canBeReplaced) changedFields.push('canBeReplaced');

    if (changedFields.length > 0) {
      await this.prisma.auditLog.create({
        data: {
          action: updatePositionDto.isActive !== undefined && updatePositionDto.isActive !== position.isActive
            ? (updatePositionDto.isActive ? 'POSITION_REACTIVATED' : 'POSITION_DEACTIVATED')
            : 'POSITION_MODIFIED',
          entityType: 'POSITION',
          entityId: id,
          oldValue: {
            name: position.name,
            departmentId: position.departmentId,
            isCritical: position.isCritical,
            canBeReplaced: position.canBeReplaced,
            isActive: position.isActive,
          } as any,
          newValue: {
            name: updated.name,
            departmentId: updated.departmentId,
            isCritical: updated.isCritical,
            canBeReplaced: updated.canBeReplaced,
            isActive: updated.isActive,
            changedFields,
          } as any,
          userId: currentUserId,
        },
      });
    }

    return updated;
  }

  async remove(id: number, currentUserId: number) {
    const position = await this.findOne(id);

    const employeeCount = await this.prisma.employee.count({ where: { positionId: id } });
    if (employeeCount > 0) {
      throw new ConflictException(
        'Impossible de supprimer ce poste car il est encore attribué à un ou plusieurs employés.',
      );
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'POSITION_DELETED',
        entityType: 'POSITION',
        entityId: id,
        oldValue: { name: position.name, departmentId: position.departmentId } as any,
        userId: currentUserId,
      },
    });

    await this.prisma.position.delete({ where: { id } });
    return { message: 'Poste supprimé' };
  }
}
