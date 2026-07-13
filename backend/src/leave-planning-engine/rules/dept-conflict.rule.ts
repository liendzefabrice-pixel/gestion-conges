import { Injectable } from '@nestjs/common';
import { PlanningRule, RuleContext, RuleResult } from '../interfaces/planning-rule.interface';

@Injectable()
export class DeptConflictRule implements PlanningRule {
  readonly name = 'DeptConflictRule';

  async analyze(context: RuleContext): Promise<RuleResult> {
    const { proposal, allProposals } = context;
    const employeeDeptId = proposal.employee.departmentId;

    if (!proposal.duration || proposal.duration <= 0) {
      return {
        ruleName: this.name,
        status: 'COMPATIBLE',
        severity: 'INFO',
        message: 'Durée non spécifiée, analyse ignorée',
      };
    }

    const desiredEnd = new Date(proposal.desiredStartDate);
    desiredEnd.setDate(desiredEnd.getDate() + proposal.duration - 1);

    const sameDeptProposals = allProposals.filter(
      (p) =>
        p.id !== proposal.id &&
        p.employee.departmentId === employeeDeptId &&
        p.duration > 0,
    );

    const conflicts: {
      employeeName: string;
      proposalId: number;
      theirStart: Date;
      theirEnd: Date;
      submittedBefore: boolean;
    }[] = [];

    for (const other of sameDeptProposals) {
      const otherStart = new Date(other.desiredStartDate);
      const otherEnd = new Date(other.desiredStartDate);
      otherEnd.setDate(otherEnd.getDate() + other.duration - 1);

      const overlaps =
        proposal.desiredStartDate <= otherEnd && desiredEnd >= otherStart;

      if (overlaps) {
        conflicts.push({
          employeeName: `${other.employee['firstName'] ?? ''} ${other.employee['lastName'] ?? ''}`.trim(),
          proposalId: other.id,
          theirStart: otherStart,
          theirEnd: otherEnd,
          submittedBefore: other.createdAt < proposal.createdAt,
        });
      }
    }

    if (conflicts.length === 0) {
      return {
        ruleName: this.name,
        status: 'COMPATIBLE',
        severity: 'INFO',
        message: 'Aucun conflit détecté dans le département',
      };
    }

    const earlierConflict = conflicts
      .filter((c) => c.submittedBefore)
      .sort((a, b) => a.theirStart.getTime() - b.theirStart.getTime())[0];

    if (!earlierConflict) {
      return {
        ruleName: this.name,
        status: 'COMPATIBLE',
        severity: 'WARNING',
        message: `Conflit avec des propositions soumises après celle-ci (priorité conservée)`,
        details: { conflicts },
      };
    }

    const newStart = new Date(earlierConflict.theirEnd);
    newStart.setDate(newStart.getDate() + 1);

    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + proposal.duration - 1);

    return {
      ruleName: this.name,
      status: 'CONFLIT_DEPARTEMENT',
      severity: 'WARNING',
      message: `Conflit avec ${earlierConflict.employeeName} (${earlierConflict.theirStart.toLocaleDateString('fr-FR')} → ${earlierConflict.theirEnd.toLocaleDateString('fr-FR')})`,
      details: { conflicts, conflictingProposalId: earlierConflict.proposalId, conflictingEmployee: earlierConflict.employeeName },
      suggestedStartDate: newStart,
      suggestedEndDate: newEnd,
    };
  }
}
