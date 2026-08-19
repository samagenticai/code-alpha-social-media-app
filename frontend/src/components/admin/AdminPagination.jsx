export const AdminPagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">Page {page} of {totalPages} ({total} total)</p>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40">Previous</button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
};

export default AdminPagination;
