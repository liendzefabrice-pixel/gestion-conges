import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkingDaysService } from '../working-days/working-days.service';
import { CreatePermissionRequestDto } from './dto/create-permission-request.dto';
import { HrReviewDto } from './dto/hr-review.dto';
import { DirectorDecisionDto } from './dto/director-decision.dto';

@Injectable()
export class PermissionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private workingDaysService: WorkingDaysService,
  ) {}

  private async recordHistory(
    tx: any,
    permissionRequestId: number,
    previousStatus: string | null,
    newStatus: string,
    userId: number,
    comment?: string,
  ) {
    await tx.permissionRequestHistory.create({
      data: {
        permissionRequestId,
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
        entityType: 'PERMISSION_REQUEST',
        entityId,
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined,
        userId,
      },
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

  async create(employeeId: number, dto: CreatePermissionRequestDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('La date de début ne peut pas être dans le passé');
    }

    if (endDate < startDate) {
      throw new BadRequestException('La date de fin doit être après la date de début');
    }

    const existingOverlap = await this.prisma.permissionRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['APPROUVE', 'EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION', 'AVIS_RH_RENDU'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (existingOverlap) {
      throw new BadRequestException('Vous avez déjà une demande de permission sur cette période');
    }

    const { workingDays: duration } = await this.workingDaysService.calculate(startDate, endDate);
    if (duration === 0) {
      throw new BadRequestException('La période sélectionnée ne contient aucun jour ouvrable');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.permissionRequest.create({
        data: {
          employeeId,
          startDate,
          endDate,
          duration,
          reason: dto.reason,
          permissionType: dto.permissionType || 'PERMISSION',
        },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, department: { select: { name: true } } },
          },
        },
      });

      await this.recordHistory(tx, request.id, null, 'EN_ATTENTE_RH', request.employee.user.id);
      await this.recordAuditLog(tx, 'PERMISSION_REQUEST_CREATED', request.id, request.employee.user.id, null, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration,
        permissionType: dto.permissionType || 'PERMISSION',
      });

      const year = startDate.getFullYear();
      const permissionBalance = await tx.permissionBalance.findUnique({
        where: { employeeId_year: { employeeId, year } },
      });

      if (permissionBalance) {
        await tx.permissionBalance.update({
          where: { id: permissionBalance.id },
          data: { pendingDays: permissionBalance.pendingDays + duration },
        });
      }

      const employeeName = `${request.employee.user.firstName || ''} ${request.employee.user.lastName || ''}`.trim() || request.employee.user.email;
      this.notificationsService.permissionCreated(request.id, employeeId, employeeName, startDate, endDate);

      return request;
    });
  }

  async findByEmployee(employeeId: number) {
    return this.prisma.permissionRequest.findMany({
      where: { employeeId },
      include: { histories: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.permissionRequest.findMany({
      include: {
        employee: {
          include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } },
        },
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

  async findPending() {
    return this.prisma.permissionRequest.findMany({
      where: { status: 'EN_ATTENTE_RH' },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findHrReviewed() {
    return this.prisma.permissionRequest.findMany({
      where: { status: 'AVIS_RH_RENDU' },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } },
        },
        reviewedBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: number) {
    const request = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } },
        },
        reviewedBy: { select: { id: true, email: true } },
        decidedBy: { select: { id: true, email: true } },
        histories: {
          include: { user: { select: { id: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Demande de permission introuvable');
    }

    return request;
  }

  async hrReview(id: number, userId: number, dto: HrReviewDto) {
    const request = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    if (request.status !== 'EN_ATTENTE_RH') {
      throw new BadRequestException(
        'Seules les demandes en attente peuvent être examinées',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.permissionRequest.update({
        where: { id },
        data: {
          status: 'AVIS_RH_RENDU',
          hrComment: dto.hrComment,
          hrOpinion: dto.hrOpinion,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } },
          },
          reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      await this.recordHistory(tx, id, 'EN_ATTENTE_RH', 'AVIS_RH_RENDU', userId, dto.hrComment || undefined);
      await this.recordAuditLog(tx, 'PERMISSION_REQUEST_REVIEWED', id, userId,
        { status: 'EN_ATTENTE_RH' },
        { status: 'AVIS_RH_RENDU', hrOpinion: dto.hrOpinion },
      );

      const rhName = updated.reviewedBy?.email || 'RH';
      this.notificationsService.permissionRhReviewed(id, request.employeeId, rhName);

      return updated;
    });
  }

  async transmitToDirector(id: number, userId: number) {
    const request = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } },
        },
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
      const updated = await tx.permissionRequest.update({
        where: { id },
        data: {
          status: 'EN_ATTENTE_DIRECTION',
          transmittedAt: new Date(),
        },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } },
          },
          reviewedBy: { select: { id: true, email: true } },
        },
      });

      await this.recordHistory(tx, id, 'AVIS_RH_RENDU', 'EN_ATTENTE_DIRECTION', userId);
      await this.recordAuditLog(tx, 'PERMISSION_REQUEST_TRANSMITTED', id, userId,
        { status: 'AVIS_RH_RENDU' },
        { status: 'EN_ATTENTE_DIRECTION' },
      );

      this.notificationsService.permissionTransmittedToDirector(id, request.employeeId);

      return updated;
    });
  }

  async directorDecision(id: number, userId: number, dto: DirectorDecisionDto) {
    const request = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } },
        },
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

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.permissionRequest.update({
        where: { id },
        data: {
          status: dto.decision,
          directorComment: dto.directorComment,
          decidedById: userId,
          decidedAt: new Date(),
        },
        include: {
          employee: {
            include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } },
          },
          decidedBy: { select: { id: true, email: true } },
        },
      });

      await this.recordHistory(tx, id, request.status, dto.decision, userId, dto.directorComment);
      await this.recordAuditLog(tx,
        dto.decision === 'APPROUVE' ? 'PERMISSION_REQUEST_APPROVED' : 'PERMISSION_REQUEST_REJECTED',
        id, userId,
        { status: request.status },
        { status: dto.decision, comment: dto.directorComment },
      );

      const year = request.startDate.getFullYear();
      const permissionBalance = await tx.permissionBalance.findUnique({
        where: { employeeId_year: { employeeId: request.employeeId, year } },
      });

      if (permissionBalance) {
        const newPendingDays = permissionBalance.pendingDays - request.duration;

        if (dto.decision === 'APPROUVE') {
          await tx.permissionBalance.update({
            where: { id: permissionBalance.id },
            data: {
              pendingDays: Math.max(0, newPendingDays),
              usedDays: permissionBalance.usedDays + request.duration,
            },
          });
        } else {
          await tx.permissionBalance.update({
            where: { id: permissionBalance.id },
            data: { pendingDays: Math.max(0, newPendingDays) },
          });
        }
      }

      const directorEmail = updated.decidedBy?.email || 'Direction';
      this.notificationsService.permissionDecided(id, request.employeeId, dto.decision, directorEmail);

      return updated;
    });
  }

  async getPermissionBalances(employeeId: number) {
    return this.prisma.permissionBalance.findMany({
      where: { employeeId },
      orderBy: { year: 'desc' },
    });
  }

  async initPermissionBalance(employeeId: number, year: number) {
    const admin = await this.prisma.user.findFirst({
      where: { role: { name: 'ADMIN' } },
      orderBy: { id: 'asc' },
    });

    await this.prisma.permissionBalance.upsert({
      where: { employeeId_year: { employeeId, year } },
      update: {},
      create: {
        employeeId,
        year,
        totalDays: 10,
      },
    });
  }
}
