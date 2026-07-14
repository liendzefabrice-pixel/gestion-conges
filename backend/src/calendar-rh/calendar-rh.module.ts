import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CalendarRhController } from './calendar-rh.controller';
import { CalendarRhService } from './calendar-rh.service';

@Module({
  imports: [PrismaModule],
  controllers: [CalendarRhController],
  providers: [CalendarRhService],
})
export class CalendarRhModule {}
