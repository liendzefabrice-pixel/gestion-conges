import { Injectable } from '@nestjs/common';
import { DecisionRule, DecisionContext, RuleEvaluation } from '../interfaces/decision-rule.interface';

@Injectable()
export class CampaignValidationRule implements DecisionRule {
  readonly name = 'campaign_validation';
  readonly label = 'Campagne annuelle';
  readonly description = 'Vérifie la participation à la campagne annuelle et les validations existantes';
  readonly weight = 20;

  async evaluate(context: DecisionContext): Promise<RuleEvaluation> {
    const { employeeId, startDate, entityType, prisma } = context;

    if (entityType === 'LEAVE_PROPOSAL') {
      const campaign = await prisma.leaveCampaign.findFirst({
        where: { status: 'OUVERTE' },
        select: { id: true, label: true, year: true },
      });

      if (!campaign) {
        return {
          ruleName: this.name,
          label: this.label,
          status: 'WARN',
          score: 5,
          maxScore: this.weight,
          message: 'Aucune campagne annuelle ouverte',
          details: 'La programmation n\'est pas liée à une campagne active',
        };
      }

      const proposal = await prisma.leaveProposal.findUnique({
        where: { campaignId_employeeId: { campaignId: campaign.id, employeeId } },
      });

      if (proposal && proposal.status === 'ACCEPTEE') {
        return {
          ruleName: this.name,
          label: this.label,
          status: 'PASS',
          score: this.weight,
          maxScore: this.weight,
          message: `Période déjà validée dans la campagne "${campaign.label}"`,
          details: `Campagne ${campaign.year} - Statut : ${proposal.status}`,
        };
      }

      return {
        ruleName: this.name,
        label: this.label,
        status: 'PASS',
        score: this.weight,
        maxScore: this.weight,
        message: `Participant à la campagne "${campaign.label}"`,
        details: `Campagne ${campaign.year} en cours`,
      };
    }

    const planning = await prisma.annualLeavePlanning.findUnique({
      where: { employeeId_year: { employeeId, year: startDate.getFullYear() } },
      include: { leaveRequests: { where: { status: 'APPROUVE' } } },
    });

    if (!planning) {
      return {
        ruleName: this.name,
        label: this.label,
        status: 'WARN',
        score: 5,
        maxScore: this.weight,
        message: 'Aucune planification annuelle trouvée',
        details: 'L\'employé n\'a pas de planification pour cette année',
      };
    }

    return {
      ruleName: this.name,
      label: this.label,
      status: 'PASS',
      score: this.weight,
      maxScore: this.weight,
      message: 'Planification annuelle existante',
      details: `${planning.leaveRequests.length} congé(s) déjà approuvé(s) cette année`,
    };
  }
}
