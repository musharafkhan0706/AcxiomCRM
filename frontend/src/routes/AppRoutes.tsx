import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../layouts/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CustomerListPage from '../features/customers/CustomerListPage';
import LeadListPage from '../features/leads/LeadListPage';
import OpportunityListPage from '../features/opportunities/OpportunityListPage';
import FollowUpListPage from '../features/followups/FollowUpListPage';
import ActivityListPage from '../features/activities/ActivityListPage';
import ReportsPage from '../features/reports/ReportsPage';
import UserListPage from '../features/users/UserListPage';
import AuditLogPage from '../features/audit/AuditLogPage';
import { RoleName } from '../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

// Authenticated Route Guard
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-deep-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Role Authorization Guard
const RequireRole: React.FC<{ roles: RoleName[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied (403)</h2>
        <p className="text-xs text-gray-500">
          Your role (<span className="font-semibold text-gray-800">{user?.role?.replace('_', ' ')}</span>) is not
          authorized to access this module. Please contact your CRM Administrator.
        </p>
        <Button onClick={() => window.history.back()} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Return
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes wrapped in App Shell */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="leads" element={<LeadListPage />} />
        <Route path="opportunities" element={<OpportunityListPage />} />
        <Route path="followups" element={<FollowUpListPage />} />
        <Route path="activities" element={<ActivityListPage />} />
        <Route path="reports" element={<ReportsPage />} />

        {/* Admin and Manager Scoped */}
        <Route
          path="audit"
          element={
            <RequireRole roles={['ADMIN', 'MANAGER']}>
              <AuditLogPage />
            </RequireRole>
          }
        />
        <Route
          path="audit-logs"
          element={
            <RequireRole roles={['ADMIN', 'MANAGER']}>
              <AuditLogPage />
            </RequireRole>
          }
        />

        {/* Admin Only Scoped */}
        <Route
          path="users"
          element={
            <RequireRole roles={['ADMIN']}>
              <UserListPage />
            </RequireRole>
          }
        />

        {/* 404 Inside Layout */}
        <Route
          path="*"
          element={
            <div className="text-center py-16 space-y-3">
              <h1 className="text-4xl font-extrabold text-brand-deep-teal">404</h1>
              <p className="text-sm font-semibold text-gray-800">Page Not Found</p>
              <p className="text-xs text-gray-500">The requested CRM workspace module does not exist.</p>
              <Button onClick={() => window.location.assign('/dashboard')} size="sm">
                Return to Dashboard
              </Button>
            </div>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

