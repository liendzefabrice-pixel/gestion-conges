import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LeaveBalanceEngineService } from '../leave-balance-engine/leave-balance-engine.service';
import { LeavePlanningEngineService } from '../leave-planning-engine/leave-planning-engine.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { SubmitProposalDto } from './dto/submit-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { addWorkingDays } from '../common/working-days';

@Injectable()
export class LeaveCampaignService {
  private readonly logger = new Logger(LeaveCampaignService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private leaveBalanceEngine: LeaveBalanceEngineService,
    private planningEngine: LeavePlanningEngineService,
  ) {}

  async create(dto: CreateCampaignDto) {
    const existing = await this.prisma.leaveCampaign.findUnique({
      where: { year: dto.year },
    });
    if (existing) {
      throw new ConflictException('Une campagne existe déjà pour cette année');
    }

    if (dto.startDate && dto.endDate && new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin');
    }

    const campaign = await this.prisma.leaveCampaign.create({
      data: {
        year: dto.year,
        label: dto.label,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });

    await this.writeAuditLog('CAMPAGNE_CREEE', 'LeaveCampaign', campaign.id, null, campaign, 1);
    return campaign;
  }

  async findAll() {
    return this.prisma.leaveCampaign.findMany({
      orderBy: { year: 'desc' },
      include: {
        _count: { select: { proposals: true } },
      },
    });
  }

  async findOne(id: number) {
    const campaign = await this.prisma.leaveCampaign.findUnique({
      where: { id },
      include: {
        _count: { select: { proposals: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campagne introuvable');
    return campaign;
  }

  async update(id: number, dto: UpdateCampaignDto) {
    const campaign = await this.findOne(id);

    if (dto.startDate && dto.endDate && new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin');
    }

    const oldValue = { label: campaign.label, description: campaign.description, startDate: campaign.startDate, endDate: campaign.endDate };

    const updated = await this.prisma.leaveCampaign.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      },
    });

    await this.writeAuditLog('CAMPAGNE_MODIFIEE', 'LeaveCampaign', id, oldValue, updated, 1);
    return updated;
  }

  async openCampaign(id: number) {
    const campaign = await this.findOne(id);
    if (campaign.status !== 'BROUILLON') {
      throw new BadRequestException('Seules les campagnes en brouillon peuvent être ouvertes');
    }

    const openCampaign = await this.prisma.leaveCampaign.findFirst({
      where: { status: 'OUVERTE' },
    });
    if (openCampaign) {
      throw new ConflictException('Une campagne est déjà ouverte. Clôturez-la avant d\'en ouvrir une nouvelle.');
    }

    const updated = await this.prisma.leaveCampaign.update({
      where: { id },
      data: { status: 'OUVERTE' },
    });

    await this.writeAuditLog('CAMPAGNE_OUVERTE', 'LeaveCampaign', id, { status: campaign.status }, { status: 'OUVERTE' }, 1);

    this.notifyEligibleEmployees(id).catch((err) => {
      this.logger.error(`Échec envoi notifications campagne #${id}: ${err.message}`);
    });

    return updated;
  }

  async closeCampaign(id: number) {
    const campaign = await this.findOne(id);
    if (campaign.status !== 'OUVERTE') {
      throw new BadRequestException('Seules les campagnes ouvertes peuvent être clôturées');
    }

    const updated = await this.prisma.leaveCampaign.update({
      where: { id },
      data: { status: 'CLOTUREE' },
    });

    await this.writeAuditLog('CAMPAGNE_CLOTUREE', 'LeaveCampaign', id, { status: campaign.status }, { status: 'CLOTUREE' }, 1);

    this.notifyClosureToParticipants(id).catch((err) => {
      this.logger.error(`Échec notification clôture campagne #${id}: ${err.message}`);
    });

    return updated;
  }

  async archiveCampaign(id: number) {
    const campaign = await this.findOne(id);
    if (campaign.status !== 'CLOTUREE') {
      throw new BadRequestException('Seules les campagnes clôturées peuvent être archivées');
    }

    const updated = await this.prisma.leaveCampaign.update({
      where: { id },
      data: { status: 'ARCHIVEE' },
    });

    await this.writeAuditLog('CAMPAGNE_ARCHIVEE', 'LeaveCampaign', id, { status: campaign.status }, { status: 'ARCHIVEE' }, 1);

    return updated;
  }

  async getCurrentCampaign() {
    return this.prisma.leaveCampaign.findFirst({
      where: { status: 'OUVERTE' },
      include: {
        _count: { select: { proposals: true } },
      },
    });
  }

  private async notifyEligibleEmployees(campaignId: number) {
    const campaign = await this.prisma.leaveCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) return;

    const employees = await this.prisma.employee.findMany({
      where: { user: { isActive: true, role: { name: { not: 'ADMIN' } } } },
      include: { user: true },
    });

    const eligibleUserIds: number[] = [];
    for (const employee of employees) {
      const eligible = await this.isEligible(employee.id);
      if (eligible) {
        eligibleUserIds.push(employee.userId);
      }
    }

    if (eligibleUserIds.length > 0) {
      await this.notificationsService.notifyCampaignOpened(eligibleUserIds, campaign.label);
    }

    this.logger.log(`Campagne #${campaignId} : ${eligibleUserIds.length} employés éligibles notifiés`);
  }

  private async notifyClosureToParticipants(campaignId: number) {
    const campaign = await this.prisma.leaveCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) return;

    const proposals = await this.prisma.leaveProposal.findMany({
      where: { campaignId },
      include: { employee: { include: { user: true } } },
    });

    const userIds = proposals.map((p) => p.employee.userId).filter(Boolean);
    if (userIds.length > 0) {
      await this.notificationsService.createNotification(
        userIds,
        'Campagne clôturée',
        `La campagne "${campaign.label}" est désormais clôturée. Merci de votre participation.`,
        'INFO',
      );
    }
  }

  private async notifyHrOfProposal(employee: any, campaignLabel: string) {
    const hrUsers = await this.prisma.user.findMany({
      where: { role: { name: 'HR' }, isActive: true },
      select: { id: true },
    });
    if (hrUsers.length > 0) {
      const name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || `#${employee.id}`;
      await this.notificationsService.notifyProposalSubmitted(
        hrUsers.map((u) => u.id),
        name,
        campaignLabel,
      );
    }
  }

  private async isEligible(employeeId: number): Promise<boolean> {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });
      if (!employee) return false;

