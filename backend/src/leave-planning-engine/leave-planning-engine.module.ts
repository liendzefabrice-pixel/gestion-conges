import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LeavePlanningEngineService } from './leave-planning-engine.service';
import { DeptConflictRule } from './rules/dept-conflict.rule';
import { InternalEventConflictRule } from './rules/internal-event-conflict.rule';

@Module({
  imports: [PrismaModule],
  providers: [LeavePlanningEngineService, DeptConflictRule, InternalEventConflictRule],
  exports: [LeavePlanningEngineService],
})
export class LeavePlanningEngineModule {}
