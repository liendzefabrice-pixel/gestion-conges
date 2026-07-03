import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { calculateWorkingDays } from '../common/working-days';
import { CreatePermissionRequestDto } from './dto/create-permission-request.dto';
import { HrReviewDto } from './dto/hr-review.dto';
import { DirectorDecisionDto } from './dto/director-decision.dto';

@Injectable()
export class PermissionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private calculateDuration(startDate: Date, endDate: Date): number {
    return calculateWorkingDays(startDate, endDate);
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

    if (endDate < startDate) {
      throw new BadRequestException('La date de fin doit être après la date de début');
    }

    const duration = this.calculateDuration(startDate, endDate);

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
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });

    this.notificationsService.notifyHR(
      'Nouvelle demande de permission',
      `${request.employee.user.email} a soumis une demande de permission`,
      'PERMISSION_CREATED',
    );

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
      where: { status: 'PENDING' },
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
      where: { status: 'RH_REVIEWED' },
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

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        'Seules les demandes en attente peuvent être examinées',
      );
    }

    const updated = await this.prisma.permissionRequest.update({
      where: { id },
      data: {
        status: 'RH_REVIEWED',
        hrComment: dto.hrComment,
        hrOpinion: dto.hrOpinion,
        reviewedById: userId,
        reviewedAt: new Date(),
      },
      include: {
        employee: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });

    this.notificationsService.notifyEmployee(
      request.employeeId,
      'Demande de permission examinée',
      'Votre demande de permission a été examinée par le RH. En attente de décision de la direction.',
      'PERMISSION_RH_REVIEWED',
    );

    this.notificationsService.notifyDirector(
      'Avis RH donné',
      `Le RH a examiné la demande de permission de ${request.employee.user.email}. Décision requise.`,
      'PERMISSION_RH_REVIEWED',
    );

    return updated;
  }

  async directorDecision(id: number, userId: number, dto: DirectorDecisionDto) {
    const request = await this.prisma.permissionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }

    if (request.status !== 'RH_REVIEWED') {
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
      },
    });

    if (dto.decision === 'APPROVED') {
      this.notificationsService.notifyEmployee(
        request.employeeId,
        'Demande de permission approuvée',
        'Votre demande de permission a été approuvée par la direction.',
        'PERMISSION_DECIDED',
      );
    } else {
      this.notificationsService.notifyEmployee(
        request.employeeId,
        'Demande de permission refusée',
        'Votre demande de permission a été refusée par la direction.',
        'PERMISSION_DECIDED',
      );
    }

    return updated;
  }
}
