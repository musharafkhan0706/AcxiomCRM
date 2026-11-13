import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Target,
  TrendingUp,
  CalendarCheck,
  Activity as ActivityIcon,
  BarChart3,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Building2 },
    { name: 'Leads', path: '/leads', icon: Target },
    { name: 'Opportunities', path: '/opportunities', icon: TrendingUp },
    { name: 'Follow-Ups', path: '/followups', icon: CalendarCheck },
    { name: 'Activities', path: '/activities', icon: ActivityIcon },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    ...(isManagerOrAdmin ? [{ name: 'Audit Logs', path: '/audit', icon: ShieldCheck }] : []),
    ...(isAdmin ? [{ name: 'User Management', path: '/users', icon: Users }] : []),
  ];

  return (
    <>
      {/* 1. Desktop Permanent Sidebar */}
      <aside
        className={cn(
          'hidden md:flex relative bg-[#097C87] text-white transition-all duration-300 flex-col z-30 shadow-xl select-none flex-shrink-0',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#23CED9] to-white/90 flex items-center justify-center shadow-md flex-shrink-0">
              <Building2 className="w-5 h-5 text-[#097C87]" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-lg tracking-wider text-white">ACXIOM</span>
                <span className="font-bold text-lg text-[#23CED9] ml-1">CRM</span>
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-medium">Enterprise SaaS</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-inner'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active Cyan Indicator Line */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#23CED9] rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-[#23CED9]' : 'text-white/70 group-hover:text-white'
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Toggle Footer */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between">
          {!collapsed && (
            <div className="px-2">
              <span className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">Scope: </span>
              <span className="text-xs font-bold text-cyan-200">{user?.role}</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors ml-auto"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* 2. Mobile Responsive Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen?.(false)}
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Responsive Drawer Aside */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#097C87] text-white shadow-2xl flex flex-col md:hidden transition-transform duration-300 ease-in-out transform select-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header with Brand & Close Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#23CED9] to-white/90 flex items-center justify-center shadow-md flex-shrink-0">
              <Building2 className="w-5 h-5 text-[#097C87]" />
            </div>
            <div className="truncate">
              <span className="font-extrabold text-lg tracking-wider text-white">ACXIOM</span>
              <span className="font-bold text-lg text-[#23CED9] ml-1">CRM</span>
              <p className="text-[10px] text-white/70 uppercase tracking-widest font-medium">Enterprise SaaS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen?.(false)}
            className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen?.(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-inner'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#23CED9] rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-[#23CED9]' : 'text-white/70 group-hover:text-white'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Scope Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="px-1">
            <span className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">Scope: </span>
            <span className="text-xs font-bold text-cyan-200">{user?.role}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
