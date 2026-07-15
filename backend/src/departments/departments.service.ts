import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto, currentUserId: number) {
    const name = createDepartmentDto.name?.trim();
    if (!name) {
      throw new BadRequestException('Le nom du département est obligatoire');
    }

    const existing = await this.prisma.department.findUnique({
      where: { name },
    });
    if (existing) {
      throw new ConflictException('Ce département existe déjà');
    }

    if (createDepartmentDto.headId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: createDepartmentDto.headId },
      });
      if (!employee) {
        throw new NotFoundException('Employé introuvable');
      }
      const alreadyHead = await this.prisma.department.findUnique({
        where: { headId: createDepartmentDto.headId },
      });
      if (alreadyHead) {
        throw new ConflictException('Cet employé est déjà responsable d\'un département');
      }
    }

    const department = await this.prisma.department.create({
      data: { ...createDepartmentDto, name },
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true, positions: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'DEPARTMENT_CREATED',
        entityType: 'DEPARTMENT',
        entityId: department.id,
        newValue: { name: department.name, minEmployees: department.minEmployees } as any,
        userId: currentUserId,
      },
    });

    this.notificationsService.departmentCreated(department.id, department.name);

    return department;
  }

  async findAll(userRole?: string) {
    const where: any = {};
    if (!userRole || userRole !== 'ADMIN') {
      where.isActive = true;
    }

    return this.prisma.department.findMany({
      where,
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true, positions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true, positions: true } },
      },
    });

    if (!department) {
      throw new NotFoundException('Département introuvable');
    }

    return department;
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto, currentUserId: number) {
    const department = await this.findOne(id);

    let newName = updateDepartmentDto.name;
    if (newName !== undefined) {
      newName = newName.trim();
      if (!newName) {
        throw new BadRequestException('Le nom du département est obligatoire');
      }
      const existing = await this.prisma.department.findUnique({
        where: { name: newName },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Ce nom de département est déjà utilisé');
      }
    }

    if (updateDepartmentDto.headId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: updateDepartmentDto.headId },
      });
      if (!employee) {
        throw new NotFoundException('Employé introuvable');
      }
      const alreadyHead = await this.prisma.department.findFirst({
        where: { headId: updateDepartmentDto.headId, id: { not: id } },
      });
      if (alreadyHead) {
        throw new ConflictException('Cet employé est déjà responsable d\'un autre département');
      }
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: { ...updateDepartmentDto, name: newName },
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true, positions: true } },
      },
    });

    const changedFields: string[] = [];
    if (newName !== undefined && newName !== department.name) changedFields.push('name');
    if (updateDepartmentDto.minEmployees !== undefined && updateDepartmentDto.minEmployees !== department.minEmployees) changedFields.push('minEmployees');
    if (updateDepartmentDto.isActive !== undefined && updateDepartmentDto.isActive !== department.isActive) changedFields.push('isActive');

    if (changedFields.length > 0) {
      await this.prisma.auditLog.create({
        data: {
          action: updateDepartmentDto.isActive !== undefined && updateDepartmentDto.isActive !== department.isActive
            ? (updateDepartmentDto.isActive ? 'DEPARTMENT_REACTIVATED' : 'DEPARTMENT_DEACTIVATED')
            : 'DEPARTMENT_MODIFIED',
          entityType: 'DEPARTMENT',
          entityId: id,
          oldValue: { name: department.name, minEmployees: department.minEmployees, isActive: department.isActive } as any,
          newValue: { name: updated.name, minEmployees: updated.minEmployees, isActive: updated.isActive, changedFields } as any,
          userId: currentUserId,
        },
      });
    }

    return updated;
  }

  async remove(id: number, currentUserId: number) {
    const department = await this.findOne(id);

    const employeeCount = await this.prisma.employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) {
      throw new ConflictException(
        'Impossible de supprimer ce département car il contient encore des employés ou des postes.',
      );
    }

    const positionCount = await this.prisma.position.count({ where: { departmentId: id } });
    if (positionCount > 0) {
      throw new ConflictException(
        'Impossible de supprimer ce département car il contient encore des employés ou des postes.',
      );
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'DEPARTMENT_DELETED',
        entityType: 'DEPARTMENT',
        entityId: id,
        oldValue: { name: department.name } as any,
        userId: currentUserId,
      },
    });

    await this.prisma.department.delete({ where: { id } });
    return { message: 'Département supprimé' };
  }
}
