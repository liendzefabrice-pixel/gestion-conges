import { Injectable } from '@nestjs/common';
import { DecisionRule, DecisionContext, RuleEvaluation } from '../interfaces/decision-rule.interface';

interface ReplacementProposal {
  employeeId: number;
  firstName: string;
  lastName: string;
  matricule: string;
  position: string | null;
  departmentName: string;
  samePosition: boolean;
  sameDepartment: boolean;
  commonSkills: number;
  totalEmployeeSkills: number;
  totalReplacementSkills: number;
  matchScore: number;
  confidence: 'EXCELLENT' | 'BON' | 'MOYEN' | 'FAIBLE';
  isAvailable: boolean;
  unavailableReason?: string;
}

@Injectable()
export class ReplacementAvailabilityRule implements DecisionRule {
  readonly name = 'replacement_availability';
  readonly label = 'Disponibilité des remplaçants';
  readonly description = 'Vérifie si des remplaçants sont définis et disponibles pour la période';
  readonly weight = 20;

  async evaluate(context: DecisionContext): Promise<RuleEvaluation> {
    const { employeeId, startDate, endDate, prisma } = context;

    const replacements = await prisma.employeeReplacement.findMany({
      where: { employeeId },
      include: {
        replacement: {
          include: {
            positionRef: true,
            department: { select: { id: true, name: true } },
            skills: {
              include: { skill: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (replacements.length === 0) {
      return {
        ruleName: this.name,
        label: this.label,
        status: 'WARN',
        score: 5,
        maxScore: this.weight,
        message: '⚠ Aucun remplaçant défini',
        details: 'Aucun remplaçant potentiel n\'a été configuré pour cet employé.',
      };
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        positionRef: true,
        department: { select: { id: true, name: true } },
        skills: { include: { skill: { select: { id: true, name: true } } } },
      },
    });

    const employeeSkillIds = new Set(employee?.skills.map((s) => s.skill.id) || []);
    const employeePositionId = employee?.positionId;
    const employeeDeptId = employee?.departmentId;

    const proposals: ReplacementProposal[] = [];

    for (const rel of replacements) {
      const repl = rel.replacement;

      const unavailable = await this.isUnavailable(repl.id, startDate, endDate, prisma);

      const samePosition = employeePositionId != null && repl.positionId === employeePositionId;
      const sameDepartment = employeeDeptId != null && repl.departmentId === employeeDeptId;

      const replSkillIds = repl.skills.map((s) => s.skill.id);
      const commonIds = replSkillIds.filter((id) => employeeSkillIds.has(id));
      const commonSkills = commonIds.length;
      const skillMatchRatio = employeeSkillIds.size > 0 ? commonSkills / employeeSkillIds.size : 0;

      const matchScore = this.computeMatchScore(samePosition, sameDepartment, skillMatchRatio);
      const confidence = this.computeConfidence(matchScore);

      const totalEmployeeSkills = employeeSkillIds.size;
      const totalReplacementSkills = replSkillIds.length;

      proposals.push({
        employeeId: repl.id,
        firstName: repl.firstName,
        lastName: repl.lastName,
        matricule: repl.matricule,
        position: repl.position || repl.positionRef?.name || null,
        departmentName: repl.department?.name || '',
        samePosition,
        sameDepartment,
        commonSkills,
        totalEmployeeSkills,
        totalReplacementSkills,
        matchScore,
        confidence,
        isAvailable: !unavailable,
        unavailableReason: unavailable || undefined,
      });
    }

    proposals.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
      return 0;
    });

    const best = proposals[0];
    const availableCount = proposals.filter((p) => p.isAvailable).length;

    let score = this.weight;
    const details: string[] = [];
    const checkedRepl: string[] = [];

    if (availableCount === 0) {
      score = 5;
      details.push(`🔴 Aucun remplaçant disponible sur la période`);
      details.push(`Remplaçants configurés : ${proposals.length}`);
      for (const p of proposals) {
        details.push(`  • ${p.firstName} ${p.lastName} (${p.position || 'N/A'}) — ${p.unavailableReason}`);
      }
      return {
        ruleName: this.name,
        label: this.label,
        status: 'FAIL',
        score,
        maxScore: this.weight,
        message: '🔴 Aucun remplaçant disponible',
        details: details.join('\n'),
      };
    }

    if (best.isAvailable) {
      score -= Math.round((1 - best.matchScore) * this.weight * 0.5);
    }

    const confLabel = this.confidenceLabel(best.confidence);
    details.push(`✅ ${best.firstName} ${best.lastName} disponible`);
    details.push(`  Poste : ${best.position || 'N/A'} ${best.samePosition ? '(même poste ✓)' : ''}`);
    details.push(`  Département : ${best.departmentName} ${best.sameDepartment ? '(même département ✓)' : ''}`);
    details.push(`  Compétences communes : ${best.commonSkills}/${best.totalEmployeeSkills} ${best.totalReplacementSkills > best.totalEmployeeSkills ? `(dont ${best.totalReplacementSkills - best.commonSkills} supplémentaire(s))` : ''}`);
    details.push(`  Score de correspondance : ${Math.round(best.matchScore * 100)}%`);
    details.push(`  Niveau de confiance : ${confLabel}`);

    if (availableCount > 1) {
      details.push(``);
      details.push(`Autres remplaçants disponibles :`);
      for (const p of proposals.filter((p) => p.isAvailable && p.employeeId !== best.employeeId)) {
        details.push(`  • ${p.firstName} ${p.lastName} — confiance ${this.confidenceLabel(p.confidence)}`);
      }
    } else if (proposals.length > 1) {
      details.push(``);
      details.push(`Remplaçants indisponibles :`);
      for (const p of proposals.filter((p) => !p.isAvailable)) {
        details.push(`  • ${p.firstName} ${p.lastName} — ${p.unavailableReason}`);
      }
    }

    const isPass = score >= this.weight * 0.8;
    const isFail = score <= this.weight * 0.3;

    return {
      ruleName: this.name,
      label: this.label,
      status: isPass ? 'PASS' : isFail ? 'FAIL' : 'WARN',
      score: Math.max(0, score),
      maxScore: this.weight,
      message: isPass
        ? `✅ ${best.firstName} ${best.lastName} — remplaçant disponible (${confLabel})`
        : `⚠ ${best.firstName} ${best.lastName} — remplaçant disponible (confiance ${confLabel})`,
      details: details.join('\n'),
    };
  }

  private async isUnavailable(
    replacementId: number,
    startDate: Date,
    endDate: Date,
    prisma: any,
  ): Promise<string | null> {
    const overlappingLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: replacementId,
        status: { in: ['APPROUVE', 'EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlappingLeave) return 'En congé sur la période';

    const overlappingProposal = await prisma.leaveProposal.findFirst({
      where: {
        employeeId: replacementId,
        status: { in: ['SOUMISE', 'ACCEPTEE_RH', 'ACCEPTEE_DIRECTION'] },
        desiredStartDate: { lte: endDate },
        OR: [
          {
            desiredEndDate: { gte: startDate },
          },
          {
            desiredEndDate: null,
            duration: { not: null },
            desiredStartDate: { lte: endDate },
          },
        ],
      },
    });
    if (overlappingProposal) return 'Proposition de congé en cours';

    const overlappingPermission = await prisma.permissionRequest.findFirst({
      where: {
        employeeId: replacementId,
        status: { in: ['APPROUVE', 'EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlappingPermission) return 'En permission sur la période';

    return null;
  }

  private computeMatchScore(
    samePosition: boolean,
    sameDepartment: boolean,
    skillMatchRatio: number,
  ): number {
    let score = 0;
    if (samePosition) score += 0.4;
    if (sameDepartment) score += 0.2;
    score += skillMatchRatio * 0.4;
    return Math.min(1, score);
  }

  private computeConfidence(matchScore: number): 'EXCELLENT' | 'BON' | 'MOYEN' | 'FAIBLE' {
    if (matchScore >= 0.85) return 'EXCELLENT';
    if (matchScore >= 0.65) return 'BON';
    if (matchScore >= 0.4) return 'MOYEN';
    return 'FAIBLE';
  }

  private confidenceLabel(confidence: string): string {
    switch (confidence) {
      case 'EXCELLENT': return '🟢 Excellent';
      case 'BON': return '🟡 Bon';
      case 'MOYEN': return '🟠 Moyen';
      case 'FAIBLE': return '🔴 Faible';
      default: return confidence;
    }
  }
}
