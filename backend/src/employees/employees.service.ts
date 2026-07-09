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

    const existingMatricule = await this.prisma.employee.findUnique({
      where: { matricule: createEmployeeDto.matricule },
    });

    if (existingMatricule) {
      throw new ConflictException('Ce matricule est déjà attribué');
    }

    const department = await this.prisma.department.findUnique({
      where: { id: createEmployeeDto.departmentId },
    });

    if (!department) {
      throw new NotFoundException('Département introuvable');
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

      const { position, positionId, ...empData } = createEmployeeDto;

      return tx.employee.create({
        data: {
          ...empData,
          position: position || null,
          positionId: positionId || null,
          hireDate: new Date(createEmployeeDto.hireDate),
          userId: user.id,
        },
        include: {
          user: { include: { role: true } },
          department: true,
          positionRef: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.employee.findMany({
      where: {
        user: { role: { name: { not: 'ADMIN' } } },
      },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
        department: true,
        positionRef: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findByUserId(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
        department: true,
        positionRef: true,
        leaveBalances: { include: { leaveType: true } },
      },
    });

    if (!employee) {
      throw new NotFoundException('Profil employé introuvable');
    }

    return employee;
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
        department: true,
        positionRef: true,
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

    if (updateEmployeeDto.matricule) {
      const existingMatricule = await this.prisma.employee.findUnique({
        where: { matricule: updateEmployeeDto.matricule },
      });
      if (existingMatricule && existingMatricule.id !== id) {
        throw new ConflictException('Ce matricule est déjà attribué');
      }
    }

    const { position, positionId, ...rest } = updateEmployeeDto;

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        position: position ?? undefined,
        positionId: positionId ?? undefined,
        hireDate: updateEmployeeDto.hireDate
          ? new Date(updateEmployeeDto.hireDate)
          : undefined,
      },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
        department: true,
        positionRef: true,
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
