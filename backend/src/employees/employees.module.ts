import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { LeaveBalanceEngineModule } from '../leave-balance-engine/leave-balance-engine.module';

@Module({
  imports: [LeaveBalanceEngineModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
