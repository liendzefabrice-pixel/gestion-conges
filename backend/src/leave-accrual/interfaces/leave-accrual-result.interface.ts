export interface LeaveAccrualResult {
  monthsWorked: number;
  daysAccrued: number;
  referenceYear: number;
  seniorityLabel: string;
  canTakeLeave: boolean;
  message: string | null;
}
