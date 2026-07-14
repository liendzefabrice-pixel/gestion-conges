export interface RuleEvaluation {
  ruleName: string;
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  score: number;
  maxScore: number;
  message: string;
  details?: string;
}

export interface DecisionContext {
  entityType: 'LEAVE_REQUEST' | 'LEAVE_PROPOSAL';
  entityId: number;
  employeeId: number;
  departmentId: number;
  startDate: Date;
  endDate: Date;
  duration: number;
  leaveTypeId?: number;
  prisma: any;
}

export interface DecisionRule {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly weight: number;
  evaluate(context: DecisionContext): Promise<RuleEvaluation>;
}
