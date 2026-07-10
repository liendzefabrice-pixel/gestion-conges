export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  role: {
    id: number;
    name: string;
  };
}

export interface AuthResponse {
  access_token: string;
  mustChangePassword?: boolean;
  user: User;
}

export interface Position {
  id: number;
  name: string;
  description?: string;
  departmentId: number;
  department?: { id: number; name: string };
  isActive?: boolean;
  _count?: { employees: number };
  createdAt?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  head?: { id: number; firstName: string; lastName: string } | null;
  isActive?: boolean;
  _count?: { employees: number };
  createdAt?: string;
}

export interface Employee {
  id: number;
  matricule: string;
  firstName: string;
  lastName: string;
  hireDate: string;
  position: string;
  positionId?: number;
  positionRef?: Position | null;
  department: Department;
  user: { id: number; email: string; isActive: boolean; role: { name: string } };
  leaveBalances?: LeaveBalance[];
}

export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  defaultDays: number;
  isActive: boolean;
  requiresRhValidation?: boolean;
  requiresDirectorValidation?: boolean;
  requiresJustification?: boolean;
  deductsFromAnnualBalance?: boolean;
  maxDuration?: number | null;
  minDuration?: number | null;
  color?: string;
  icon?: string;
  createdAt?: string;
}

export interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: 'DRAFT' | 'PENDING' | 'RH_REVIEWED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  hrComment?: string;
  hrOpinion?: string;
  directorComment?: string;
  employee: { id: number; user: { email: string } };
  leaveType: LeaveType;
  reviewedBy?: { id: number; email: string };
  decidedBy?: { id: number; email: string };
  createdAt?: string;
  reviewedAt?: string;
  decidedAt?: string;
}

export interface PermissionRequest {
  id: number;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: 'PENDING' | 'RH_REVIEWED' | 'APPROVED' | 'REJECTED';
  employee: { id: number; user: { email: string } };
  reviewedBy?: { id: number; email: string };
  decidedBy?: { id: number; email: string };
}

export interface LeaveBalance {
  id: number;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  leaveType: LeaveType;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export interface DashboardAdmin {
  users: number;
  employees: number;
  departments: number;
  leaveTypes: number;
  pendingRequests: { leave: number; permission: number; total: number };
}

export interface AnnualLeavePlanning {
  id: number;
  employeeId: number;
  year: number;
  month: number;
  employee?: Employee;
  plannedBy?: { id: number; email: string };
  leaveRequests?: LeaveRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface LeaveEligibility {
  eligible: boolean;
  hasPlanning: boolean;
  planning: AnnualLeavePlanning | null;
  hireDate: string;
  seniorityYears: number;
}

export interface DashboardHr {
  toReview: { leave: number; permission: number; total: number };
  totalProcessed: { leave: number; permission: number };
  planning: {
    totalEmployees: number;
    withPlanning: number;
    withoutPlanning: number;
  };
}

export interface DashboardDirector {
  toDecide: { leave: number; permission: number; total: number };
  decisions: { approved: number; rejected: number };
}

export interface DashboardEmployee {
  balances: {
    type: string;
    year: number;
    total: number;
    used: number;
    pending: number;
    remaining: number;
  }[];
  pendingRequests: { leave: number; permission: number; total: number };
  planning: { month: number; year: number } | null;
  eligibleForLeave: boolean;
}
