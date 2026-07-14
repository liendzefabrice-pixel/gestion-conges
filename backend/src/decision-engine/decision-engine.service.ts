import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DecisionRule, DecisionContext, RuleEvaluation } from './interfaces/decision-rule.interface';
import { DepartmentConflictRule } from './rules/department-conflict.rule';
import { InternalEventConflictRule } from './rules/internal-event-conflict.rule';
import { BalanceSufficiencyRule } from './rules/balance-sufficiency.rule';
import { CampaignValidationRule } from './rules/campaign-validation.rule';
import { OperationalRiskRule } from './rules/operational-risk.rule';
import { ReplacementAvailabilityRule } from './rules/replacement-availability.rule';

@Injectable()
export class DecisionEngineService {
  private readonly logger = new Logger(DecisionEngineService.name);
  private rules: DecisionRule[] = [];

  constructor(
    private prisma: PrismaService,
    private deptConflictRule: DepartmentConflictRule,
    private eventConflictRule: InternalEventConflictRule,
    private balanceRule: BalanceSufficiencyRule,
    private campaignRule: CampaignValidationRule,
    private operationalRiskRule: OperationalRiskRule,
    private replacementRule: ReplacementAvailabilityRule,
  ) {
    this.rules = [this.deptConflictRule, this.eventConflictRule, this.balanceRule, this.campaignRule, this.operationalRiskRule, this.replacementRule];
  }

  registerRule(rule: DecisionRule) {
    this.rules.push(rule);
  }

  async analyze(entityType: 'LEAVE_REQUEST' | 'LEAVE_PROPOSAL', entityId: number, userId: number) {
    const context = await this.buildContext(entityType, entityId);
    const evaluations: RuleEvaluation[] = [];

    for (const rule of this.rules) {
      try {
        const result = await rule.evaluate(context);
        evaluations.push(result);
      } catch (err) {
        this.logger.error(`Rule ${rule.name} failed: ${err.message}`);
        evaluations.push({
          ruleName: rule.name,
          label: rule.label,
          status: 'FAIL',
          score: 0,
          maxScore: rule.weight,
          message: `Erreur d'analyse : ${err.message}`,
        });
      }
    }

    const totalScore = evaluations.reduce((sum, r) => sum + r.score, 0);
    const maxScore = evaluations.reduce((sum, r) => sum + r.maxScore, 0);
    const score = Math.round((totalScore / maxScore) * 100);

    const suggestion = this.computeSuggestion(evaluations, context);

    const summary = this.buildSummary(evaluations);

    const analysis = await this.prisma.decisionAnalysis.create({
      data: {
        entityType,
        entityId,
        score,
        maxScore: 100,
        rules: evaluations as any,
        summary,
        suggestedStartDate: suggestion?.startDate || null,
        suggestedEndDate: suggestion?.endDate || null,
        suggestionNote: suggestion?.note || null,
        createdById: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'DECISION_ANALYSIS_CREATED',
        entityType: `DECISION_ANALYSIS`,
        entityId: analysis.id,
        newValue: { score, rules: evaluations, summary, suggestion } as any,
        userId,
      },
    });

    return this.formatResponse(analysis, evaluations, suggestion);
  }

  async getAnalysis(analysisId: number) {
    return this.prisma.decisionAnalysis.findUnique({ where: { id: analysisId } });
  }

  async getAnalysesForEntity(entityType: string, entityId: number) {
    return this.prisma.decisionAnalysis.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, email: true } } },
    });
  }

  async recordDecision(analysisId: number, decision: string, comment: string | undefined, userId: number) {
    const analysis = await this.prisma.decisionAnalysis.update({
      where: { id: analysisId },
      data: { decision, decisionComment: comment, decidedById: userId, decidedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'DECISION_ANALYSIS_DECIDED',
        entityType: 'DECISION_ANALYSIS',
        entityId: analysisId,
        oldValue: { decision: null } as any,
        newValue: { decision, comment } as any,
        userId,
      },
    });

    return analysis;
  }

  private async buildContext(entityType: 'LEAVE_REQUEST' | 'LEAVE_PROPOSAL', entityId: number): Promise<DecisionContext> {
    if (entityType === 'LEAVE_REQUEST') {
      const request = await this.prisma.leaveRequest.findUnique({
        where: { id: entityId },
        include: { employee: true },
      });
      if (!request) throw new Error('Demande de congé introuvable');
      return {
        entityType,
        entityId,
        employeeId: request.employeeId,
        departmentId: request.employee.departmentId,
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
        duration: request.duration,
        leaveTypeId: request.leaveTypeId,
        prisma: this.prisma,
      };
    }

    const proposal = await this.prisma.leaveProposal.findUnique({
      where: { id: entityId },
      include: { employee: true },
    });
    if (!proposal) throw new Error('Proposition introuvable');

    const endDate = new Date(proposal.desiredStartDate);
    endDate.setDate(endDate.getDate() + (proposal.duration || 1) - 1);

    return {
      entityType,
      entityId,
      employeeId: proposal.employeeId,
      departmentId: proposal.employee.departmentId,
      startDate: new Date(proposal.desiredStartDate),
      endDate,
      duration: proposal.duration || 1,
      prisma: this.prisma,
    };
  }

  private computeSuggestion(evaluations: RuleEvaluation[], context: DecisionContext): { startDate?: Date; endDate?: Date; note?: string } | null {
    const warnings = evaluations.filter((r) => r.status === 'WARN' || r.status === 'FAIL');
    if (warnings.length === 0) return null;

    return {
      startDate: context.startDate,
      endDate: context.endDate,
      note: 'La période actuelle présente des contraintes. Veuillez examiner les détails ci-dessous.',
    };
  }

  private buildSummary(evaluations: RuleEvaluation[]): string {
    const pass = evaluations.filter((r) => r.status === 'PASS').length;
    const warn = evaluations.filter((r) => r.status === 'WARN').length;
    const fail = evaluations.filter((r) => r.status === 'FAIL').length;
    return `${pass} règle(s) validée(s), ${warn} avertissement(s), ${fail} blocage(s)`;
  }

  private formatResponse(analysis: any, evaluations: RuleEvaluation[], suggestion: any) {
    return {
      id: analysis.id,
      score: analysis.score,
      maxScore: analysis.maxScore,
      summary: analysis.summary,
      rules: evaluations.map((r) => ({
        name: r.ruleName,
        label: r.label,
        status: r.status,
        message: r.message,
        details: r.details,
        score: r.score,
        maxScore: r.maxScore,
      })),
      suggestion: suggestion
        ? { startDate: suggestion.startDate, endDate: suggestion.endDate, note: suggestion.note }
        : null,
      decision: analysis.decision,
      decisionComment: analysis.decisionComment,
      createdAt: analysis.createdAt,
    };
  }
}
