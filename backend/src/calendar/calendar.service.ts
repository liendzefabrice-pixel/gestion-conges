import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getMonthData(month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [internalEvents, leaveRequests, holidays] = await Promise.all([
      this.prisma.internalEvent.findMany({
        where: {
          status: 'ACTIF',
          startDate: { lte: end },
          endDate: { gte: start },
        },
        include: { department: { select: { id: true, name: true } } },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          status: { in: ['APPROUVE', 'EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION'] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: { select: { id: true, name: true } },
            },
          },
          leaveType: { select: { id: true, name: true, color: true } },
        },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.holiday.findMany({
        where: {
          date: { gte: start, lte: end },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    return { month, year, internalEvents, leaveRequests, holidays };
  }
}
