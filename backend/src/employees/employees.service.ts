import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createEmployeeDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const department = await this.prisma.department.findUnique({
      where: { id: createEmployeeDto.departmentId },
    });

    if (!department) {
      throw new NotFoundException('Département introuvable');
    }

    if (createEmployeeDto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: createEmployeeDto.serviceId },
      });

      if (!service) {
        throw new NotFoundException('Service introuvable');
      }

      if (service.departmentId !== createEmployeeDto.departmentId) {
        throw new ConflictException(
          'Ce service n\'appartient pas au département sélectionné',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);

    const employeeRole = await this.prisma.role.findUnique({
      where: { name: 'EMPLOYEE' },
    });

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: createEmployeeDto.email,
          password: hashedPassword,
          roleId: employeeRole!.id,
          mustChangePassword: true,
        },
      });

      return tx.employee.create({
        data: {
          firstName: createEmployeeDto.firstName,
          lastName: createEmployeeDto.lastName,
          hireDate: new Date(createEmployeeDto.hireDate),
          position: createEmployeeDto.position,
          departmentId: createEmployeeDto.departmentId,
          serviceId: createEmployeeDto.serviceId || null,
          userId: user.id,
        },
        include: {
          user: { include: { role: true } },
          department: true,
          service: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.employee.findMany({
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
        department: true,
        service: true,
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
        department: true,
        service: true,
        leaveBalances: { include: { leaveType: true } },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    return employee;
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    await this.findOne(id);

    if (updateEmployeeDto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: updateEmployeeDto.serviceId },
      });

      if (!service) {
        throw new NotFoundException('Service introuvable');
      }

      const targetDepartmentId =
        updateEmployeeDto.departmentId ||
        (await this.prisma.employee.findUnique({ where: { id } }))
          ?.departmentId;

      if (service.departmentId !== targetDepartmentId) {
        throw new ConflictException(
          'Ce service n\'appartient pas au département sélectionné',
        );
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...updateEmployeeDto,
        hireDate: updateEmployeeDto.hireDate
          ? new Date(updateEmployeeDto.hireDate)
          : undefined,
      },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
        department: true,
        service: true,
      },
    });
  }

  async remove(id: number) {
    const employee = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.delete({ where: { id } });
      await tx.user.delete({ where: { id: employee.userId } });
    });

    return { message: 'Employé supprimé' };
  }
}
