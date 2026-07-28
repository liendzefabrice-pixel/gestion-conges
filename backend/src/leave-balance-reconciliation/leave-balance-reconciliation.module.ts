import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LeaveBalanceReconciliationService } from './leave-balance-reconciliation.service';

@Module({
  imports: [ScheduleModule],
  providers: [LeaveBalanceReconciliationService],
  exports: [LeaveBalanceReconciliationService],
})
export class LeaveBalanceReconciliationModule {}
