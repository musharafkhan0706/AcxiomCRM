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
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
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
    <aside
      className={cn(
        'relative bg-[#097C87] text-white transition-all duration-300 flex flex-col z-30 shadow-xl select-none',
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
            <span className="text-xs font-bold text-[#23CED9]">{user?.role}</span>
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
  );
};
