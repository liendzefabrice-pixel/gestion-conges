import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';

@Injectable()
export class LeaveBalancesService {
  constructor(private prisma: PrismaService) {}

  async getMyBalances(userId: number) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Profil employé introuvable');

    return this.getBalancesWithRemaining(employee.id);
  }

  async getEmployeeBalances(employeeId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: { select: { id: true, email: true } }, department: true },
    });
    if (!employee) throw new NotFoundException('Employé introuvable');

    const balances = await this.getBalancesWithRemaining(employee.id);
    return { employee, balances };
  }

  async getAllBalances() {
    const employees = await this.prisma.employee.findMany({
      where: { user: { isActive: true, role: { name: { not: 'ADMIN' } } } },
      include: {
        user: { select: { id: true, email: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const result = await Promise.all(
      employees.map(async (emp) => {
        const balances = await this.getBalancesWithRemaining(emp.id);
        return { employee: emp, balances };
      }),
    );

    return result;
  }

  async adjustBalance(balanceId: number, dto: AdjustBalanceDto, authorId: number) {
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { id: balanceId },
      include: { leaveType: true, employee: { include: { user: true } } },
    });
    if (!balance) throw new NotFoundException('Solde introuvable');

    const currentRemaining = balance.totalDays + balance.adjustedDays - balance.usedDays - balance.pendingDays;
    const newAdjustedDays = balance.adjustedDays + dto.delta;
    const newRemaining = currentRemaining + dto.delta;

    await this.prisma.leaveBalance.update({
      where: { id: balanceId },
      data: { adjustedDays: newAdjustedDays },
    });

    await this.prisma.balanceAdjustment.create({
      data: {
        operationType: 'AJUSTEMENT_MANUAL',
        previousRemaining: currentRemaining,
        newRemaining,
        comment: dto.comment,
        leaveBalanceId: balanceId,
        authorId,
      },
    });

    return this.getBalancesWithRemaining(balance.employeeId);
  }

  async getAdjustments(balanceId: number) {
    const balance = await this.prisma.leaveBalance.findUnique({ where: { id: balanceId } });
    if (!balance) throw new NotFoundException('Solde introuvable');

    return this.prisma.balanceAdjustment.findMany({
      where: { leaveBalanceId: balanceId },
      include: { author: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getBalancesWithRemaining(employeeId: number) {
    const balances = await this.prisma.leaveBalance.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: [{ year: 'desc' }, { leaveType: { name: 'asc' } }],
    });

    return balances.map((b) => ({
      ...b,
      remaining: b.totalDays + b.adjustedDays - b.usedDays - b.pendingDays,
    }));
  }
}
