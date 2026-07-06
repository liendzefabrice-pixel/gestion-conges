import { Module } from '@nestjs/common';
import { LeavePlanningService } from './leave-planning.service';
import { LeavePlanningController } from './leave-planning.controller';

@Module({
  controllers: [LeavePlanningController],
  providers: [LeavePlanningService],
})
export class LeavePlanningModule {}
