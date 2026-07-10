export interface LeaveTypeBalance {
  leaveTypeId: number;
  leaveTypeName: string;
  year: number;
  acquired: number;
  consumed: number;
  reserved: number;
  adjusted: number;
  available: number;
}

export interface EmployeeBalanceResult {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  balances: LeaveTypeBalance[];
  totals: {
    acquired: number;
    consumed: number;
    reserved: number;
    adjusted: number;
    available: number;
  };
}
