import { LeaveTypeBalance } from './balance-result.interface';

export interface BalanceStrategy {
  /**
   * Unique key to match against leave type name (lowercased).
   * Example: 'annual' matches 'Congé Annuel', 'Congé annuel', etc.
   */
  readonly key: string;

  /**
   * Calculate acquired days for this leave type category.
   */
  calculateAcquired(params: StrategyParams): Promise<number>;

  /**
   * Human-readable label for this strategy.
   */
  readonly label: string;
}

export interface StrategyParams {
  employeeId: number;
  leaveTypeId: number;
  year: number;
  hireDate: Date;
  defaultDays: number;
  adjustedDays: number;
}
