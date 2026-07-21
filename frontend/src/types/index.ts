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
  isCritical?: boolean;
  canBeReplaced?: boolean;
  _count?: { employees: number };
  createdAt?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  head?: { id: number; firstName: string; lastName: string } | null;
  isActive?: boolean;
  minEmployees?: number;
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
  skills?: { id: number; skill: { id: number; name: string } }[];
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
  status: 'BROUILLON' | 'EN_ATTENTE_RH' | 'EN_ATTENTE_DIRECTION' | 'AVIS_RH_RENDU' | 'APPROUVE' | 'REFUSE' | 'ANNULE';
  hrComment?: string;
  hrOpinion?: string;
  directorComment?: string;
  employee: { id: number; firstName?: string; lastName?: string; user: { email: string; firstName?: string; lastName?: string }; position?: string; department?: { name: string } };
  employeeDetails?: { firstName: string; lastName: string; matricule: string; department?: { name: string } };
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
  status: 'EN_ATTENTE_RH' | 'AVIS_RH_RENDU' | 'APPROUVE' | 'REFUSE';
  employee: { id: number; firstName?: string; lastName?: string; user: { email: string; firstName?: string; lastName?: string }; position?: string; department?: { name: string } };
  reviewedBy?: { id: number; email: string };
  decidedBy?: { id: number; email: string };
}

export interface LeaveBalance {
  id: number;
  year: number;
  totalDays: number;
  adjustedDays: number;
  usedDays: number;
  pendingDays: number;
  status: string;
  remaining: number;
  leaveType: LeaveType;
}

export interface BalanceAdjustment {
  id: number;
  operationType: string;
  previousRemaining: number;
  newRemaining: number;
  comment?: string;
  author: { id: number; email: string };
  createdAt: string;
}

export interface EmployeeBalance {
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    matricule: string;
    user: { email: string };
    department: { id: number; name: string };
  };
  balances: LeaveBalance[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  link?: string;
  entityType?: string;
  entityId?: number;
  createdAt: string;
}

export interface DashboardAdmin {
  users: number;
  employees: number;
  departments: number;
  leaveTypes: number;
  pendingRequests: { leave: number; permission: number; total: number };
  campaign?: {
    id: number;
    label: string;
    year: number;
    eligibleEmployees: number;
    proposalsReceived: number;
    participationRate: number;
  } | null;
}


export interface DashboardHr {
  employees: number;
  toReview: { leave: number; permission: number; total: number };
  totalProcessed: { leave: number; permission: number };
  campaign?: {
    id: number;
    label: string;
    year: number;
    eligibleEmployees: number;
    proposalsReceived: number;
    participationRate: number;
  } | null;
}

export interface DashboardDirector {
  toDecide: { leave: number; permission: number; total: number };
  decisions: { approved: number; rejected: number };
}

export interface LeaveAccrual {
  monthsWorked: number;
  daysAccrued: number;
  referenceYear: number;
  seniorityLabel: string;
  canTakeLeave: boolean;
  message: string | null;
}

export interface WorkingDaysResult {
  startDate: string;
  endDate: string;
  calendarDays: number;
  sundays: number;
  holidaysExcluded: number;
  workingDays: number;
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
  proposal?: { status: string; desiredStartDate: string } | null;
  eligibleForLeave: boolean;
}
