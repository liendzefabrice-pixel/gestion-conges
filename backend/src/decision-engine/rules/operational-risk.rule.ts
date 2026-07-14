import { Injectable } from '@nestjs/common';
import { DecisionRule, DecisionContext, RuleEvaluation } from '../interfaces/decision-rule.interface';

@Injectable()
export class OperationalRiskRule implements DecisionRule {
  readonly name = 'operational_risk';
  readonly label = 'Analyse opérationnelle';
  readonly description = 'Vérifie l\'effectif minimum, les postes critiques et la disponibilité des remplaçants';
  readonly weight = 30;

  async evaluate(context: DecisionContext): Promise<RuleEvaluation> {
    const { employeeId, departmentId, startDate, endDate, prisma } = context;
    const deductions: string[] = [];
    let score = this.weight;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true, minEmployees: true },
    });

    if (!department) {
      return {
        ruleName: this.name,
        label: this.label,
        status: 'FAIL',
        score: 0,
        maxScore: this.weight,
        message: 'Département introuvable',
      };
    }

    const totalEmployees = await prisma.employee.count({
      where: { departmentId, positionRef: { isActive: true } },
    });

    const absentEmployeeIds = await prisma.leaveRequest.findMany({
      where: {
        status: { in: ['APPROUVE', 'EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        employee: { departmentId },
        employeeId: { not: employeeId },
      },
      select: { employeeId: true },
    });

    const alreadyAbsent = new Set(absentEmployeeIds.map((a) => a.employeeId));
    alreadyAbsent.add(employeeId);
    const remaining = totalEmployees - alreadyAbsent.size;

    if (department.minEmployees > 0) {
      deductions.push(`Effectif total du département : ${totalEmployees}`);
      deductions.push(`Employés présents estimés : ${remaining}`);
      deductions.push(`Minimum requis : ${department.minEmployees}`);

      if (remaining < department.minEmployees) {
        score -= 15;
        riskLevel = 'HIGH';
        deductions.push(`⚠ Effectif insuffisant : ${remaining} présent(s) pour ${department.minEmployees} requis`);
      } else {
        deductions.push(`✅ Effectif minimum respecté`);
      }
    } else {
      deductions.push(`Aucun effectif minimum configuré pour ce département`);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { positionId: true, positionRef: { select: { id: true, name: true, isCritical: true, canBeReplaced: true } } },
    });

    if (employee?.positionRef?.isCritical) {
      deductions.push(`Poste critique : ${employee.positionRef.name}`);

      const sameCriticalAbsent = await prisma.leaveRequest.findFirst({
        where: {
          status: { in: ['APPROUVE', 'EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION'] },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
          employee: {
            positionId: employee.positionId,
            id: { not: employeeId },
          },
        },
        include: { employee: { select: { firstName: true, lastName: true } } },
      });

      if (sameCriticalAbsent) {
        score -= 10;
        riskLevel = 'CRITICAL';
        deductions.push(`⚠ Deux postes critiques seraient absents simultanément (${sameCriticalAbsent.employee.firstName} ${sameCriticalAbsent.employee.lastName})`);
      } else {
        deductions.push(`✅ Aucun autre titulaire de ce poste critique absent`);
      }

      if (!employee.positionRef.canBeReplaced) {
        score -= 5;
        if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
        deductions.push(`⚠ Aucun remplaçant disponible pour ce poste critique`);
      } else {
        deductions.push(`✅ Remplaçant disponible si nécessaire`);
      }
    } else {
      deductions.push(`Poste non critique — aucun impact sur la continuité`);
    }

    const isPass = score === this.weight;
    const isFail = score <= 5;
    return {
      ruleName: this.name,
      label: this.label,
      status: isPass ? 'PASS' : isFail ? 'FAIL' : 'WARN',
      score: Math.max(0, score),
      maxScore: this.weight,
      message: this.buildMessage(riskLevel, remaining, department.minEmployees),
      details: `Niveau de risque : ${this.riskLabel(riskLevel)}\n${deductions.join('\n')}`,
    };
  }

  private buildMessage(riskLevel: string, remaining: number, minEmployees: number): string {
    switch (riskLevel) {
      case 'CRITICAL': return '🔴 Risque critique — poste critique sans remplaçant et effectif insuffisant';
      case 'HIGH': return '🟠 Risque élevé — effectif potentiellement insuffisant';
      case 'MEDIUM': return '🟡 Risque moyen — vigilance recommandée';
      default: return '🟢 Risque faible — aucune contrainte opérationnelle';
    }
  }

  private riskLabel(level: string): string {
    switch (level) {
      case 'CRITICAL': return '🔴 Critique';
      case 'HIGH': return '🟠 Élevé';
      case 'MEDIUM': return '🟡 Moyen';
      default: return '🟢 Faible';
    }
  }
}
