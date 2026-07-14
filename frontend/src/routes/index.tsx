import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
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
import CalendarRhPage from '../pages/CalendarRhPage';

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
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="positions" element={<PositionsPage />} />
        <Route path="leave-types" element={<LeaveTypesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="leave-planning" element={<LeavePlanningPage />} />
        <Route path="leave-campaigns" element={<CampaignsPage />} />
        <Route path="my-campaign" element={<MyCampaignPage />} />
        <Route path="my-planning" element={<MyPlanningPage />} />
        <Route path="soldes" element={<SoldesPage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="internal-events" element={<EventsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="calendar-rh" element={<CalendarRhPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
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
