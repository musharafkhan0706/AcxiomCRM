import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  UserRound,
  LogOut,
  KeyRound,
  ChevronDown,
  Building2,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../api/client';

export const TopNav: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Executive Dashboard';
    if (path.startsWith('/customers')) return 'Customer Management & 360° Profiles';
    if (path.startsWith('/leads')) return 'Lead Management & Conversion Pipeline';
    if (path.startsWith('/opportunities')) return 'Sales Opportunities & Kanban Pipeline';
    if (path.startsWith('/followups')) return 'Follow-Up Scheduling & Activity Calendar';
    if (path.startsWith('/activities')) return 'Sales Activities Log (Calls, Meetings, Tasks)';
    if (path.startsWith('/reports')) return 'Reports, Pipeline Intelligence & Analytics';
    if (path.startsWith('/audit')) return 'Enterprise Security & Audit Trail';
    if (path.startsWith('/users')) return 'User Administration & Security Scopes';
    return 'AcxiomCRM';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Default search routing
    navigate(`/customers?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setChangePasswordOpen(false), 1500);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          {getBreadcrumbTitle()}
        </h1>
      </div>

      {/* Center Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Global search by name, code, company, or email..."
            className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm rounded-xl pl-10 pr-4 py-2 border border-transparent focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all outline-none"
          />
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#23CED9] ring-2 ring-white" />
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">System Notifications</span>
                <span className="text-[10px] bg-brand-cyan/20 text-brand-teal px-2 py-0.5 rounded-full font-bold">Live</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto mt-2">
                <div className="py-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5 text-brand-teal">
                      <TrendingUp className="w-3.5 h-3.5" /> High-Value Deal
                    </span>
                    <span className="text-[10px] text-slate-400">10m ago</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Apex CRM Integration moved to Negotiation stage ($150,000).</p>
                </div>
                <div className="py-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <Target className="w-3.5 h-3.5" /> Qualified Lead
                    </span>
                    <span className="text-[10px] text-slate-400">1h ago</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Thomas Sterling marked as Qualified and ready for conversion.</p>
                </div>
                <div className="py-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <Building2 className="w-3.5 h-3.5" /> New Customer
                    </span>
                    <span className="text-[10px] text-slate-400">3h ago</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Starlight Healthcare Systems account activated.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-teal text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserRound className="w-4 h-4" />}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
              <div className="mt-0.5">
                <StatusBadge status={user?.role || 'SALES_EXECUTIVE'} />
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
          </button>

          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                {user?.department && (
                  <p className="text-[11px] text-brand-teal font-medium mt-1">
                    Dept: {user.department}
                  </p>
                )}
              </div>

              <div className="py-1">
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  Change Password
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        title="Change Security Password"
        description="Update your credentials. Minimum 8 characters required."
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium">
              {passwordSuccess}
            </div>
          )}

          <Input
            label="Current Password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />

          <Input
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            helperText="Must meet enterprise password complexity requirements"
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setChangePasswordOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
};

