import { LeaveProposal } from '@prisma/client';

export interface RuleContext {
  proposal: LeaveProposal & {
    employee: { id: number; departmentId: number; department: { id: number; name: string } };
  };
  allProposals: (LeaveProposal & {
    employee: { id: number; departmentId: number; department: { id: number; name: string } };
  })[];
  prisma: any;
}

export interface RuleResult {
  ruleName: string;
  status: 'COMPATIBLE' | 'CONFLIT_DEPARTEMENT' | 'PROPOSITION_AUTOMATIQUE';
  severity: 'INFO' | 'WARNING' | 'BLOCKER';
  message: string;
  details?: Record<string, any>;
  suggestedStartDate?: Date;
  suggestedEndDate?: Date;
}

export interface PlanningRule {
  analyze(context: RuleContext): Promise<RuleResult>;
}
