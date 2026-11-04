import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../layouts/AppLayout';
import { RoleName } from '../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

// Route-level lazy loading for performance optimization and small initial bundle size
const LoginPage = lazy(() => import('../features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('../features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../features/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const CustomerListPage = lazy(() => import('../features/customers/CustomerListPage'));
const LeadListPage = lazy(() => import('../features/leads/LeadListPage'));
const OpportunityListPage = lazy(() => import('../features/opportunities/OpportunityListPage'));
const FollowUpListPage = lazy(() => import('../features/followups/FollowUpListPage'));
const ActivityListPage = lazy(() => import('../features/activities/ActivityListPage'));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));
const UserListPage = lazy(() => import('../features/users/UserListPage'));
const AuditLogPage = lazy(() => import('../features/audit/AuditLogPage'));

// Page loading skeleton fallback
const PageSkeletonFallback: React.FC = () => (
  <div className="p-8 space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-72 bg-slate-100 rounded" />
      </div>
      <div className="h-9 w-32 bg-slate-200 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl p-4 space-y-3" />
      ))}
    </div>
    <div className="h-72 bg-white border border-slate-200 rounded-2xl" />
  </div>
);

// Authenticated Route Guard
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#097C87] border-t-transparent rounded-full animate-spin" />
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
    <Suspense fallback={<PageSkeletonFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                <h1 className="text-4xl font-extrabold text-[#097C87]">404</h1>
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
    </Suspense>
  );
};

export default AppRoutes;
