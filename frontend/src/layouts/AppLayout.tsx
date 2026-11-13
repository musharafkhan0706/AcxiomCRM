import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Automatically close mobile navigation drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden relative">
      {/* Sidebar Navigation: Desktop permanent + Mobile drawer */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* Top Navbar */}
        <TopNav onOpenMobileMenu={() => setMobileOpen(true)} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

