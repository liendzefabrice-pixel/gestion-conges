import { Injectable } from '@nestjs/common';
import { SeniorityService } from '../../seniority/seniority.service';
import type { BalanceStrategy, StrategyParams } from '../interfaces/balance-strategy.interface';

const BASE_ANNUAL_LEAVE_DAYS = 18;
const MIN_MONTHS_FOR_LEAVE = 12;

@Injectable()
export class AnnualLeaveBalanceStrategy implements BalanceStrategy {
  readonly key = 'annual';
  readonly label = 'Congé annuel';

  constructor(
    private seniorityService: SeniorityService,
  ) {}

  async calculateAcquired(params: StrategyParams): Promise<number> {
    const monthsWorked = this.seniorityService.calculate(params.hireDate).totalMonths;

    if (monthsWorked < MIN_MONTHS_FOR_LEAVE) return 0;

    return BASE_ANNUAL_LEAVE_DAYS + this.getSeniorityBonus(monthsWorked);
  }

  getSeniorityBonus(monthsWorked: number): number {
    const yearsWorked = Math.floor(monthsWorked / 12);
    return Math.floor(yearsWorked / 5) * 2;
  }
}
