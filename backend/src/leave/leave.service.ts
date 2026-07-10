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

@Injectable()
export class LeaveService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private workingDaysService: WorkingDaysService,
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

  async createLeaveType(createLeaveTypeDto: CreateLeaveTypeDto) {
    const existing = await this.prisma.leaveType.findUnique({
      where: { name: createLeaveTypeDto.name },
    });

    if (existing) {
      throw new BadRequestException('Ce type de congé existe déjà');
    }

    return this.prisma.leaveType.create({ data: createLeaveTypeDto });
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
    });

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    const now = new Date();
    const hireDate = new Date(employee.hireDate);
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (hireDate > oneYearAgo) {
      throw new BadRequestException(
        'Vous devez avoir au moins 1 an d\'ancienneté pour poser des congés',
      );
    }

    const startDate = new Date(createLeaveRequestDto.startDate);
    const endDate = new Date(createLeaveRequestDto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('La date de fin doit être après la date de début');
    }

    const planning = await this.prisma.annualLeavePlanning.findUnique({
      where: { employeeId_year: { employeeId, year: startDate.getFullYear() } },
    });

    if (!planning) {
      throw new BadRequestException(
        'Vous n\'avez pas de planification annuelle pour cette année. Veuillez contacter le RH.',
      );
    }

    const { workingDays: duration } = await this.workingDaysService.calculate(startDate, endDate);
    if (duration === 0) {
      throw new BadRequestException('La période sélectionnée ne contient aucun jour ouvrable');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId: createLeaveRequestDto.leaveTypeId,
          annualLeavePlanningId: planning.id,
          startDate,
          endDate,
          duration,
          reason: createLeaveRequestDto.reason,
          status: 'EN_ATTENTE_RH',
        },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true } } },
          },
          leaveType: true,
        },
      });

      await this.recordHistory(tx, request.id, null, 'EN_ATTENTE_RH', request.employee.user.id);

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

      this.notificationsService.notifyHR(
        'Nouvelle demande de congé',
        `${request.employee.user.email} a soumis une demande de ${request.leaveType.name} du ${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}`,
        'LEAVE_CREATED',
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

  async findAllRequests() {
    return this.prisma.leaveRequest.findMany({
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
    });
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
          include: { user: { select: { id: true, email: true } } },
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
          status: 'EN_ATTENTE_DIRECTION',
          hrComment: hrReviewDto.hrComment,
          hrOpinion: hrReviewDto.hrOpinion,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true } } },
          },
          leaveType: true,
          reviewedBy: { select: { id: true, email: true } },
        },
      });

      await this.recordHistory(
        tx,
        id,
        'EN_ATTENTE_RH',
        'EN_ATTENTE_DIRECTION',
        userId,
        hrReviewDto.hrComment || undefined,
      );

      this.notificationsService.notifyEmployee(
        request.employeeId,
        'Demande de congé examinée',
        'Votre demande de congé a été examinée par le RH. En attente de décision de la direction.',
        'LEAVE_RH_REVIEWED',
      );

      this.notificationsService.notifyDirector(
        'Avis RH donné',
        `Le RH a examiné la demande de ${request.employee.user.email}. Décision requise.`,
        'LEAVE_TRANSMITTED',
      );

      return updated;
    });
  }

  async directorDecision(id: number, userId: number, dto: DirectorDecisionDto) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    if (request.status !== 'AVIS_RH_RENDU' && request.status !== 'EN_ATTENTE_DIRECTION') {
      throw new BadRequestException(
        'La demande doit d\'abord être examinée par le RH',
      );
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
            include: { user: { select: { id: true, email: true } } },
          },
          leaveType: true,
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

          const currentRemaining = leaveBalance.totalDays + leaveBalance.adjustedDays - (leaveBalance.usedDays + request.duration) - (leaveBalance.pendingDays - request.duration);
          const remainingAfter = leaveBalance.totalDays + leaveBalance.adjustedDays - (leaveBalance.usedDays + request.duration) - Math.max(0, newPendingDays);
          await tx.balanceAdjustment.create({
            data: {
              operationType: 'DEDUCTION_CONGES',
              previousRemaining: currentRemaining,
              newRemaining: remainingAfter,
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

      if (dto.decision === 'APPROUVE') {
        this.notificationsService.notifyEmployee(
          request.employeeId,
          'Demande de congé approuvée',
          'Votre demande de congé a été approuvée par la direction.',
          'LEAVE_DECIDED',
        );
      } else {
        this.notificationsService.notifyEmployee(
          request.employeeId,
          'Demande de congé refusée',
          'Votre demande de congé a été refusée par la direction.',
          'LEAVE_DECIDED',
        );
      }

      return updated;
    });
  }

  async cancelRequest(id: number, employeeId: number) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
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
      });

      await this.recordHistory(tx, id, request.status, 'ANNULE', employeeId);

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
}
