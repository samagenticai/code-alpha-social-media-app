import React from 'react';
import { useNavigate } from 'react-router-dom';

const RESOURCE_ROUTES = {
  user: (id) => `/admin/users?highlight=${id}`,
  report: (id) => `/admin/reports?report=${id}`,
  post: (id) => `/admin/posts?highlight=${id}`,
  reel: (id) => `/admin/reels?highlight=${id}`,
  support: (id) => `/admin/support?ticket=${id}`,
  comment: (id, meta) => {
    if (meta?.parentType === 'reel' && meta?.parentId) return `/admin/reels?highlight=${meta.parentId}`;
    if (meta?.parentType === 'post' && meta?.parentId) return `/admin/posts?highlight=${meta.parentId}`;
    return `/admin/comments?highlight=${id}`;
  },
};

export const AdminIdLink = ({ id, type = 'user', label, meta, className = '' }) => {
  const navigate = useNavigate();
  if (!id) return <span className={`text-slate-400 ${className}`}>N/A</span>;

  const routeFn = RESOURCE_ROUTES[type];
  const path = routeFn ? routeFn(id, meta) : null;

  return (
    <button
      type="button"
      onClick={() => path && navigate(path)}
      className={`font-mono text-[11px] sm:text-xs text-cyan-600 dark:text-cyan-400 hover:underline break-all text-left ${className}`}
      title={`View ${type}`}
    >
      {label || id}
    </button>
  );
};

export default AdminIdLink;
