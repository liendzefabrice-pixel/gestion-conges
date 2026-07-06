import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const [users, employees, departments, services, leaveTypes] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.employee.count(),
        this.prisma.department.count(),
        this.prisma.service.count(),
        this.prisma.leaveType.count({ where: { isActive: true } }),
      ]);

    const [pendingLeaves, pendingPermissions] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.permissionRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      users,
      employees,
      departments,
      services,
      leaveTypes,
      pendingRequests: {
        leave: pendingLeaves,
        permission: pendingPermissions,
        total: pendingLeaves + pendingPermissions,
      },
    };
  }

  async getHrStats() {
    const [pendingLeaves, pendingPermissions] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.permissionRequest.count({ where: { status: 'PENDING' } }),
    ]);

    const [totalLeaves, totalPermissions] = await Promise.all([
      this.prisma.leaveRequest.count(),
      this.prisma.permissionRequest.count(),
    ]);

    const currentYear = new Date().getFullYear();
    const totalEmployees = await this.prisma.employee.count();
    const planningsCount = await this.prisma.annualLeavePlanning.count({
      where: { year: currentYear },
    });

    return {
      toReview: {
        leave: pendingLeaves,
        permission: pendingPermissions,
        total: pendingLeaves + pendingPermissions,
      },
      totalProcessed: {
        leave: totalLeaves,
        permission: totalPermissions,
      },
      planning: {
        totalEmployees,
        withPlanning: planningsCount,
        withoutPlanning: totalEmployees - planningsCount,
      },
    };
  }

  async getDirectorStats() {
    const [leavesToDecide, permissionsToDecide] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { status: 'RH_REVIEWED' } }),
      this.prisma.permissionRequest.count({ where: { status: 'RH_REVIEWED' } }),
    ]);

    const [approvedLeaves, rejectedLeaves] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.leaveRequest.count({ where: { status: 'REJECTED' } }),
    ]);

    return {
      toDecide: {
        leave: leavesToDecide,
        permission: permissionsToDecide,
        total: leavesToDecide + permissionsToDecide,
      },
      decisions: {
        approved: approvedLeaves,
        rejected: rejectedLeaves,
      },
    };
  }

  async getEmployeeStats(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return {};
    }

    const currentYear = new Date().getFullYear();
    const hireDate = new Date(employee.hireDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const eligibleForLeave = hireDate <= oneYearAgo;

    const [leaveBalances, pendingLeaves, pendingPermissions, planning] =
      await Promise.all([
        this.prisma.leaveBalance.findMany({
          where: { employeeId: employee.id },
          include: { leaveType: true },
          orderBy: { year: 'desc' },
        }),
        this.prisma.leaveRequest.count({
          where: { employeeId: employee.id, status: 'PENDING' },
        }),
        this.prisma.permissionRequest.count({
          where: { employeeId: employee.id, status: 'PENDING' },
        }),
        this.prisma.annualLeavePlanning.findUnique({
          where: { employeeId_year: { employeeId: employee.id, year: currentYear } },
        }),
      ]);

    return {
      balances: leaveBalances.map((b) => ({
        type: b.leaveType.name,
        year: b.year,
        total: b.totalDays,
        used: b.usedDays,
        pending: b.pendingDays,
        remaining: b.totalDays - b.usedDays - b.pendingDays,
      })),
      pendingRequests: {
        leave: pendingLeaves,
        permission: pendingPermissions,
        total: pendingLeaves + pendingPermissions,
      },
      planning: planning
        ? { month: planning.month, year: planning.year }
        : null,
      eligibleForLeave,
    };
  }
}
