import React, { useCallback, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '../../config/brand';
import { AdminSearch } from './AdminSearch';
import { AdminNotificationBell } from './AdminNotificationBell';
import { adminService } from '../../services/adminService';
import { usePolling } from '../../hooks/usePolling';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/posts', label: 'Posts' },
  { to: '/admin/reels', label: 'Reels / Videos' },
  { to: '/admin/comments', label: 'Comments' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/support', label: 'Support' },
  { to: '/admin/blocked-users', label: 'Blocked Users' },
  { to: '/admin/notifications', label: 'Notifications', badge: true },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/activity-logs', label: 'Activity Logs' },
  { to: '/admin/profile', label: 'Admin Profile' },
  { to: '/admin/settings', label: 'Admin Settings' },
];

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await adminService.getUnreadNotificationCount();
      setUnreadCount(res.count || 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  usePolling(fetchUnreadCount, 4000, true);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">{BRAND.name} Admin</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Moderation & Support</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`
            }
          >
            <span>{item.label}</span>
            {item.badge && unreadCount > 0 && (
              <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Admin Home
        </button>
        <p className="text-[10px] text-slate-400 truncate px-1">{user?.email}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 lg:hidden flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <button type="button" onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="font-bold text-sm">Admin Dashboard</span>
        <div className="flex items-center gap-2">
          <AdminNotificationBell onCountChange={setUnreadCount} />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {sidebarContent}
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-xl">{sidebarContent}</aside>
          </div>
        )}

        <main className="flex-1 lg:pl-64 min-h-screen">
          <div className="hidden lg:flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
            <AdminSearch />
            <div className="flex items-center gap-3">
              <AdminNotificationBell onCountChange={setUnreadCount} />
              <ThemeToggle />
              <button type="button" onClick={handleLogout} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                Log Out
              </button>
            </div>
          </div>
          <div className="lg:hidden px-4 pt-3">
            <AdminSearch />
          </div>
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <Outlet context={{ refreshNotificationCount: fetchUnreadCount }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
