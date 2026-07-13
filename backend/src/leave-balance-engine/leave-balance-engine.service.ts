import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DefaultBalanceStrategy } from './strategies/default-balance.strategy';
import { AnnualLeaveBalanceStrategy } from './strategies/annual-leave-balance.strategy';
import type { BalanceStrategy } from './interfaces/balance-strategy.interface';
import type { EmployeeBalanceResult, LeaveTypeBalance } from './interfaces/balance-result.interface';

const APPROVED_STATUSES = ['APPROUVE'];
const PENDING_STATUSES = ['EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION', 'AVIS_RH_RENDU'];

@Injectable()
export class LeaveBalanceEngineService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LeaveBalanceEngineService.name);
  private strategies: Map<string, BalanceStrategy> = new Map();

  constructor(
    private prisma: PrismaService,
    defaultStrategy: DefaultBalanceStrategy,
    annualStrategy: AnnualLeaveBalanceStrategy,
  ) {
    this.strategies.set('default', defaultStrategy);
    this.strategies.set('annual', annualStrategy);
    this.strategies.set('annuel', annualStrategy);
    this.strategies.set('congé annuel', annualStrategy);
  }

  async onApplicationBootstrap() {
    this.logger.log('Recalculating all leave balances...');
    await this.syncAllBalances();
    this.logger.log('Leave balances recalculated successfully');
  }

  async calculateEmployeeBalances(employeeId: number, year?: number): Promise<EmployeeBalanceResult> {
    const targetYear = year ?? new Date().getFullYear();

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    if (!employee) {
      throw new Error('Employé introuvable');
    }

    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const balances: LeaveTypeBalance[] = [];
    for (const leaveType of leaveTypes) {
      const balance = await this.calculateForLeaveType(employee, leaveType, targetYear);
      balances.push(balance);
    }

    const totals = balances.reduce(
      (acc, b) => ({
        acquired: acc.acquired + b.acquired,
        consumed: acc.consumed + b.consumed,
        reserved: acc.reserved + b.reserved,
        adjusted: acc.adjusted + b.adjusted,
        available: acc.available + b.available,
      }),
      { acquired: 0, consumed: 0, reserved: 0, adjusted: 0, available: 0 },
    );

    return {
      employeeId: employee.id,
      firstName: employee.user.firstName ?? '',
      lastName: employee.user.lastName ?? '',
      email: employee.user.email,
      balances,
      totals,
    };
  }

  async calculateForEmployeeAndType(
    employeeId: number,
    leaveTypeId: number,
    year?: number,
  ): Promise<LeaveTypeBalance> {
    const targetYear = year ?? new Date().getFullYear();

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee) throw new Error('Employé introuvable');

    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
    });
    if (!leaveType) throw new Error('Type de congé introuvable');

    return this.calculateForLeaveType(employee, leaveType, targetYear);
  }

  async syncEmployeeBalances(employeeId: number, year?: number): Promise<void> {
    const targetYear = year ?? new Date().getFullYear();

    try {
      const result = await this.calculateEmployeeBalances(employeeId, targetYear);

      for (const balance of result.balances) {
        await this.prisma.leaveBalance.upsert({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId,
              leaveTypeId: balance.leaveTypeId,
              year: targetYear,
            },
          },
          update: { totalDays: balance.acquired },
          create: {
            employeeId,
            leaveTypeId: balance.leaveTypeId,
            year: targetYear,
            totalDays: balance.acquired,
            status: 'ACTIF',
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to sync balances for employee ${employeeId}: ${error.message}`);
    }
  }

  async syncAllBalances(): Promise<void> {
    const employees = await this.prisma.employee.findMany();
    this.logger.log(`Syncing balances for ${employees.length} employees...`);
    for (const emp of employees) {
      await this.syncEmployeeBalances(emp.id);
    }
  }

  private async calculateForLeaveType(
    employee: { id: number; hireDate: Date },
    leaveType: { id: number; name: string; defaultDays: number },
    year: number,
  ): Promise<LeaveTypeBalance> {
    const strategy = this.resolveStrategy(leaveType.name);

    const leaveBalance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year,
        },
      },
    });

    const adjusted = leaveBalance?.adjustedDays ?? 0;

    const acquired = await strategy.calculateAcquired({
      employeeId: employee.id,
      leaveTypeId: leaveType.id,
      year,
      hireDate: employee.hireDate,
      defaultDays: leaveType.defaultDays,
      adjustedDays: adjusted,
    });

    const consumed = await this.sumDurations(employee.id, leaveType.id, year, APPROVED_STATUSES);
    const reserved = await this.sumDurations(employee.id, leaveType.id, year, PENDING_STATUSES);

    return {
      leaveTypeId: leaveType.id,
      leaveTypeName: leaveType.name,
      year,
      acquired,
      consumed,
      reserved,
      adjusted,
      available: acquired - consumed - reserved + adjusted,
    };
  }

  private async sumDurations(
    employeeId: number,
    leaveTypeId: number,
    year: number,
    statuses: string[],
  ): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const result = await this.prisma.leaveRequest.aggregate({
      where: {
        employeeId,
        leaveTypeId,
        status: { in: statuses as any },
        startDate: { gte: startOfYear },
        endDate: { lte: endOfYear },
      },
      _sum: { duration: true },
    });

    return result._sum.duration ?? 0;
  }

  private resolveStrategy(leaveTypeName: string): BalanceStrategy {
    const lower = leaveTypeName.toLowerCase();
    for (const [key, strategy] of this.strategies) {
      if (lower.includes(key)) return strategy;
    }
    return this.strategies.get('default')!;
  }
}
