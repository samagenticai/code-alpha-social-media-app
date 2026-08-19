import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBell } from '../ui/Icons';
import { adminService } from '../../services/adminService';
import { usePolling } from '../../hooks/usePolling';
import { Button } from '../ui/Button';

const TYPE_LABELS = {
  report: 'New Report',
  support: 'Support Ticket',
  user_reply: 'User Reply',
  moderation: 'High Priority Report',
  system: 'System Notification',
};

const TYPE_ICONS = {
  report: '🚩',
  support: '🎫',
  user_reply: '💬',
  moderation: '🛡️',
  system: '⚙️',
};

const formatTimeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
};

export const AdminNotificationBell = ({ onCountChange }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await adminService.getUnreadNotificationCount();
      setUnreadCount(res.count || 0);
      onCountChange?.(res.count || 0);
    } catch {
      setUnreadCount(0);
    }
  }, [onCountChange]);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getNotifications({ recent: true, limit: 10 });
      setNotifications(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchUnreadCount, 4000, true);

  useEffect(() => {
    if (open) loadRecent();
  }, [open, loadRecent]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleOpenNotification = async (n) => {
    if (!n.isRead) {
      await adminService.markNotificationRead(n.id);
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
      setUnreadCount((c) => Math.max(0, c - 1));
      onCountChange?.(Math.max(0, unreadCount - 1));
      fetchUnreadCount();
    }
    setOpen(false);
    if (n.relatedType === 'report' && n.relatedId) {
      navigate(`/admin/reports?report=${n.relatedId}`);
    } else if (n.relatedType === 'support' && n.relatedId) {
      navigate(`/admin/support?ticket=${n.relatedId}`);
    } else {
      navigate('/admin/notifications');
    }
  };

  const handleMarkAllRead = async () => {
    await adminService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    onCountChange?.(0);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <IconBell className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-xs text-slate-400 animate-pulse">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-xs text-slate-400">No notifications</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleOpenNotification(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                    !n.isRead ? 'bg-cyan-50/40 dark:bg-cyan-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title || TYPE_LABELS[n.type]}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatTimeAgo(n.createdAt)}</p>
                      {(n.relatedType === 'report' || n.relatedType === 'support') && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                          View {n.relatedType === 'report' ? 'Report' : 'Ticket'} →
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" size="sm" className="w-full !text-xs" onClick={() => { setOpen(false); navigate('/admin/notifications'); }}>
              View all notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;
