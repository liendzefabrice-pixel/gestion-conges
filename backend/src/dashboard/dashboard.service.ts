import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const [users, employees, departments, leaveTypes] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.employee.count(),
        this.prisma.department.count(),
        this.prisma.leaveType.count({ where: { isActive: true } }),
      ]);

    const [pendingLeaves, pendingPermissions, openCampaign, campaignProposals, eligibleEmployees] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { status: 'EN_ATTENTE_RH' } }),
      this.prisma.permissionRequest.count({ where: { status: 'EN_ATTENTE_RH' } }),
      this.prisma.leaveCampaign.findFirst({ where: { status: 'OUVERTE' }, select: { id: true, label: true, year: true } }),
      this.getCampaignProposalCounts(),
      this.countEligibleEmployees(),
    ]);

    return {
      users,
      employees,
      departments,
      leaveTypes,
      pendingRequests: {
        leave: pendingLeaves,
        permission: pendingPermissions,
        total: pendingLeaves + pendingPermissions,
      },
      campaign: openCampaign ? {
        id: openCampaign.id,
        label: openCampaign.label,
        year: openCampaign.year,
        eligibleEmployees: eligibleEmployees,
        proposalsReceived: campaignProposals,
        participationRate: eligibleEmployees > 0 ? Math.round((campaignProposals / eligibleEmployees) * 100) : 0,
      } : null,
    };
  }

  private async getCampaignProposalCounts(): Promise<number> {
    const openCampaign = await this.prisma.leaveCampaign.findFirst({
      where: { status: 'OUVERTE' },
    });
    if (!openCampaign) return 0;
    return this.prisma.leaveProposal.count({
      where: { campaignId: openCampaign.id },
    });
  }

  private async countEligibleEmployees(): Promise<number> {
    const employees = await this.prisma.employee.findMany({
      where: { user: { isActive: true, role: { name: { not: 'ADMIN' } } } },
    });
    let count = 0;
    const now = new Date();
    for (const emp of employees) {
      const diffMonths = (now.getFullYear() - emp.hireDate.getFullYear()) * 12 + now.getMonth() - emp.hireDate.getMonth();
      if (diffMonths >= 12) count++;
    }
    return count;
  }

  async getHrStats() {
    const [pendingLeaves, pendingPermissions] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { status: 'EN_ATTENTE_RH' } }),
      this.prisma.permissionRequest.count({ where: { status: 'EN_ATTENTE_RH' } }),
    ]);

    const [totalLeaves, totalPermissions, totalEmployees] = await Promise.all([
      this.prisma.leaveRequest.count(),
      this.prisma.permissionRequest.count(),
      this.prisma.employee.count(),
    ]);

    const openCampaign = await this.prisma.leaveCampaign.findFirst({
      where: { status: 'OUVERTE' },
      include: { _count: { select: { proposals: true } } },
    });

    let campaign: any = null;
    if (openCampaign) {
      const eligibleCount = await this.countEligibleEmployees();
      campaign = {
        id: openCampaign.id,
        label: openCampaign.label,
        year: openCampaign.year,
        eligibleEmployees: eligibleCount,
        proposalsReceived: openCampaign._count.proposals,
        participationRate: eligibleCount > 0 ? Math.round((openCampaign._count.proposals / eligibleCount) * 100) : 0,
      };
    }

    return {
      employees: totalEmployees,
      toReview: {
        leave: pendingLeaves,
        permission: pendingPermissions,
        total: pendingLeaves + pendingPermissions,
      },
      totalProcessed: {
        leave: totalLeaves,
        permission: totalPermissions,
      },
      campaign,
    };
  }

  async getDirectorStats() {
    const [leavesToDecide, permissionsToDecide] = await Promise.all([
      this.prisma.leaveRequest.count({
        where: { status: { in: ['AVIS_RH_RENDU', 'EN_ATTENTE_DIRECTION'] } },
      }),
      this.prisma.permissionRequest.count({ where: { status: 'AVIS_RH_RENDU' } }),
    ]);

    const [approvedLeaves, rejectedLeaves] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { status: 'APPROUVE' } }),
      this.prisma.leaveRequest.count({ where: { status: 'REFUSE' } }),
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
      return {
        balances: [],
        pendingRequests: { leave: 0, permission: 0, total: 0 },
        eligibleForLeave: false,
      };
    }

    const hireDate = new Date(employee.hireDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const eligibleForLeave = hireDate <= oneYearAgo;

    const currentYear = new Date().getFullYear();

    const [leaveBalances, pendingLeaves, pendingPermissions, proposal] =
      await Promise.all([
        this.prisma.leaveBalance.findMany({
          where: { employeeId: employee.id },
          include: { leaveType: true },
          orderBy: { year: 'desc' },
        }),
        this.prisma.leaveRequest.count({
          where: { employeeId: employee.id, status: { in: ['EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION', 'AVIS_RH_RENDU'] } },
        }),
        this.prisma.permissionRequest.count({
          where: { employeeId: employee.id, status: 'EN_ATTENTE_RH' },
        }),
        this.prisma.leaveProposal.findFirst({
          where: {
            employeeId: employee.id,
            campaign: { year: currentYear },
          },
          select: { status: true, desiredStartDate: true },
          orderBy: { createdAt: 'desc' },
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
      proposal,
      eligibleForLeave,
    };
  }
}
