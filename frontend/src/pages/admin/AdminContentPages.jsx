import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { AdminPagination } from '../../components/admin/AdminPagination';
import { Avatar } from '../../components/ui/Avatar';

const ContentPage = ({ type, title, fetchFn, removeFn, restoreFn }) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn({ page, limit: 20, search });
      setData(res.data || []);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, search, fetchFn]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this content?')) return;
    await removeFn(id, 'Removed by admin');
    load();
  };

  const handleRestore = async (id) => {
    await restoreFn(id);
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={`Search ${type}...`} className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
      {loading ? <div className="animate-pulse h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" /> : (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {item.author && <Avatar src={item.author.avatar} alt={item.author.fullName} size="sm" />}
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{item.author?.fullName || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">@{item.author?.username}</p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {item.isRemoved ? (
                    <button onClick={() => handleRestore(item.id)} className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600">Restore</button>
                  ) : (
                    <button onClick={() => handleRemove(item.id)} className="text-xs font-bold px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600">Remove</button>
                  )}
                </div>
              </div>
              <p className="text-sm mt-2 line-clamp-3">{item.content || item.caption}</p>
              {type === 'reels' && item.videoUrl && (
                <video src={item.videoUrl} controls poster={item.thumbnailUrl} className="mt-2 max-h-48 rounded-xl w-full" />
              )}
              {item.imageUrl && <img src={item.imageUrl} alt="" className="mt-2 max-h-40 rounded-xl object-cover" />}
              {Array.isArray(item.images) && item.images.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {item.images.slice(0, 4).map((img, i) => (
                    <img key={i} src={typeof img === 'string' ? img : img.url} alt="" className="h-20 w-20 rounded-lg object-cover flex-shrink-0" />
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-2 text-xs text-slate-400">
                <span>{item.likesCount} likes</span>
                <span>{item.commentsCount} comments</span>
                {item.reportsCount > 0 && <span className="text-rose-500">{item.reportsCount} reports</span>}
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <AdminPagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export const AdminPosts = () => (
  <ContentPage type="posts" title="Posts" fetchFn={adminService.getPosts} removeFn={adminService.removePost} restoreFn={adminService.restorePost} />
);

export const AdminReels = () => (
  <ContentPage type="reels" title="Reels / Videos" fetchFn={adminService.getReels} removeFn={adminService.removeReel} restoreFn={adminService.restoreReel} />
);

export default AdminPosts;
