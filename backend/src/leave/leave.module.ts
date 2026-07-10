import { Module } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { WorkingDaysModule } from '../working-days/working-days.module';

@Module({
  imports: [WorkingDaysModule],
  controllers: [LeaveController],
  providers: [LeaveService],
})
export class LeaveModule {}
