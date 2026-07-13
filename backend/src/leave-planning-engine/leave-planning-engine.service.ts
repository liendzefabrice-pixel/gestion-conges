import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanningRule, RuleContext, RuleResult } from './interfaces/planning-rule.interface';
import { DeptConflictRule } from './rules/dept-conflict.rule';

@Injectable()
export class LeavePlanningEngineService {
  private readonly logger = new Logger(LeavePlanningEngineService.name);
  private rules: PlanningRule[] = [];

  constructor(
    private prisma: PrismaService,
    private deptConflictRule: DeptConflictRule,
  ) {
    this.rules = [this.deptConflictRule];
  }

  registerRule(rule: PlanningRule) {
    this.rules.push(rule);
  }

  async analyzeProposal(proposalId: number): Promise<{
    status: string;
    results: RuleResult[];
  }> {
    const proposal = await this.prisma.leaveProposal.findUnique({
      where: { id: proposalId },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    if (!proposal) throw new Error('Proposition introuvable');

    const allProposals = await this.prisma.leaveProposal.findMany({
      where: { campaignId: proposal.campaignId },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    const context: RuleContext = {
      proposal: proposal as any,
      allProposals: allProposals as any,
      prisma: this.prisma,
    };

    const results: RuleResult[] = [];
    for (const rule of this.rules) {
      try {
        const result = await rule.analyze(context);
        results.push(result);
      } catch (err) {
        this.logger.error(`Rule ${rule.constructor.name} failed: ${err.message}`);
        results.push({
          ruleName: rule.constructor.name,
          status: 'COMPATIBLE',
          severity: 'INFO',
          message: `Erreur d'analyse : ${err.message}`,
        });
      }
    }

    const overallStatus = this.computeOverallStatus(results);

    const analysisDetails = {
      results,
      computedAt: new Date().toISOString(),
    };

    const suggestion = results.find((r) => r.suggestedStartDate);

    await this.prisma.leaveProposal.update({
      where: { id: proposalId },
      data: {
        analysisStatus: overallStatus,
        analysisDetails: analysisDetails as any,
        suggestedStartDate: suggestion?.suggestedStartDate ?? null,
        suggestedEndDate: suggestion?.suggestedEndDate ?? null,
      },
    });

    await this.createLog(proposalId, 'ANALYSE_EFFECTUEE', `Analyse terminée : ${overallStatus}`);

    for (const r of results) {
      if (r.status === 'CONFLIT_DEPARTEMENT') {
        await this.createLog(proposalId, 'CONFLIT_DETECTE', r.message);
        if (r.suggestedStartDate) {
          const endStr = r.suggestedEndDate?.toLocaleDateString('fr-FR') ?? '';
          await this.createLog(
            proposalId,
            'NOUVELLE_PERIODE_CALCULEE',
            `Période suggérée : ${r.suggestedStartDate.toLocaleDateString('fr-FR')} → ${endStr}`,
          );
        }
      }
    }

    return { status: overallStatus, results };
  }

  private computeOverallStatus(results: RuleResult[]): string {
    const blockers = results.filter((r) => r.status === 'CONFLIT_DEPARTEMENT');
    if (blockers.length > 0) {
      const hasSuggestion = blockers.some((b) => b.suggestedStartDate);
      return hasSuggestion ? 'PROPOSITION_AUTOMATIQUE' : 'CONFLIT_DEPARTEMENT';
    }
    return 'COMPATIBLE';
  }

  private async createLog(proposalId: number, action: string, details: string) {
    await this.prisma.proposalAnalysisLog.create({
      data: { proposalId, action, details },
    });
  }
}
