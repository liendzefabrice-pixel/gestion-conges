import { Module } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { WorkingDaysModule } from '../working-days/working-days.module';
import { DecisionEngineModule } from '../decision-engine/decision-engine.module';

@Module({
  imports: [WorkingDaysModule, DecisionEngineModule],
  controllers: [LeaveController],
  providers: [LeaveService],
})
export class LeaveModule {}
