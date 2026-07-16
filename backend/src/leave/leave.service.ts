import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { HrReviewDto } from './dto/hr-review.dto';
import { DirectorDecisionDto } from './dto/director-decision.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkingDaysService } from '../working-days/working-days.service';
import { DecisionEngineService } from '../decision-engine/decision-engine.service';

const ANNUAL_LEAVE_NAMES = ['congé annuel', 'annuel', 'annual'];

@Injectable()
export class LeaveService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private workingDaysService: WorkingDaysService,
    private decisionEngineService: DecisionEngineService,
  ) {}

  private async recordHistory(
    tx: any,
    leaveRequestId: number,
    previousStatus: string | null,
    newStatus: string,
    userId: number,
    comment?: string,
  ) {
    await tx.leaveRequestHistory.create({
      data: {
        leaveRequestId,
        previousStatus,
        newStatus,
        comment,
        userId,
      },
    });
  }

  private async recordAuditLog(
    tx: any,
    action: string,
    entityId: number,
    userId: number,
    oldValue?: any,
    newValue?: any,
  ) {
    await tx.auditLog.create({
      data: {
        action,
        entityType: 'LEAVE_REQUEST',
        entityId,
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined,
        userId,
      },
    });
  }

  private async computeReturnDate(startDate: Date, duration: number): Promise<Date> {
    let remaining = duration;
    const returnDate = new Date(startDate);
    while (remaining > 0) {
      returnDate.setDate(returnDate.getDate() + 1);
      const dayOfWeek = returnDate.getDay();
      if (dayOfWeek !== 0) {
        const isHoliday = await this.workingDaysService.isHoliday(returnDate);
        if (!isHoliday) {
          remaining--;
        }
      }
    }
    return returnDate;
  }

  private isAnnualLeave(leaveTypeName: string): boolean {
    const lower = leaveTypeName.toLowerCase();
    return ANNUAL_LEAVE_NAMES.some((name) => lower.includes(name));
  }

  async createLeaveType(createLeaveTypeDto: CreateLeaveTypeDto) {
    const existing = await this.prisma.leaveType.findUnique({
      where: { name: createLeaveTypeDto.name },
    });

    if (existing) {
      throw new BadRequestException('Ce type de congé existe déjà');
    }

    const leaveType = await this.prisma.leaveType.create({ data: createLeaveTypeDto });

    this.notificationsService.leaveTypeCreated(leaveType.id, leaveType.name);

    return leaveType;
  }

  async findAllLeaveTypes() {
    return this.prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
  }

  async findLeaveTypeById(id: number) {
    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id },
    });

    if (!leaveType) {
      throw new NotFoundException('Type de congé introuvable');
    }

    return leaveType;
  }

  async updateLeaveType(id: number, updateLeaveTypeDto: UpdateLeaveTypeDto) {
    await this.findLeaveTypeById(id);
    return this.prisma.leaveType.update({
      where: { id },
      data: updateLeaveTypeDto,
    });
  }

  async removeLeaveType(id: number) {
    await this.findLeaveTypeById(id);
    return this.prisma.leaveType.delete({ where: { id } });
  }

  async createRequest(employeeId: number, createLeaveRequestDto: CreateLeaveRequestDto) {
    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: createLeaveRequestDto.leaveTypeId },
    });

    if (!leaveType || !leaveType.isActive) {
      throw new BadRequestException('Type de congé invalide ou inactif');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: { select: { gender: true } } },
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    const now = new Date();
    const startDate = new Date(createLeaveRequestDto.startDate);
    const endDate = new Date(createLeaveRequestDto.endDate);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('La date de début ne peut pas être dans le passé');
    }

    if (endDate < startDate) {
      throw new BadRequestException('La date de fin doit être après la date de début');
    }

    if (leaveType.minDuration && leaveType.minDuration > 0) {
      if (endDate < new Date(startDate.getTime() + (leaveType.minDuration - 1) * 86400000)) {
        throw new BadRequestException(`La durée minimale pour ce type de congé est de ${leaveType.minDuration} jour(s)`);
      }
    }

    if (leaveType.maxDuration) {
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
      if (diffDays > leaveType.maxDuration) {
        throw new BadRequestException(`La durée maximale pour ce type de congé est de ${leaveType.maxDuration} jour(s)`);
      }
    }

    const isAnnual = this.isAnnualLeave(leaveType.name);

    if (isAnnual) {
      const hireDate = new Date(employee.hireDate);
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (hireDate > oneYearAgo) {
        throw new BadRequestException(
          'Vous devez avoir au moins 1 an d\'ancienneté pour poser des congés annuels',
        );
      }
    }

    if (leaveType.name.toLowerCase().includes('maternité')) {
      if (employee.user?.gender !== 'Femme') {
        throw new BadRequestException('Le congé maternité est réservé aux employées de sexe féminin');
      }

      const existingMaternity = await this.prisma.leaveRequest.findFirst({
        where: {
          employeeId,
          status: { in: ['APPROUVE', 'EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION', 'AVIS_RH_RENDU'] },
          leaveType: { name: { contains: 'maternité', mode: 'insensitive' } },
        },
      });

      if (existingMaternity) {
        throw new BadRequestException('Vous avez déjà une demande de congé maternité en cours');
      }
    }

    if (!leaveType.deductsFromAnnualBalance) {
      const existingOverlap = await this.prisma.leaveRequest.findFirst({
        where: {
          employeeId,
          status: { in: ['APPROUVE', 'EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION', 'AVIS_RH_RENDU'] },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      });

      if (existingOverlap) {
        throw new BadRequestException(
          'Vous avez déjà une demande de congé ou permission sur cette période',
        );
      }
    }

    const { workingDays: duration } = await this.workingDaysService.calculate(startDate, endDate);
    if (duration === 0) {
      throw new BadRequestException('La période sélectionnée ne contient aucun jour ouvrable');
    }

    let planningId: number | null = null;
    if (isAnnual) {
      const planning = await this.prisma.annualLeavePlanning.findUnique({
        where: { employeeId_year: { employeeId, year: startDate.getFullYear() } },
      });

      if (!planning) {
        throw new BadRequestException(
          'Vous n\'avez pas de planification annuelle pour cette année. Veuillez contacter le RH.',
        );
      }
      planningId = planning.id;
    }

    const returnDate = await this.computeReturnDate(endDate, 1);

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId: createLeaveRequestDto.leaveTypeId,
          annualLeavePlanningId: planningId,
          startDate,
          endDate,
          returnDate,
          duration,
          reason: createLeaveRequestDto.reason,
          status: 'EN_ATTENTE_RH',
        },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
          leaveType: true,
        },
      });

      await this.recordHistory(tx, request.id, null, 'EN_ATTENTE_RH', request.employee.user.id);
      await this.recordAuditLog(tx, 'LEAVE_REQUEST_CREATED', request.id, request.employee.user.id, null, {
        leaveType: leaveType.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration,
        returnDate: returnDate.toISOString(),
      });

      if (leaveType.deductsFromAnnualBalance) {
        const year = startDate.getFullYear();
        const leaveBalance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId,
              leaveTypeId: createLeaveRequestDto.leaveTypeId,
              year,
            },
          },
        });

        if (leaveBalance) {
          await tx.leaveBalance.update({
            where: { id: leaveBalance.id },
            data: { pendingDays: leaveBalance.pendingDays + duration },
          });
        }
      }

      const employeeName = `${request.employee.user.firstName || ''} ${request.employee.user.lastName || ''}`.trim() || request.employee.user.email;
      this.notificationsService.leaveCreated(
        request.id,
        employeeId,
        employeeName,
        request.leaveType.name,
        startDate,
        endDate,
      );

      return request;
    });
  }

  async findMyRequests(employeeId: number) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllRequests(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        skip,
        take: pageSize,
        include: {
          employee: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, department: { select: { name: true } } },
          },
          leaveType: true,
          reviewedBy: { select: { id: true, email: true } },
          decidedBy: { select: { id: true, email: true } },
          histories: {
            include: { user: { select: { id: true, email: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaveRequest.count(),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findRequestsByStatus(statuses: string[]) {
    return this.prisma.leaveRequest.findMany({
      where: { status: { in: statuses as any } },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, department: { select: { name: true } } },
        },
        leaveType: true,
        reviewedBy: { select: { id: true, email: true } },
        decidedBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async hrReview(id: number, userId: number, hrReviewDto: HrReviewDto) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    if (request.status !== 'EN_ATTENTE_RH') {
      throw new BadRequestException(
        'Seules les demandes en attente du RH peuvent être examinées',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: 'AVIS_RH_RENDU',
          hrComment: hrReviewDto.hrComment,
          hrOpinion: hrReviewDto.hrOpinion,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
          leaveType: true,
          reviewedBy: { select: { id: true, email: true } },
        },
      });

      await this.recordHistory(
        tx,
        id,
        'EN_ATTENTE_RH',
        'AVIS_RH_RENDU',
        userId,
        hrReviewDto.hrComment || undefined,
      );

      await this.recordAuditLog(
        tx,
        'LEAVE_REQUEST_REVIEWED',
        id,
        userId,
        { status: 'EN_ATTENTE_RH' },
        { status: 'AVIS_RH_RENDU', hrOpinion: hrReviewDto.hrOpinion, hrComment: hrReviewDto.hrComment },
      );

      const rhName = updated.reviewedBy?.email || 'RH';
      this.notificationsService.leaveRhReviewed(id, request.employeeId, rhName);

      return updated;
    });
  }

  async transmitToDirector(id: number, userId: number) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
        leaveType: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    if (request.status !== 'AVIS_RH_RENDU') {
      throw new BadRequestException(
        'Seules les demandes avec avis RH rendu peuvent être transmises à la direction',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: 'EN_ATTENTE_DIRECTION',
        },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
          leaveType: true,
          reviewedBy: { select: { id: true, email: true } },
        },
      });

      await this.recordHistory(tx, id, 'AVIS_RH_RENDU', 'EN_ATTENTE_DIRECTION', userId);
      await this.recordAuditLog(
        tx,
        'LEAVE_REQUEST_TRANSMITTED',
        id,
        userId,
        { status: 'AVIS_RH_RENDU' },
        { status: 'EN_ATTENTE_DIRECTION' },
      );

      const employeeName = `${updated.employee.user.firstName || ''} ${updated.employee.user.lastName || ''}`.trim() || updated.employee.user.email;
      this.notificationsService.leaveSentToDirector(id, request.employeeId, employeeName, updated.leaveType.name);

      return updated;
    });
  }

  async directorDecision(id: number, userId: number, dto: DirectorDecisionDto) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
        leaveType: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    if (request.status !== 'EN_ATTENTE_DIRECTION') {
      throw new BadRequestException(
        'La demande doit d\'abord être examinée par le RH et transmise à la direction',
      );
    }

    if (request.leaveType.deductsFromAnnualBalance) {
      try {
        const analysis = await this.decisionEngineService.analyze(
          'LEAVE_REQUEST',
          id,
          userId,
        );

        if (analysis.score < 50) {
          this.notificationsService.leaveRiskAlert(
            id,
            request.employeeId,
            request.employee.user.firstName
              ? `${request.employee.user.firstName} ${request.employee.user.lastName || ''}`
              : request.employee.user.email,
            analysis.score,
            analysis.summary || 'Risques détectés par le moteur de décision',
          );
        }
      } catch (err) {
        // Ne pas bloquer la décision si l'analyse échoue
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: dto.decision,
          directorComment: dto.directorComment,
          decidedById: userId,
          decidedAt: new Date(),
        },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
          leaveType: true,
          decidedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      await this.recordHistory(
        tx,
        id,
        request.status,
        dto.decision,
        userId,
        dto.directorComment,
      );

      await this.recordAuditLog(
        tx,
        dto.decision === 'APPROUVE' ? 'LEAVE_REQUEST_APPROVED' : 'LEAVE_REQUEST_REJECTED',
        id,
        userId,
        { status: request.status },
        { status: dto.decision, comment: dto.directorComment },
      );

      if (request.leaveType.deductsFromAnnualBalance) {
        const year = request.startDate.getFullYear();
        const leaveBalance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              year,
            },
          },
        });

        if (leaveBalance) {
          const newPendingDays = leaveBalance.pendingDays - request.duration;

          if (dto.decision === 'APPROUVE') {
            await tx.leaveBalance.update({
              where: { id: leaveBalance.id },
              data: {
                pendingDays: Math.max(0, newPendingDays),
                usedDays: leaveBalance.usedDays + request.duration,
              },
            });

            await tx.balanceAdjustment.create({
              data: {
                operationType: 'DEDUCTION_CONGES',
                previousRemaining: leaveBalance.totalDays + leaveBalance.adjustedDays - leaveBalance.usedDays - leaveBalance.pendingDays,
                newRemaining: leaveBalance.totalDays + leaveBalance.adjustedDays - (leaveBalance.usedDays + request.duration) - Math.max(0, newPendingDays),
                comment: `Congé ${request.leaveType.name} approuvé : ${request.duration} jour(s) du ${request.startDate.toLocaleDateString()} au ${request.endDate.toLocaleDateString()}`,
                leaveBalanceId: leaveBalance.id,
                authorId: userId,
              },
            });
          } else {
            await tx.leaveBalance.update({
              where: { id: leaveBalance.id },
              data: { pendingDays: Math.max(0, newPendingDays) },
            });
          }
        }
      }

      const directorName = `${updated.decidedBy?.firstName || ''} ${updated.decidedBy?.lastName || ''}`.trim() || updated.decidedBy?.email || 'Direction';
      if (dto.decision === 'APPROUVE') {
        this.notificationsService.leaveApproved(id, request.employeeId, request.leaveType.name, directorName);
      } else {
        this.notificationsService.leaveRefused(id, request.employeeId, request.leaveType.name, directorName);
      }

      return updated;
    });
  }

  async cancelRequest(id: number, employeeId: number) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    if (request.employeeId !== employeeId) {
      throw new BadRequestException('Vous ne pouvez annuler que vos propres demandes');
    }

    if (request.status !== 'EN_ATTENTE_RH' && request.status !== 'BROUILLON') {
      throw new BadRequestException(
        'Seules les demandes en attente ou en brouillon peuvent être annulées',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: { status: 'ANNULE' },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
          leaveType: true,
        },
      });

      await this.recordHistory(tx, id, request.status, 'ANNULE', employeeId);
      await this.recordAuditLog(
        tx,
        'LEAVE_REQUEST_CANCELLED',
        id,
        employeeId,
        { status: request.status },
        { status: 'ANNULE' },
      );

      if (request.leaveType.deductsFromAnnualBalance) {
        const year = request.startDate.getFullYear();
        const leaveBalance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              year,
            },
          },
        });

        if (leaveBalance && leaveBalance.pendingDays >= request.duration) {
          await tx.leaveBalance.update({
            where: { id: leaveBalance.id },
            data: { pendingDays: leaveBalance.pendingDays - request.duration },
          });
        }
      }

      const employeeName = `${updated.employee.user.firstName || ''} ${updated.employee.user.lastName || ''}`.trim() || updated.employee.user.email;
      this.notificationsService.leaveCancelled(id, request.employeeId, employeeName, updated.leaveType.name);

      return updated;
    });
  }

  async initLeaveBalance(employeeId: number, year: number) {
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { isActive: true },
    });

    const admin = await this.prisma.user.findFirst({
      where: { role: { name: 'ADMIN' } },
      orderBy: { id: 'asc' },
    });

    for (const leaveType of leaveTypes) {
      if (!leaveType.deductsFromAnnualBalance) continue;

      await this.prisma.$transaction(async (tx) => {
        const balance = await tx.leaveBalance.upsert({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId,
              leaveTypeId: leaveType.id,
              year,
            },
          },
          update: {},
          create: {
            employeeId,
            leaveTypeId: leaveType.id,
            year,
            totalDays: leaveType.defaultDays,
          },
        });

        if (admin && balance.createdAt === balance.updatedAt) {
          const remaining = balance.totalDays + balance.adjustedDays - balance.usedDays - balance.pendingDays;
          await tx.balanceAdjustment.create({
            data: {
              operationType: 'INITIALISATION',
              previousRemaining: 0,
              newRemaining: remaining,
              comment: `Initialisation du compteur pour ${leaveType.name} — Année ${year}`,
              leaveBalanceId: balance.id,
              authorId: admin.id,
            },
          });
        }
      });
    }
  }

  async getLeaveBalances(employeeId: number) {
    return this.prisma.leaveBalance.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { year: 'desc' },
    });
  }

  async getEmployeeByUserId(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      throw new NotFoundException('Profil employé introuvable');
    }

    return employee;
  }

  async findRequestById(id: number) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, department: { select: { name: true } } },
        },
        leaveType: true,
        reviewedBy: { select: { id: true, email: true } },
        decidedBy: { select: { id: true, email: true } },
        histories: {
          include: { user: { select: { id: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    return request;
  }

  async getCalendarStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalRequests,
      pendingRequests,
      approvedThisMonth,
      activeLeaves,
    ] = await Promise.all([
      this.prisma.leaveRequest.count(),
      this.prisma.leaveRequest.count({
        where: { status: { in: ['EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION', 'AVIS_RH_RENDU'] } },
      }),
      this.prisma.leaveRequest.count({
        where: {
          status: 'APPROUVE',
          startDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      this.prisma.leaveRequest.count({
        where: {
          status: 'APPROUVE',
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
        },
      }),
    ]);

    return { totalRequests, pendingRequests, approvedThisMonth, activeLeaves };
  }
}