      const now = new Date();
      const hireDate = new Date(employee.hireDate);
      const diffMonths = (now.getFullYear() - hireDate.getFullYear()) * 12 + now.getMonth() - hireDate.getMonth();
      return diffMonths >= 12;
    } catch {
      return false;
    }
  }

  async getMyProposal(userId: number) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Profil employé introuvable');

    const campaign = await this.getCurrentCampaign();
    if (!campaign) return { campaign: null, proposal: null, balance: null };

    const proposal = await this.prisma.leaveProposal.findUnique({
      where: { campaignId_employeeId: { campaignId: campaign.id, employeeId: employee.id } },
    });

    let annualBalance: { available: number; acquired: number; consumed: number; reserved: number } | null = null;
    try {
      const result = await this.leaveBalanceEngine.calculateEmployeeBalances(employee.id);
      const bal = result.balances.find(
        (b) => b.leaveTypeName.toLowerCase().includes('annuel') || b.leaveTypeName.toLowerCase().includes('annual'),
      );
      if (bal) {
        annualBalance = bal;
      }
    } catch {}

    return { campaign, proposal, annualBalance };
  }

  async submitProposal(userId: number, dto: SubmitProposalDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!employee) throw new NotFoundException('Profil employé introuvable');

    const campaign = await this.getCurrentCampaign();
    if (!campaign) throw new BadRequestException('Aucune campagne ouverte actuellement');

    const eligible = await this.isEligible(employee.id);
    if (!eligible) {
      throw new BadRequestException('Vous n\'êtes pas éligible au congé annuel (ancienneté minimum requise : 1 an)');
    }

    const existing = await this.prisma.leaveProposal.findUnique({
      where: { campaignId_employeeId: { campaignId: campaign.id, employeeId: employee.id } },
    });
    if (existing) {
      throw new ConflictException('Vous avez déjà soumis une proposition pour cette campagne');
    }

    let duration = dto.duration;
    if (!duration) {
      try {
        const result = await this.leaveBalanceEngine.calculateEmployeeBalances(employee.id);
        const annualBalance = result.balances.find(
          (b) => b.leaveTypeName.toLowerCase().includes('annuel') || b.leaveTypeName.toLowerCase().includes('annual'),
        );
        duration = annualBalance?.available ?? 0;
      } catch {
        duration = 0;
      }
    }

    const proposal = await this.prisma.leaveProposal.create({
      data: {
        desiredStartDate: new Date(dto.desiredStartDate),
        duration,
        comment: dto.comment,
        campaignId: campaign.id,
        employeeId: employee.id,
      },
      include: { campaign: true },
    });

    await this.writeAuditLog('PROPOSITION_SOUMISE', 'LeaveProposal', proposal.id, null, {
      desiredStartDate: dto.desiredStartDate, duration, campaignId: campaign.id,
    }, userId);

    this.planningEngine.analyzeProposal(proposal.id).catch((err) => {
      this.logger.error(`Analyse automatique échouée pour la proposition #${proposal.id}: ${err.message}`);
    });

    this.notifyHrOfProposal(employee, campaign.label).catch((err) => {
      this.logger.error(`Échec notification RH pour la proposition #${proposal.id}: ${err.message}`);
    });

    return proposal;
  }

  async updateMyProposal(userId: number, dto: SubmitProposalDto) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Profil employé introuvable');

    const campaign = await this.getCurrentCampaign();
    if (!campaign) throw new BadRequestException('Aucune campagne ouverte actuellement');

    const existing = await this.prisma.leaveProposal.findUnique({
      where: { campaignId_employeeId: { campaignId: campaign.id, employeeId: employee.id } },
    });
    if (!existing) {
      throw new NotFoundException('Aucune proposition trouvée pour cette campagne');
    }
    if (existing.status !== 'RECUE' && existing.status !== 'EN_ANALYSE') {
      throw new BadRequestException('Impossible de modifier une proposition déjà traitée');
    }

    const oldValue = {
      desiredStartDate: existing.desiredStartDate,
      duration: existing.duration,
      comment: existing.comment,
    };

    const updated = await this.prisma.leaveProposal.update({
      where: { id: existing.id },
      data: {
        desiredStartDate: new Date(dto.desiredStartDate),
        duration: dto.duration ?? existing.duration,
        comment: dto.comment,
        status: 'RECUE',
        analysisStatus: 'PENDING',
        analysisDetails: Prisma.DbNull,
        suggestedStartDate: null,
        suggestedEndDate: null,
      },
    });

    await this.writeAuditLog('PROPOSITION_MODIFIEE', 'LeaveProposal', existing.id, oldValue, {
      desiredStartDate: dto.desiredStartDate, duration: dto.duration ?? existing.duration,
    }, userId);

    this.planningEngine.analyzeProposal(updated.id).catch((err) => {
      this.logger.error(`Ré-analyse échouée pour la proposition #${updated.id}: ${err.message}`);
    });

    const campaignData = await this.prisma.leaveCampaign.findUnique({ where: { id: campaign.id } });
    if (campaignData) {
      await this.notificationsService.createNotification(
        [userId],
        'Proposition modifiée',
        `Votre proposition pour "${campaignData.label}" a été mise à jour et sera ré-analysée.`,
        'INFO',
      );
    }

    return updated;
  }

  async getProposals(campaignId: number) {
    const campaign = await this.findOne(campaignId);

    const proposals = await this.prisma.leaveProposal.findMany({
      where: { campaignId },
      include: {
        employee: {
          include: {
            user: { select: { email: true, firstName: true, lastName: true, isActive: true } },
            department: { select: { name: true } },
          },
        },
        analysisLogs: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const enriched = await Promise.all(
      proposals.map(async (p) => {
        let annualBalance: number | null = null;
        try {
          const result = await this.leaveBalanceEngine.calculateEmployeeBalances(p.employeeId);
          const balance = result.balances.find(
            (b) => b.leaveTypeName.toLowerCase().includes('annuel') || b.leaveTypeName.toLowerCase().includes('annual'),
          );
          if (balance) annualBalance = balance.available;
        } catch {}

        const hireDate = p.employee.hireDate;
        const now = new Date();
        const diffMonths = (now.getFullYear() - hireDate.getFullYear()) * 12 + now.getMonth() - hireDate.getMonth();
        const years = Math.floor(diffMonths / 12);

        return {
          ...p,
          annualBalance,
          seniority: `${years} an${years > 1 ? 's' : ''}`,
        };
      }),
    );

    return {
      campaign,
      totalEmployees: enriched.length,
      proposals: enriched,
    };
  }

  async updateProposalStatus(proposalId: number, dto: UpdateProposalStatusDto) {
    const proposal = await this.prisma.leaveProposal.findUnique({
      where: { id: proposalId },
      include: { employee: { include: { user: true } } },
    });
    if (!proposal) throw new NotFoundException('Proposition introuvable');

    const oldStatus = proposal.status;
    const updateData: any = { status: dto.status as any };

    if (dto.newStartDate) updateData.desiredStartDate = new Date(dto.newStartDate);
    if (dto.newEndDate) updateData.suggestedEndDate = new Date(dto.newEndDate);

    const updated = await this.prisma.leaveProposal.update({
      where: { id: proposalId },
      data: updateData,
      include: {
        employee: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
            department: { select: { name: true } },
          },
        },
        campaign: true,
        analysisLogs: { orderBy: { createdAt: 'asc' } },
      },
    });

    const actionLabels: Record<string, string> = {
      ACCEPTEE: 'VALIDATION_RH',
      REFUSEE: 'REFUS_RH',
      REPROGRAMMEE: 'REPROGRAMMATION_RH',
    };
    const action = actionLabels[dto.status] || 'STATUT_MAJ';
    const actionDetail = dto.newStartDate
      ? `Période modifiée : ${new Date(dto.newStartDate).toLocaleDateString('fr-FR')} → ${dto.newEndDate ? new Date(dto.newEndDate).toLocaleDateString('fr-FR') : ''}`
      : `Statut mis à jour : ${dto.status}`;

    await this.prisma.proposalAnalysisLog.create({
      data: { proposalId, action, details: actionDetail },
    });

    await this.writeAuditLog('PROPOSITION_STATUT_MAJ', 'LeaveProposal', proposalId,
      { status: oldStatus }, { status: dto.status, ...(dto.newStartDate && { newStartDate: dto.newStartDate }) }, 1);

    if (dto.status === 'ACCEPTEE' && proposal.employee?.user) {
      const campaign = await this.prisma.leaveCampaign.findUnique({ where: { id: proposal.campaignId } });
      const label = campaign?.label || 'Campagne';
      await this.notificationsService.createNotification(
        [proposal.employee.userId],
        'Proposition acceptée',
        `Votre proposition pour "${label}" a été acceptée.`,
        'INFO',
      );
    }

    if (dto.status === 'ACCEPTEE' && dto.newStartDate) {
      await this.createLeaveRequestFromProposal(proposal).catch((err) => {
        this.logger.error(`Échec création congé pour la proposition #${proposalId}: ${err.message}`);
      });
    }

    return updated;
  }

  private async createLeaveRequestFromProposal(proposal: any) {
    const startDate = new Date(proposal.desiredStartDate);
    const endDate = addWorkingDays(startDate, (proposal.duration || 1) - 1);

    const annualLeaveType = await this.prisma.leaveType.findFirst({
      where: { name: { contains: 'annuel', mode: 'insensitive' } },
    });
    if (!annualLeaveType) {
      this.logger.warn('Type de congé annuel introuvable, création de congé ignorée');
      return;
    }

    const existingLeave = await this.prisma.leaveRequest.findFirst({
      where: { employeeId: proposal.employeeId, annualLeavePlanningId: null, leaveTypeId: annualLeaveType.id, status: 'APPROUVE' },
    });

    if (existingLeave) return;

    const leave = await this.prisma.leaveRequest.create({
      data: {
        startDate,
        endDate,
        duration: proposal.duration,
        reason: `Congé annuel programmé via campagne "${proposal.campaign?.label || ''}"`,
        status: 'APPROUVE',
        employeeId: proposal.employeeId,
        leaveTypeId: annualLeaveType.id,
      },
    });

    this.logger.log(`Congé #${leave.id} créé automatiquement pour la proposition #${proposal.id}`);
  }

  async getEligibleCount(campaignId: number): Promise<number> {
    const employees = await this.prisma.employee.findMany({
      where: { user: { isActive: true, role: { name: { not: 'ADMIN' } } } },
    });

    let count = 0;
    for (const emp of employees) {
      if (await this.isEligible(emp.id)) count++;
    }
    return count;
  }

  async remove(id: number) {
    const campaign = await this.findOne(id);
    const proposalsCount = await this.prisma.leaveProposal.count({ where: { campaignId: id } });
    await this.prisma.leaveProposal.deleteMany({ where: { campaignId: id } });
    await this.prisma.leaveCampaign.delete({ where: { id } });
    return { message: `Campagne "${campaign.label}" supprimée avec ${proposalsCount} proposition(s)` };
  }

  private async writeAuditLog(action: string, entityType: string, entityId: number, oldValue: any, newValue: any, userId: number) {
    try {
      await this.prisma.auditLog.create({
        data: { action, entityType, entityId, oldValue: oldValue ?? undefined, newValue: newValue ?? undefined, userId },
      });
    } catch (err) {
      this.logger.error(`Échec écriture journal d'audit: ${err.message}`);
    }
  }
}
