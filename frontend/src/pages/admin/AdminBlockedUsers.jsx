import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { AdminPagination } from '../../components/admin/AdminPagination';
import { Avatar } from '../../components/ui/Avatar';

export const AdminBlockedUsers = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getBlockedUsers({ page, limit: 20 });
      setData(res.data || []);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleUnblock = async (id) => {
    if (!window.confirm('Unblock this user?')) return;
    await adminService.unblockUser(id);
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">Blocked Users</h2>
      {loading ? (
        <div className="animate-pulse h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <div className="space-y-3">
          {data.map((u) => (
            <div key={u.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Avatar src={u.profileImage} alt={u.fullName} size="sm" />
                  <div>
                    <p className="font-bold text-sm">{u.fullName}</p>
                    <p className="text-xs text-slate-400">@{u.username}</p>
                    <p className="text-xs text-rose-500 capitalize mt-1">{u.accountStatus}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(u.id)}
                  className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600"
                >
                  Unblock
                </button>
              </div>
              {u.blockReason && <p className="text-xs text-slate-500 mt-2">Reason: {u.blockReason}</p>}
              <div className="text-xs text-slate-400 mt-2">
                {u.blockedAt && <span>Blocked {new Date(u.blockedAt).toLocaleDateString()}</span>}
                {u.blockedBy && <span> · by @{u.blockedBy.username}</span>}
              </div>
            </div>
          ))}
          {!data.length && <p className="text-sm text-slate-400">No blocked users.</p>}
        </div>
      )}
      <AdminPagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default AdminBlockedUsers;
