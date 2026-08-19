import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { AdminPagination } from '../../components/admin/AdminPagination';

export const AdminActivityLogs = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getActivityLogs({ page, limit: 30 });
      setData(res.data || []);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">Activity Logs</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Auditable record of admin moderation actions</p>
      {loading ? (
        <div className="animate-pulse h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Admin</th>
                <th className="p-3">Action</th>
                <th className="p-3 hidden sm:table-cell">Target</th>
                <th className="p-3">Description</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((log) => (
                <tr key={log.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-3">@{log.admin?.username || '—'}</td>
                  <td className="p-3 font-semibold capitalize">{log.action.replace(/_/g, ' ')}</td>
                  <td className="p-3 hidden sm:table-cell text-xs text-slate-400">{log.targetType} {log.targetId?.slice(-6)}</td>
                  <td className="p-3 text-xs">{log.description}</td>
                  <td className="p-3 text-xs text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default AdminActivityLogs;
