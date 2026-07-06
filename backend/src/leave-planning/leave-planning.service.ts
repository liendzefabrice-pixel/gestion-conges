import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeavePlanningDto } from './dto/create-leave-planning.dto';
import { UpdateLeavePlanningDto } from './dto/update-leave-planning.dto';

@Injectable()
export class LeavePlanningService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLeavePlanningDto, plannedById: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    const existing = await this.prisma.annualLeavePlanning.findUnique({
      where: { employeeId_year: { employeeId: dto.employeeId, year: dto.year } },
    });
    if (existing) {
      throw new BadRequestException(
        'Cet employé a déjà une planification pour cette année',
      );
    }

    return this.prisma.annualLeavePlanning.create({
      data: {
        employeeId: dto.employeeId,
        year: dto.year,
        month: dto.month,
        plannedById,
      },
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true } },
            department: true,
          },
        },
        plannedBy: { select: { id: true, email: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.annualLeavePlanning.findMany({
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true } },
            department: true,
          },
        },
        plannedBy: { select: { id: true, email: true } },
      },
      orderBy: [{ year: 'desc' }, { employee: { lastName: 'asc' } }],
    });
  }

  async findByEmployeeId(employeeId: number, year?: number) {
    const y = year || new Date().getFullYear();
    const planning = await this.prisma.annualLeavePlanning.findUnique({
      where: { employeeId_year: { employeeId, year: y } },
      include: {
        plannedBy: { select: { id: true, email: true } },
        leaveRequests: {
          include: { leaveType: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return planning;
  }

  async findMyPlanning(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundException('Profil employé introuvable');
    }
    return this.findByEmployeeId(employee.id);
  }

  async findById(id: number) {
    const planning = await this.prisma.annualLeavePlanning.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true } },
            department: true,
          },
        },
        plannedBy: { select: { id: true, email: true } },
        leaveRequests: {
          include: { leaveType: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!planning) {
      throw new NotFoundException('Planification introuvable');
    }
    return planning;
  }

  async update(id: number, dto: UpdateLeavePlanningDto) {
    await this.findById(id);
    return this.prisma.annualLeavePlanning.update({
      where: { id },
      data: dto,
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true } },
            department: true,
          },
        },
        plannedBy: { select: { id: true, email: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.annualLeavePlanning.delete({ where: { id } });
  }

  async checkEligibility(employee: { id: number; hireDate: Date }) {
    const now = new Date();
    const hireDate = new Date(employee.hireDate);
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const eligible = hireDate <= oneYearAgo;

    const currentYear = now.getFullYear();
    const planning = await this.prisma.annualLeavePlanning.findUnique({
      where: { employeeId_year: { employeeId: employee.id, year: currentYear } },
    });

    return {
      eligible,
      hasPlanning: !!planning,
      planning,
      hireDate: employee.hireDate,
      seniorityYears: Math.floor(
        (now.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      ),
    };
  }

  async getEmployeeByUserId(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundException('Profil employé introuvable');
    }
    return employee;
  }

  async getDashboardStats() {
    const currentYear = new Date().getFullYear();
    const employees = await this.prisma.employee.findMany({
      include: { annualLeavePlannings: { where: { year: currentYear } } },
    });

    const totalEmployees = employees.length;
    const withPlanning = employees.filter((e) => e.annualLeavePlannings.length > 0).length;
    const withoutPlanning = totalEmployees - withPlanning;

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const eligibleEmployees = employees.filter(
      (e) => new Date(e.hireDate) <= oneYearAgo,
    ).length;

    return {
      totalEmployees,
      withPlanning,
      withoutPlanning,
      eligibleEmployees,
      planningRate: totalEmployees > 0 ? Math.round((withPlanning / totalEmployees) * 100) : 0,
    };
  }
}
