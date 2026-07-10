import { Module } from '@nestjs/common';
import { SeniorityModule } from '../seniority/seniority.module';
import { LeaveBalanceEngineService } from './leave-balance-engine.service';
import { DefaultBalanceStrategy } from './strategies/default-balance.strategy';
import { AnnualLeaveBalanceStrategy } from './strategies/annual-leave-balance.strategy';

@Module({
  imports: [SeniorityModule],
  providers: [
    LeaveBalanceEngineService,
    DefaultBalanceStrategy,
    AnnualLeaveBalanceStrategy,
  ],
  exports: [LeaveBalanceEngineService],
})
export class LeaveBalanceEngineModule {}
