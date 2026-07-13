import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LeavePlanningEngineService } from './leave-planning-engine.service';
import { DeptConflictRule } from './rules/dept-conflict.rule';

@Module({
  imports: [PrismaModule],
  providers: [LeavePlanningEngineService, DeptConflictRule],
  exports: [LeavePlanningEngineService],
})
export class LeavePlanningEngineModule {}
