import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { WorkingDaysResult } from './interfaces/working-days-result.interface';

@Injectable()
export class WorkingDaysService {
  constructor(private prisma: PrismaService) {}

  async calculate(startDate: Date, endDate: Date): Promise<WorkingDaysResult> {
    const holidays = await this.prisma.holiday.findMany();

    let calendarDays = 0;
    let sundays = 0;
    let holidaysExcluded = 0;

    const current = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    ));
    const end = new Date(Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
    ));

    while (current <= end) {
      calendarDays++;
      const dayOfWeek = current.getUTCDay();

      if (dayOfWeek === 0) {
        sundays++;
      } else if (this.checkIsHoliday(current, holidays)) {
        holidaysExcluded++;
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    const workingDays = calendarDays - sundays - holidaysExcluded;

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      calendarDays,
      sundays,
      holidaysExcluded,
      workingDays,
    };
  }

  async isHoliday(date: Date): Promise<boolean> {
    const holidays = await this.prisma.holiday.findMany();
    return this.checkIsHoliday(date, holidays);
  }

  private checkIsHoliday(date: Date, holidays: { date: Date; isRecurring: boolean }[]): boolean {
    for (const holiday of holidays) {
      if (holiday.isRecurring) {
        if (
          date.getUTCMonth() === holiday.date.getUTCMonth() &&
          date.getUTCDate() === holiday.date.getUTCDate()
        ) {
          return true;
        }
      } else {
        const hd = new Date(Date.UTC(
          holiday.date.getUTCFullYear(),
          holiday.date.getUTCMonth(),
          holiday.date.getUTCDate(),
        ));
        if (date.getTime() === hd.getTime()) {
          return true;
        }
      }
    }
    return false;
  }
}
