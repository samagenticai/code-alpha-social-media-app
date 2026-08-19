import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { AdminPagination } from '../../components/admin/AdminPagination';
import { Avatar } from '../../components/ui/Avatar';

export const AdminComments = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getComments({ page, limit: 20, search });
      setData(res.data || []);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (item) => {
    if (!window.confirm('Remove this comment?')) return;
    await adminService.removeComment({
      parentType: item.parentType,
      parentId: item.parentId,
      commentId: item.commentId,
    });
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">Comments</h2>
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search comments..."
        className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
      />
      {loading ? (
        <div className="animate-pulse h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <div className="space-y-3">
          {data.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <Avatar src={c.author?.avatar} alt={c.author?.name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{c.author?.name || 'Unknown'}</p>
                    <p className="text-sm mt-1">{c.text}</p>
                    <p className="text-xs text-slate-400 mt-2 capitalize">
                      On {c.parentType}: {c.parentPreview || c.parentId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(c)}
                  className="text-xs font-bold px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 flex-shrink-0"
                >
                  Remove
                </button>
              </div>
              <div className="flex gap-3 mt-2 text-xs text-slate-400">
                <span>{c.likesCount} likes</span>
                <span>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <AdminPagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default AdminComments;
