import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SeniorityService } from '../../seniority/seniority.service';
import type { BalanceStrategy, StrategyParams } from '../interfaces/balance-strategy.interface';

const ACCRUAL_RATE_PER_MONTH = 1.5;

@Injectable()
export class AnnualLeaveBalanceStrategy implements BalanceStrategy {
  readonly key = 'annual';
  readonly label = 'Congé annuel';

  constructor(
    private prisma: PrismaService,
    private seniorityService: SeniorityService,
  ) {}

  async calculateAcquired(params: StrategyParams): Promise<number> {
    const monthsWorked = this.seniorityService.calculate(params.hireDate).totalMonths;

    if (monthsWorked === 0) return 0;

    const allowAnticipated = await this.isAnticipatedLeaveAllowed();
    if (monthsWorked < 12 && !allowAnticipated) return 0;

    return Math.min(
      Math.floor(monthsWorked * ACCRUAL_RATE_PER_MONTH),
      params.defaultDays,
    );
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
