import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionRule, DecisionContext, RuleEvaluation } from '../interfaces/decision-rule.interface';

@Injectable()
export class BalanceSufficiencyRule implements DecisionRule {
  readonly name = 'balance_sufficiency';
  readonly label = 'Solde disponible';
  readonly description = 'Vérifie le solde, l\'ancienneté et le type de congé';
  readonly weight = 30;

  constructor(private prisma: PrismaService) {}

  async evaluate(context: DecisionContext): Promise<RuleEvaluation> {
    const { employeeId, startDate, duration, leaveTypeId, prisma } = context;
    const deductions: string[] = [];
    let score = this.weight;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: { select: { id: true } } },
    });

    if (!employee) {
      return {
        ruleName: this.name,
        label: this.label,
        status: 'FAIL',
        score: 0,
        maxScore: this.weight,
        message: 'Employé introuvable',
      };
    }

    const now = new Date();
    const hireDate = new Date(employee.hireDate);
    const monthsEmployed = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

    if (monthsEmployed < 12) {
      deductions.push('Ancienneté insuffisante (moins de 12 mois)');
      score -= 15;
    } else {
      deductions.push('Ancienneté conforme');
    }

    if (leaveTypeId) {
      const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
      if (!leaveType || !leaveType.isActive) {
        deductions.push('Type de congé inactif ou invalide');
        score -= 10;
      } else {
        deductions.push(`Type de congé autorisé (${leaveType.name})`);
        if (leaveType.maxDuration && duration > leaveType.maxDuration) {
          deductions.push(`Durée maximale autorisée dépassée (max: ${leaveType.maxDuration} jours)`);
          score -= 10;
        } else if (leaveType.maxDuration) {
          deductions.push(`Durée conforme (max: ${leaveType.maxDuration} jours)`);
        }
      }
    }

    const year = startDate.getFullYear();
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, year, leaveTypeId: leaveTypeId || undefined },
    });

    if (balance) {
      const remaining = balance.totalDays + balance.adjustedDays - balance.usedDays - balance.pendingDays;
      if (remaining < duration) {
        deductions.push(`Solde insuffisant : ${remaining} jours restants pour ${duration} demandés`);
        score -= score;
      } else {
        deductions.push(`Solde suffisant : ${remaining} jours disponibles`);
      }
    } else {
      deductions.push('Aucun solde trouvé pour cette année');
      score -= 10;
    }

    const isPass = score === this.weight;
    const isFail = score <= 0;
    return {
      ruleName: this.name,
      label: this.label,
      status: isPass ? 'PASS' : isFail ? 'FAIL' : 'WARN',
      score: Math.max(0, score),
      maxScore: this.weight,
      message: isPass ? 'Solde et ancienneté conformes' : 'Contraintes de solde détectées',
      details: deductions.join('\n'),
    };
  }
}
