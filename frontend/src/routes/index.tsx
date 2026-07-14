import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import RoleRoute from '../components/RoleRoute';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import OtpVerificationPage from '../pages/OtpVerificationPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import AccountPage from '../pages/AccountPage';
import AccountSecurityPage from '../pages/AccountSecurityPage';
import DepartmentsPage from '../pages/DepartmentsPage';
import PositionsPage from '../pages/PositionsPage';
import LeaveTypesPage from '../pages/LeaveTypesPage';
import EmployeesPage from '../pages/EmployeesPage';
import LeavePage from '../pages/LeavePage';
import LeavePlanningPage from '../pages/LeavePlanningPage';
import MyPlanningPage from '../pages/MyPlanningPage';
import SoldesPage from '../pages/SoldesPage';
import HolidaysPage from '../pages/HolidaysPage';
import PermissionsPage from '../pages/PermissionsPage';
import UsersPage from '../pages/UsersPage';
import NotificationsPage from '../pages/NotificationsPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import CampaignsPage from '../pages/CampaignsPage';
import MyCampaignPage from '../pages/MyCampaignPage';
import EventsPage from '../pages/EventsPage';
import CalendarPage from '../pages/CalendarPage';
import DecisionEnginePage from '../pages/DecisionEnginePage';
import CalendarRhPage from '../pages/CalendarRhPage';
import SkillsPage from '../pages/SkillsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, mustChangePassword } = useAuth();
  const location = window.location.pathname;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (mustChangePassword && location !== '/change-password') return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const R = (roles: string[]) => (children: React.ReactNode) => (
  <RoleRoute roles={roles}>{children}</RoleRoute>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route index element={<LoginPage />} />
      </Route>

      <Route path="/forgot-password" element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route index element={<ForgotPasswordPage />} />
      </Route>

      <Route path="/verify-otp" element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route index element={<OtpVerificationPage />} />
      </Route>

      <Route path="/reset-password" element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route index element={<ResetPasswordPage />} />
      </Route>

      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="account/security" element={<AccountSecurityPage />} />
        <Route path="departments" element={R(['ADMIN'])(<DepartmentsPage />)} />
        <Route path="positions" element={R(['ADMIN'])(<PositionsPage />)} />
        <Route path="leave-types" element={R(['ADMIN'])(<LeaveTypesPage />)} />
        <Route path="employees" element={R(['ADMIN', 'HR'])(<EmployeesPage />)} />
        <Route path="leave" element={R(['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'])(<LeavePage />)} />
        <Route path="leave-planning" element={R(['ADMIN', 'HR'])(<LeavePlanningPage />)} />
        <Route path="leave-campaigns" element={R(['ADMIN', 'HR'])(<CampaignsPage />)} />
        <Route path="my-campaign" element={R(['EMPLOYEE'])(<MyCampaignPage />)} />
        <Route path="my-planning" element={R(['EMPLOYEE'])(<MyPlanningPage />)} />
        <Route path="soldes" element={R(['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'])(<SoldesPage />)} />
        <Route path="holidays" element={R(['ADMIN'])(<HolidaysPage />)} />
        <Route path="internal-events" element={R(['ADMIN', 'HR'])(<EventsPage />)} />
        <Route path="calendar" element={R(['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'])(<CalendarPage />)} />
        <Route path="calendar-rh" element={R(['ADMIN', 'HR'])(<CalendarRhPage />)} />
        <Route path="decision-engine" element={R(['ADMIN', 'HR'])(<DecisionEnginePage />)} />
        <Route path="permissions" element={R(['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'])(<PermissionsPage />)} />
        <Route path="users" element={R(['ADMIN'])(<UsersPage />)} />
        <Route path="skills" element={R(['ADMIN'])(<SkillsPage />)} />
        <Route path="notifications" element={R(['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'])(<NotificationsPage />)} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
