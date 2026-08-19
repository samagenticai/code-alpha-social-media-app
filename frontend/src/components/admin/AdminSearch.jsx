import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';

export const AdminSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return undefined;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminService.search(query.trim());
        setResults(res.results || {});
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const go = (path) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const hasResults = results && Object.values(results).some((arr) => arr?.length > 0);

  return (
    <div className="relative w-full max-w-md">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder="Search user ID, @username, post/reel/report ID..."
        className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
      />
      <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      {open && query.length >= 2 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 z-50 max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2 text-sm">
            {loading && <p className="p-2 text-slate-400 text-xs">Searching...</p>}
            {!loading && !hasResults && <p className="p-2 text-slate-400 text-xs">No results for &quot;{query}&quot;</p>}
            {results?.users?.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase text-slate-400 px-2 mb-1">Users</p>
                {results.users.map((u) => (
                  <button key={u.id} type="button" onClick={() => go(`/admin/users?highlight=${u.id}`)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span className="font-semibold">@{u.username}</span>
                    <span className="text-slate-400"> · {u.fullName}</span>
                    <span className="block text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{u.id}</span>
                  </button>
                ))}
              </div>
            )}
            {results?.posts?.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase text-slate-400 px-2 mb-1">Posts</p>
                {results.posts.map((p) => (
                  <button key={p.id} type="button" onClick={() => go(`/admin/posts?highlight=${p.id}`)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span className="block truncate">@{p.author}: {p.content}</span>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{p.id}</span>
                  </button>
                ))}
              </div>
            )}
            {results?.reels?.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase text-slate-400 px-2 mb-1">Reels</p>
                {results.reels.map((r) => (
                  <button key={r.id} type="button" onClick={() => go(`/admin/reels?highlight=${r.id}`)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span className="block truncate">@{r.author}: {r.caption}</span>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{r.id}</span>
                  </button>
                ))}
              </div>
            )}
            {results?.reports?.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase text-slate-400 px-2 mb-1">Reports</p>
                {results.reports.map((r) => (
                  <button key={r.id} type="button" onClick={() => go(`/admin/reports?report=${r.id}`)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 capitalize">
                    <span>{r.reason?.replace(/_/g, ' ')} · {r.targetType} · {r.status}</span>
                    {r.reporter && <span className="block text-[10px] text-slate-400">By @{r.reporter}</span>}
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{r.id}</span>
                    {r.targetId && <span className="block text-[10px] font-mono text-slate-400">Target: {r.targetId}</span>}
                  </button>
                ))}
              </div>
            )}
            {results?.comments?.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase text-slate-400 px-2 mb-1">Comments</p>
                {results.comments.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => go(c.parentType === 'reel' ? `/admin/reels?highlight=${c.parentId}` : `/admin/posts?highlight=${c.parentId}`)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="block truncate">{c.text}</span>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{c.id}</span>
                  </button>
                ))}
              </div>
            )}
            {results?.tickets?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 px-2 mb-1">Support</p>
                {results.tickets.map((t) => (
                  <button key={t.id} type="button" onClick={() => go(`/admin/support?ticket=${t.id}`)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    #{t.ticketNumber} · {t.subject}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSearch;
