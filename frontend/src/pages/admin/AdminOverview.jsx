import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

const StatCard = ({ label, value, sub }) => (
  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{value ?? 0}</p>
    {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
  </div>
);

export const AdminOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.getDashboard()
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />;
  if (error) return <div className="p-4 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">{error}</div>;

  const { stats, recent } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Overview</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time platform statistics from MongoDB</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Users" value={stats.users.total} />
        <StatCard label="Active Users" value={stats.users.active} sub="Last 30 days" />
        <StatCard label="New Users" value={stats.users.new} sub="Last 7 days" />
        <StatCard label="Blocked Users" value={stats.users.blocked} />
        <StatCard label="Reported Users" value={stats.users.reported} />
        <StatCard label="Total Posts" value={stats.content.posts} />
        <StatCard label="Total Reels" value={stats.content.reels} />
        <StatCard label="Total Comments" value={stats.content.comments} />
        <StatCard label="Total Likes" value={stats.content.likes} />
        <StatCard label="Open Reports" value={stats.support.openReports} />
        <StatCard label="Pending Support" value={stats.support.pendingSupport} />
        <StatCard label="Resolved Reports" value={stats.support.resolvedReports} />
        <StatCard label="High Priority" value={stats.support.highPriorityReports} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm mb-3">Recent Users</h3>
          <div className="space-y-2">
            {(recent.users || []).map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span className="font-semibold">@{u.username}</span>
                <span className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm mb-3">Recent Reports</h3>
          <div className="space-y-2">
            {(recent.reports || []).map((r) => (
              <div key={r.id} className="text-sm">
                <span className="font-semibold capitalize">{r.reason.replace(/_/g, ' ')}</span>
                <span className="text-xs text-slate-400 ml-2">{r.status}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm mb-3">Recent Posts</h3>
          <div className="space-y-2">
            {(recent.posts || []).map((p) => (
              <div key={p.id} className="text-sm">
                <p className="font-semibold truncate">@{p.author?.username}</p>
                <p className="text-xs text-slate-400 truncate">{p.content}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm mb-3">Recent Support Tickets</h3>
          <div className="space-y-2">
            {(recent.supportTickets || []).map((t) => (
              <div key={t.id} className="text-sm">
                <span className="font-semibold">#{t.ticketNumber} · {t.subject}</span>
                <span className="text-xs text-slate-400 ml-2 capitalize">{t.status.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminOverview;
