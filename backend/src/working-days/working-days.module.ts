import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkingDaysService } from './working-days.service';

@Module({
  imports: [PrismaModule],
  providers: [WorkingDaysService],
  exports: [WorkingDaysService],
})
export class WorkingDaysModule {}
