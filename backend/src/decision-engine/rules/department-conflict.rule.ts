import { Injectable } from '@nestjs/common';
import { DecisionRule, DecisionContext, RuleEvaluation } from '../interfaces/decision-rule.interface';

@Injectable()
export class DepartmentConflictRule implements DecisionRule {
  readonly name = 'department_conflict';
  readonly label = 'Conflit de département';
  readonly description = 'Vérifie si plusieurs employés du même département sont absents simultanément';
  readonly weight = 25;

  async evaluate(context: DecisionContext): Promise<RuleEvaluation> {
    const { departmentId, startDate, endDate, entityType, entityId, prisma } = context;

    const overlapping = await prisma.leaveRequest.findMany({
      where: {
        id: entityType === 'LEAVE_REQUEST' ? { not: entityId } : undefined,
        status: { in: ['APPROUVE', 'EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        employee: { departmentId },
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (overlapping.length === 0) {
      return {
        ruleName: this.name,
        label: this.label,
        status: 'PASS',
        score: this.weight,
        maxScore: this.weight,
        message: 'Aucun conflit de département',
        details: 'Aucun autre employé du même département n\'est en congé sur cette période',
      };
    }

    const names = overlapping.map((l) => `${l.employee.firstName} ${l.employee.lastName}`).join(', ');
    return {
      ruleName: this.name,
      label: this.label,
      status: 'WARN',
      score: Math.max(0, this.weight - overlapping.length * 5),
      maxScore: this.weight,
      message: `${overlapping.length} employé(s) du même département déjà en congé`,
      details: `Employés concernés : ${names}`,
    };
  }
}
