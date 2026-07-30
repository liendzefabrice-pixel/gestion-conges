import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LeavePlanningEngineService } from './leave-planning-engine.service';
import { DeptConflictRule } from './rules/dept-conflict.rule';
import { InternalEventConflictRule } from './rules/internal-event-conflict.rule';
import { WorkingDaysModule } from '../working-days/working-days.module';

@Module({
  imports: [PrismaModule, WorkingDaysModule],
  providers: [LeavePlanningEngineService, DeptConflictRule, InternalEventConflictRule],
  exports: [LeavePlanningEngineService],
})
export class LeavePlanningEngineModule {}
