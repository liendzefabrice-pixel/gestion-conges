import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({
      where: { name: createDepartmentDto.name },
    });

    if (existing) {
      throw new ConflictException('Ce département existe déjà');
    }

    return this.prisma.department.create({
      data: createDepartmentDto,
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: { services: true, _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { services: true, employees: true },
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

    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
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

  async createService(departmentId: number, createServiceDto: CreateServiceDto) {
    await this.findOne(departmentId);

    return this.prisma.service.create({
      data: {
        ...createServiceDto,
        departmentId,
      },
    });
  }

  async findServicesByDepartment(departmentId: number) {
    await this.findOne(departmentId);

    return this.prisma.service.findMany({
      where: { departmentId },
      orderBy: { name: 'asc' },
    });
  }

  async findServiceById(id: number) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable');
    }

    return service;
  }

  async updateService(id: number, updateServiceDto: UpdateServiceDto) {
    await this.findServiceById(id);

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async removeService(id: number) {
    await this.findServiceById(id);

    const hasEmployees = await this.prisma.employee.findFirst({
      where: { serviceId: id },
    });

    if (hasEmployees) {
      throw new ConflictException(
        'Impossible de supprimer ce service : des employés y sont rattachés',
      );
    }

    return this.prisma.service.delete({ where: { id } });
  }
}
