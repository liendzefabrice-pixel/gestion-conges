import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkingDaysService } from '../../working-days/working-days.service';
import { PlanningRule, RuleContext, RuleResult } from '../interfaces/planning-rule.interface';

@Injectable()
export class InternalEventConflictRule implements PlanningRule {
  readonly name = 'InternalEventConflictRule';

  constructor(
    private prisma: PrismaService,
    private workingDaysService: WorkingDaysService,
  ) {}

  async analyze(context: RuleContext): Promise<RuleResult> {
    const { proposal } = context;
    const employeeDeptId = proposal.employee.departmentId;

    if (!proposal.duration || proposal.duration <= 0) {
      return {
        ruleName: this.name,
        status: 'COMPATIBLE',
        severity: 'INFO',
        message: 'Durée non spécifiée, analyse ignorée',
      };
    }

    const desiredEnd = await this.workingDaysService.addWorkingDays(new Date(proposal.desiredStartDate), proposal.duration - 1);

    const activeEvents = await this.prisma.internalEvent.findMany({
      where: {
        status: 'ACTIF',
        startDate: { lte: desiredEnd },
        endDate: { gte: proposal.desiredStartDate },
      },
      include: { department: { select: { id: true, name: true } } },
      orderBy: { priority: 'desc' },
    });

    const conflictingEvents = activeEvents.filter(
      (e) => e.allCompany || e.departmentId === employeeDeptId,
    );

    if (conflictingEvents.length === 0) {
      return {
        ruleName: this.name,
        status: 'COMPATIBLE',
        severity: 'INFO',
        message: 'Aucun événement interne conflictuel',
      };
    }

    const primaryEvent = conflictingEvents[0];
    const priorityLabels: Record<string, string> = {
      FAIBLE: 'Faible',
      MOYENNE: 'Moyenne',
      HAUTE: 'Haute',
      CRITIQUE: 'Critique',
    };

    const conflictingNames = conflictingEvents.map((e) => `"${e.title}"`).join(', ');

    const newStart = await this.workingDaysService.computeReturnDate(new Date(primaryEvent.endDate));
    const newEnd = await this.workingDaysService.addWorkingDays(newStart, proposal.duration - 1);

    return {
      ruleName: this.name,
      status: 'CONFLIT_DEPARTEMENT',
      severity: 'WARNING',
      message: `Conflit avec : ${conflictingNames} (${primaryEvent.startDate.toLocaleDateString('fr-FR')} → ${primaryEvent.endDate.toLocaleDateString('fr-FR')}, Priorité : ${priorityLabels[primaryEvent.priority] ?? primaryEvent.priority})`,
      details: {
        eventIds: conflictingEvents.map((e) => e.id),
        eventNames: conflictingEvents.map((e) => e.title),
        primaryEventId: primaryEvent.id,
        primaryEventTitle: primaryEvent.title,
        priority: primaryEvent.priority,
      },
      suggestedStartDate: newStart,
      suggestedEndDate: newEnd,
    };
  }
}
