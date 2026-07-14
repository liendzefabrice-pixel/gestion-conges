import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarRhService {
  constructor(private prisma: PrismaService) {}

  async getMonthData(month: number, year: number, filters?: {
    departmentId?: number;
    employeeId?: number;
    leaveTypeId?: number;
    eventType?: string;
    priority?: string;
    status?: string;
    search?: string;
  }) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaveWhere: any = {
      startDate: { lte: end },
      endDate: { gte: start },
    };
    if (filters?.departmentId) leaveWhere.employee = { departmentId: filters.departmentId };
    if (filters?.employeeId) leaveWhere.employeeId = filters.employeeId;
    if (filters?.leaveTypeId) leaveWhere.leaveTypeId = filters.leaveTypeId;
    if (filters?.status) {
      if (filters.status === 'EN_COURS') {
        leaveWhere.status = { in: ['APPROUVE'] };
        leaveWhere.startDate = { lte: today };
        leaveWhere.endDate = { gte: today };
      } else {
        leaveWhere.status = filters.status;
      }
    }

    const eventWhere: any = { status: 'ACTIF', startDate: { lte: end }, endDate: { gte: start } };
    if (filters?.departmentId) {
      eventWhere.OR = [
        { allCompany: true },
        { departmentId: filters.departmentId },
      ];
    }
    if (filters?.eventType) eventWhere.type = filters.eventType;
    if (filters?.priority) eventWhere.priority = filters.priority;

    const proposalWhere: any = {
      status: { not: 'REFUSEE' },
      desiredStartDate: { lte: end },
    };
    if (filters?.departmentId) proposalWhere.employee = { departmentId: filters.departmentId };
    if (filters?.employeeId) proposalWhere.employeeId = filters.employeeId;

    const [leaveRequests, internalEvents, holidays, proposals, campaigns] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where: leaveWhere,
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, position: true, department: { select: { id: true, name: true } } },
          },
          leaveType: { select: { id: true, name: true, color: true } },
        },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.internalEvent.findMany({
        where: eventWhere,
        include: { department: { select: { id: true, name: true } } },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.holiday.findMany({
        where: { date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.leaveProposal.findMany({
        where: proposalWhere,
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, position: true, department: { select: { id: true, name: true } } },
          },
          campaign: { select: { id: true, label: true, year: true } },
        },
        orderBy: { desiredStartDate: 'asc' },
      }),
      this.prisma.leaveCampaign.findFirst({
        where: { status: 'OUVERTE' },
        select: { id: true, label: true, year: true },
      }),
    ]);

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      const filterBySearch = (items: any[], fields: string[]) =>
        items.filter((item) => fields.some((f) => {
          const val = f.split('.').reduce((o, k) => o?.[k], item);
          return val && String(val).toLowerCase().includes(searchLower);
        }));
      return {
        month,
        year,
        leaveRequests: filterBySearch(leaveRequests, ['employee.firstName', 'employee.lastName', 'employee.department.name']),
        internalEvents: filterBySearch(internalEvents, ['title', 'department.name']),
        holidays,
        proposals: filterBySearch(proposals, ['employee.firstName', 'employee.lastName', 'employee.department.name']),
        campaign: campaigns,
        conflicts: this.detectConflicts(leaveRequests, internalEvents, proposals),
      };
    }

    return {
      month,
      year,
      leaveRequests,
      internalEvents,
      holidays,
      proposals,
      campaign: campaigns,
      conflicts: this.detectConflicts(leaveRequests, internalEvents, proposals),
    };
  }

  async getStats(month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      leavesToday,
      leavesThisMonth,
      eventsThisMonth,
      openCampaign,
    ] = await Promise.all([
      this.prisma.leaveRequest.count({
        where: {
          status: 'APPROUVE',
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      this.prisma.leaveRequest.count({
        where: {
          status: { in: ['APPROUVE', 'EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION'] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
      }),
      this.prisma.internalEvent.count({
        where: {
          status: 'ACTIF',
          startDate: { lte: end },
          endDate: { gte: start },
        },
      }),
      this.prisma.leaveCampaign.findFirst({
        where: { status: 'OUVERTE' },
        select: { id: true, label: true },
      }),
    ]);

    const employeesAbsent = await this.prisma.leaveRequest.findMany({
      where: {
        status: 'APPROUVE',
        startDate: { lte: today },
        endDate: { gte: today },
      },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });

    return {
      leavesToday,
      leavesThisMonth,
      absentEmployeesCount: employeesAbsent.length,
      eventsThisMonth,
      campaignOpen: !!openCampaign,
      campaignLabel: openCampaign?.label || null,
    };
  }

  private detectConflicts(leaveRequests: any[], internalEvents: any[], proposals: any[]) {
    const conflicts: any[] = [];

    const dateOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
      aStart <= bEnd && aEnd >= bStart;

    for (const leave of leaveRequests) {
      const ls = new Date(leave.startDate);
      const le = new Date(leave.endDate);

      for (const event of internalEvents) {
        const es = new Date(event.startDate);
        const ee = new Date(event.endDate);
        if (dateOverlap(ls, le, es, ee)) {
          conflicts.push({
            type: 'LEAVE_EVENT',
            severity: event.priority === 'CRITIQUE' || event.priority === 'HAUTE' ? 'HIGH' : 'LOW',
            leaveId: leave.id,
            leaveEmployee: `${leave.employee.firstName} ${leave.employee.lastName}`,
            eventId: event.id,
            eventTitle: event.title,
            eventType: event.type,
            eventPriority: event.priority,
          });
        }
      }

      for (const other of leaveRequests) {
        if (other.id === leave.id) continue;
        const os = new Date(other.startDate);
        const oe = new Date(other.endDate);
        if (dateOverlap(ls, le, os, oe) && leave.employee.departmentId === other.employee.departmentId) {
          conflicts.push({
            type: 'LEAVE_LEAVE',
            severity: 'MEDIUM',
            leaveId: leave.id,
            leaveEmployee: `${leave.employee.firstName} ${leave.employee.lastName}`,
            otherLeaveId: other.id,
            otherEmployee: `${other.employee.firstName} ${other.employee.lastName}`,
          });
        }
      }
    }

    return conflicts;
  }
}
