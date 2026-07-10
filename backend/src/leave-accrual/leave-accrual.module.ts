import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SeniorityModule } from '../seniority/seniority.module';
import { LeaveAccrualService } from './leave-accrual.service';
import { LeaveAccrualController } from './leave-accrual.controller';

@Module({
  imports: [PrismaModule, SeniorityModule],
  controllers: [LeaveAccrualController],
  providers: [LeaveAccrualService],
  exports: [LeaveAccrualService],
})
export class LeaveAccrualModule {}
