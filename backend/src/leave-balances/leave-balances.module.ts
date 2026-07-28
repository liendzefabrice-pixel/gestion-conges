import { Module } from '@nestjs/common';
import { LeaveBalancesService } from './leave-balances.service';
import { LeaveBalancesController } from './leave-balances.controller';
import { LeaveBalanceReconciliationModule } from '../leave-balance-reconciliation/leave-balance-reconciliation.module';

@Module({
  imports: [LeaveBalanceReconciliationModule],
  controllers: [LeaveBalancesController],
  providers: [LeaveBalancesService],
})
export class LeaveBalancesModule {}
