import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import DepartmentsPage from '../pages/DepartmentsPage';
import EmployeesPage from '../pages/EmployeesPage';
import LeavePage from '../pages/LeavePage';
import PermissionsPage from '../pages/PermissionsPage';
import UsersPage from '../pages/UsersPage';
import NotificationsPage from '../pages/NotificationsPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';

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

      <Route path="/reset-password" element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route index element={<ResetPasswordPage />} />
      </Route>

      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="leave" element={<LeavePage />} />
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
