import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionRule, DecisionContext, RuleEvaluation } from '../interfaces/decision-rule.interface';

@Injectable()
export class InternalEventConflictRule implements DecisionRule {
  readonly name = 'internal_event_conflict';
  readonly label = 'Conflit avec événement interne';
  readonly description = 'Vérifie si la période chevauche un événement interne (séminaire, audit, etc.)';
  readonly weight = 25;

  constructor(private prisma: PrismaService) {}

  async evaluate(context: DecisionContext): Promise<RuleEvaluation> {
    const { departmentId, startDate, endDate } = context;

    const events = await this.prisma.internalEvent.findMany({
      where: {
        status: 'ACTIF',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        OR: [
          { allCompany: true },
          { departmentId },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    if (events.length === 0) {
      return {
        ruleName: this.name,
        label: this.label,
        status: 'PASS',
        score: this.weight,
        maxScore: this.weight,
        message: 'Aucun événement interne conflictuel',
      };
    }

    const names = events.map((e) => `"${e.title}"`).join(', ');
    const hasCritical = events.some((e) => e.priority === 'CRITIQUE' || e.priority === 'HAUTE');
    return {
      ruleName: this.name,
      label: this.label,
      status: hasCritical ? 'FAIL' : 'WARN',
      score: hasCritical ? 0 : Math.max(0, this.weight - events.length * 8),
      maxScore: this.weight,
      message: hasCritical
        ? 'Conflit critique avec un événement interne'
        : `Conflit détecté avec ${events.length} événement(s)`,
      details: `Événements : ${names}`,
    };
  }
}
