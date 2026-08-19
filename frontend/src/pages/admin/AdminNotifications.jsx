import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { AdminPagination } from '../../components/admin/AdminPagination';
import { Button } from '../../components/ui/Button';

const TYPE_ICONS = {
  report: '🚩',
  support: '🎫',
  user_reply: '💬',
  system: '⚙️',
  moderation: '🛡️',
};

export const AdminNotifications = () => {
  const navigate = useNavigate();
  const { refreshNotificationCount } = useOutletContext() || {};
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getNotifications({ page, limit: 30 });
      setData(res.data || []);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = async (notification) => {
    if (!notification.isRead) {
      await adminService.markNotificationRead(notification.id);
      setData((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      refreshNotificationCount?.();
    }

    if (notification.relatedType === 'report' && notification.relatedId) {
      navigate(`/admin/reports?report=${notification.relatedId}`);
      return;
    }
    if (notification.relatedType === 'support' && notification.relatedId) {
      navigate(`/admin/support?ticket=${notification.relatedId}`);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await adminService.markAllNotificationsRead();
      setData((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshNotificationCount?.();
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = data.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">Notifications</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Admin alerts for reports, support, and moderation</p>
        </div>
        {unreadCount > 0 && (
          <Button type="button" variant="secondary" size="sm" onClick={handleMarkAllRead} disabled={markingAll}>
            {markingAll ? 'Updating...' : 'Mark All as Read'}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <div className="space-y-2">
          {data.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleOpen(n)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                n.isRead
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                  : 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</p>
                    {!n.isRead && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-white">New</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{n.message}</p>
                  {n.metadata?.reason && (
                    <p className="text-[10px] text-slate-500 mt-1 capitalize">Reason: {n.metadata.reason.replace(/_/g, ' ')}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  {(n.relatedType === 'report' || n.relatedType === 'support') && (
                    <span className="inline-block mt-2 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                      {n.relatedType === 'report' ? 'View Report →' : 'View Ticket →'}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {!data.length && <p className="text-sm text-slate-400">No admin notifications yet.</p>}
        </div>
      )}
      <AdminPagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default AdminNotifications;
