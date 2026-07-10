import { Injectable } from '@nestjs/common';
import type { BalanceStrategy, StrategyParams } from '../interfaces/balance-strategy.interface';

@Injectable()
export class DefaultBalanceStrategy implements BalanceStrategy {
  readonly key = 'default';
  readonly label = 'Défaut';

  async calculateAcquired(params: StrategyParams): Promise<number> {
    return params.defaultDays + params.adjustedDays;
  }
}
