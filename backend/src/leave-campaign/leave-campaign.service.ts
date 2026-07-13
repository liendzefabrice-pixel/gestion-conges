import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LeaveBalanceEngineService } from '../leave-balance-engine/leave-balance-engine.service';
import { LeavePlanningEngineService } from '../leave-planning-engine/leave-planning-engine.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { SubmitProposalDto } from './dto/submit-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';

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

    return this.prisma.leaveCampaign.create({
      data: { year: dto.year, label: dto.label },
    });
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

    return this.prisma.leaveCampaign.update({
      where: { id },
      data: { status: 'CLOTUREE' },
    });
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

  private async isEligible(employeeId: number): Promise<boolean> {
    try {
      const result = await this.leaveBalanceEngine.calculateEmployeeBalances(employeeId);
      const annualBalance = result.balances.find(
        (b) => b.leaveTypeName.toLowerCase().includes('annuel') || b.leaveTypeName.toLowerCase().includes('annual'),
      );
      return annualBalance ? annualBalance.available > 0 : false;
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
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Profil employé introuvable');

    const campaign = await this.getCurrentCampaign();
    if (!campaign) throw new BadRequestException('Aucune campagne ouverte actuellement');

    const eligible = await this.isEligible(employee.id);
    if (!eligible) {
      throw new BadRequestException('Vous n\'êtes pas éligible au congé annuel');
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

    this.planningEngine.analyzeProposal(proposal.id).catch((err) => {
      this.logger.error(`Analyse automatique échouée pour la proposition #${proposal.id}: ${err.message}`);
    });

    return proposal;
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
    });
    if (!proposal) throw new NotFoundException('Proposition introuvable');

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

    return updated;
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
}
