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

    if (endDate < startDate) {
      throw new BadRequestException('La date de fin doit être après la date de début');
    }

    const { workingDays: duration } = await this.workingDaysService.calculate(startDate, endDate);
    if (duration === 0) {
      throw new BadRequestException('La période sélectionnée ne contient aucun jour ouvrable');
    }

    const request = await this.prisma.permissionRequest.create({
      data: {
        employeeId,
        startDate,
        endDate,
        duration,
        reason: dto.reason,
      },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
      },
    });

    const employeeName = `${request.employee.user.firstName || ''} ${request.employee.user.lastName || ''}`.trim() || request.employee.user.email;
    this.notificationsService.permissionCreated(request.id, employeeId, employeeName, startDate, endDate);

    return request;
  }

  async findByEmployee(employeeId: number) {
    return this.prisma.permissionRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.permissionRequest.findMany({
      include: {
        employee: {
          include: { user: { select: { id: true, email: true } } },
        },
        reviewedBy: { select: { id: true, email: true } },
        decidedBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending() {
    return this.prisma.permissionRequest.findMany({
      where: { status: 'EN_ATTENTE_RH' },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true } } },
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
          include: { user: { select: { id: true, email: true } } },
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
          include: { user: { select: { id: true, email: true } } },
        },
        reviewedBy: { select: { id: true, email: true } },
        decidedBy: { select: { id: true, email: true } },
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
          include: { user: { select: { id: true, email: true } } },
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

    const updated = await this.prisma.permissionRequest.update({
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
          include: { user: { select: { id: true, email: true } } },
        },
        reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    const rhName = updated.reviewedBy?.email || 'RH';
    this.notificationsService.permissionRhReviewed(id, request.employeeId, rhName);

    return updated;
  }

  async directorDecision(id: number, userId: number, dto: DirectorDecisionDto) {
    const request = await this.prisma.permissionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    if (request.status !== 'AVIS_RH_RENDU') {
      throw new BadRequestException(
        'La demande doit d\'abord être examinée par le RH',
      );
    }

    const updated = await this.prisma.permissionRequest.update({
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
        decidedBy: { select: { id: true, email: true } },
      },
    });

    const directorEmail = updated.decidedBy?.email || 'Direction';
    this.notificationsService.permissionDecided(id, request.employeeId, dto.decision, directorEmail);

    return updated;
  }
}
