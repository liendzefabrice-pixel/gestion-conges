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

  async create(createDepartmentDto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({
      where: { name: createDepartmentDto.name },
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
      data: createDepartmentDto,
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
    });

    this.notificationsService.departmentCreated(department.id, department.name);

    return department;
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
    });

    if (!department) {
      throw new NotFoundException('Département introuvable');
    }

    return department;
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    await this.findOne(id);

    if (updateDepartmentDto.name) {
      const existing = await this.prisma.department.findUnique({
        where: { name: updateDepartmentDto.name },
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

    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const hasEmployees = await this.prisma.employee.findFirst({
      where: { departmentId: id },
    });

    if (hasEmployees) {
      throw new ConflictException(
        'Impossible de supprimer ce département : des employés y sont rattachés',
      );
    }

    return this.prisma.department.delete({ where: { id } });
  }
}
