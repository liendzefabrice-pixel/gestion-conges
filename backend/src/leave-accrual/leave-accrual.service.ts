import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeniorityService } from '../seniority/seniority.service';
import type { LeaveAccrualResult } from './interfaces/leave-accrual-result.interface';

const ACCRUAL_RATE_PER_MONTH = 1.5;
const MINIMUM_MONTHS_BEFORE_LEAVE = 12;

@Injectable()
export class LeaveAccrualService {
  constructor(
    private prisma: PrismaService,
    private seniorityService: SeniorityService,
  ) {}

  async calculate(employeeId: number): Promise<LeaveAccrualResult> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    const seniority = this.seniorityService.calculate(new Date(employee.hireDate));
    const referenceYear = new Date().getFullYear();
    const monthsWorked = seniority.totalMonths;
    const daysAccrued = Math.floor(monthsWorked * ACCRUAL_RATE_PER_MONTH);

    const allowAnticipated = await this.isAnticipatedLeaveAllowed();

    let canTakeLeave: boolean;
    let message: string | null;

    if (monthsWorked >= MINIMUM_MONTHS_BEFORE_LEAVE) {
      canTakeLeave = true;
      message = null;
    } else if (allowAnticipated) {
      canTakeLeave = true;
      message = null;
    } else {
      canTakeLeave = false;
      message = `Vous avez acquis ${daysAccrued} jours, mais le congé annuel sera disponible après ${MINIMUM_MONTHS_BEFORE_LEAVE} mois d'ancienneté.`;
    }

    return {
      monthsWorked,
      daysAccrued,
      referenceYear,
      seniorityLabel: seniority.label,
      canTakeLeave,
      message,
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

  private async isAnticipatedLeaveAllowed(): Promise<boolean> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: 'allowAnticipatedLeave' },
      });
      return setting?.value === 'true';
    } catch {
      return false;
    }
  }
}
