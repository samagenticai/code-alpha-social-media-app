import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

const Bar = ({ label, value, max }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-slate-400">{value?.toLocaleString?.() ?? value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.getAnalytics()
      .then((res) => setData(res.analytics))
      .catch((err) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />;
  if (error) return <div className="p-4 rounded-xl bg-rose-500/10 text-rose-600 text-sm">{error}</div>;

  const maxContent = Math.max(data.content.posts, data.content.reels, data.content.comments, data.content.likes, 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform metrics from MongoDB</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm">User Growth</h3>
          <Bar label="Total Users" value={data.userGrowth.total} max={data.userGrowth.total} />
          <Bar label="New Users (7 days)" value={data.userGrowth.newLast7Days} max={data.userGrowth.total} />
        </section>

        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm">Content</h3>
          <Bar label="Posts" value={data.content.posts} max={maxContent} />
          <Bar label="Reels" value={data.content.reels} max={maxContent} />
          <Bar label="Comments" value={data.content.comments} max={maxContent} />
          <Bar label="Likes" value={data.content.likes} max={maxContent} />
        </section>

        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm">Moderation</h3>
          <Bar label="Open Reports" value={data.moderation.openReports} max={Math.max(data.moderation.openReports, data.moderation.resolvedReports, 1)} />
          <Bar label="Resolved Reports" value={data.moderation.resolvedReports} max={Math.max(data.moderation.openReports, data.moderation.resolvedReports, 1)} />
        </section>

        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm">Support Tickets</h3>
          <Bar label="Open / In Progress" value={data.support.open} max={Math.max(data.support.open, data.support.closed, 1)} />
          <Bar label="Resolved / Closed" value={data.support.closed} max={Math.max(data.support.open, data.support.closed, 1)} />
        </section>
      </div>
    </div>
  );
};

export default AdminAnalytics;
