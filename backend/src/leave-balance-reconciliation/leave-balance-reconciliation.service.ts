import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveBalanceReconciliationService {
  private readonly logger = new Logger(LeaveBalanceReconciliationService.name);
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledReconciliation(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Une réconciliation est déjà en cours. Exécution cron ignorée.');
      return;
    }

    this.logger.log('Début de la réconciliation automatique des soldes (02:00)');

    try {
      const result = await this.reconcile();
      this.logger.log(`Réconciliation automatique terminée : ${result.updated} mis à jour, ${result.created} créés, ${result.unchanged} inchangés`);
    } catch (error) {
      this.logger.error(`Échec de la réconciliation automatique : ${error.message}`);
    }
  }

  async reconcile(): Promise<{ updated: number; created: number; unchanged: number; totalBalances: number; elapsedSeconds: number }> {
    if (this.isRunning) {
      throw new ConflictException('Une réconciliation est déjà en cours.');
    }

    this.isRunning = true;
    const startTime = Date.now();
    let totalBalances = 0;
    let updated = 0;
    let created = 0;
    let unchanged = 0;

    try {
      const admin = await this.prisma.user.findFirst({
        where: { role: { name: 'ADMIN' } },
        orderBy: { id: 'asc' },
      });

      const employees = await this.prisma.employee.findMany();
      const leaveTypes = await this.prisma.leaveType.findMany({
        where: { isActive: true, deductsFromAnnualBalance: true },
      });

      const years = await this.collectAllYears();

      for (const employee of employees) {
        for (const leaveType of leaveTypes) {
          for (const year of years) {
            totalBalances++;
            const result = await this.reconcileOne(employee.id, leaveType.id, year, admin?.id);

            if (result === 'created') created++;
            else if (result === 'updated') updated++;
            else unchanged++;
          }
        }
      }

      const elapsedSeconds = (Date.now() - startTime) / 1000;

      this.logger.log('');
      this.logger.log('=====================================');
      this.logger.log('Réconciliation automatique terminée');
      this.logger.log('=====================================');
      this.logger.log(`Employés analysés     : ${employees.length}`);
      this.logger.log(`Soldes analysés       : ${totalBalances}`);
      this.logger.log(`Créés                 : ${created}`);
      this.logger.log(`Mis à jour            : ${updated}`);
      this.logger.log(`Inchangés             : ${unchanged}`);
      this.logger.log(`Temps d\'exécution     : ${elapsedSeconds.toFixed(2)} s`);
      this.logger.log('=====================================');

      return { updated, created, unchanged, totalBalances, elapsedSeconds };
    } finally {
      this.isRunning = false;
    }
  }

  private async collectAllYears(): Promise<number[]> {
    const yearSet = new Set<number>();

    const balanceYears = await this.prisma.leaveBalance.findMany({
      select: { year: true },
      distinct: ['year'],
    });
    for (const b of balanceYears) yearSet.add(b.year);

    const requestYears = await this.prisma.leaveRequest.findMany({
      select: { startDate: true },
    });
    for (const r of requestYears) yearSet.add(r.startDate.getFullYear());

    if (yearSet.size === 0) {
      yearSet.add(new Date().getFullYear());
    }

    return Array.from(yearSet).sort();
  }

  private async reconcileOne(
    employeeId: number,
    leaveTypeId: number,
    year: number,
    adminId: number | undefined,
  ): Promise<'created' | 'updated' | 'unchanged'> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const approvedSum = await this.prisma.leaveRequest.aggregate({
      where: {
        employeeId,
        leaveTypeId,
        status: 'APPROUVE',
        startDate: { gte: startOfYear },
        endDate: { lte: endOfYear },
      },
      _sum: { duration: true },
    });

    const pendingSum = await this.prisma.leaveRequest.aggregate({
      where: {
        employeeId,
        leaveTypeId,
        status: { in: ['EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION', 'AVIS_RH_RENDU'] },
        startDate: { gte: startOfYear },
        endDate: { lte: endOfYear },
      },
      _sum: { duration: true },
    });

    const newUsedDays = approvedSum._sum.duration ?? 0;
    const newPendingDays = pendingSum._sum.duration ?? 0;

    const existing = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year },
      },
    });

    if (!existing) {
      await this.prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId,
          year,
          totalDays: 0,
          adjustedDays: 0,
          usedDays: newUsedDays,
          pendingDays: newPendingDays,
          status: 'ACTIF',
        },
      });

      if (adminId) {
        const leaveType = await this.prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
        await this.prisma.auditLog.create({
          data: {
            action: 'LEAVE_BALANCE_RECONCILED',
            entityType: 'LeaveBalance',
            entityId: 0,
            newValue: {
              employeeId,
              leaveType: leaveType?.name,
              year,
              usedDays: `0 -> ${newUsedDays}`,
              pendingDays: `0 -> ${newPendingDays}`,
              reason: 'Automatic Leave Balance Reconciliation — Nightly automatic reconciliation',
            },
            userId: adminId,
          },
        });
      }

      return 'created';
    }

    if (existing.usedDays === newUsedDays && existing.pendingDays === newPendingDays) {
      return 'unchanged';
    }

    const oldUsedDays = existing.usedDays;
    const oldPendingDays = existing.pendingDays;

    await this.prisma.leaveBalance.update({
      where: { id: existing.id },
      data: { usedDays: newUsedDays, pendingDays: newPendingDays },
    });

    if (adminId) {
      const leaveType = await this.prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
      await this.prisma.auditLog.create({
        data: {
          action: 'LEAVE_BALANCE_RECONCILED',
          entityType: 'LeaveBalance',
          entityId: existing.id,
          oldValue: {
            employeeId,
            leaveType: leaveType?.name,
            year,
            usedDays: oldUsedDays,
            pendingDays: oldPendingDays,
          },
          newValue: {
            employeeId,
            leaveType: leaveType?.name,
            year,
            usedDays: `${oldUsedDays} -> ${newUsedDays}`,
            pendingDays: `${oldPendingDays} -> ${newPendingDays}`,
            reason: 'Automatic Leave Balance Reconciliation — Nightly automatic reconciliation',
          },
          userId: adminId,
        },
      });
    }

    return 'updated';
  }
}
