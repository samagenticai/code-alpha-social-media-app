import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { AdminPagination } from '../../components/admin/AdminPagination';
import { AdminReportDetail } from '../../components/admin/AdminReportDetail';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export const AdminReports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getReports({ page, limit: 20, status, priority, search });
      setData(res.data || []);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, status, priority, search]);

  useEffect(() => { load(); }, [load]);

  const openReport = async (r) => {
    try {
      const res = await adminService.getReport(r.id);
      setSelected(res.report);
      setAdminNote(res.report?.adminNote || '');
      setSearchParams({ report: r.id }, { replace: true });
    } catch {
      setSelected(r);
      setAdminNote(r.adminNote || '');
    }
  };

  useEffect(() => {
    const reportId = searchParams.get('report');
    if (reportId && (!selected || selected.id !== reportId)) {
      adminService.getReport(reportId).then((res) => {
        setSelected(res.report);
        setAdminNote(res.report?.adminNote || '');
      }).catch(() => {});
    }
  }, [searchParams]);

  const updateReport = async (id, payload, confirmLabel) => {
    if (confirmLabel) {
      setConfirmMessage('');
      setConfirmAction({ id, payload, label: confirmLabel });
      return;
    }
    await adminService.updateReport(id, payload);
    load();
    const detail = await adminService.getReport(id);
    setSelected(detail.report);
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    const payload = { ...confirmAction.payload };
    if (confirmMessage.trim()) payload.message = confirmMessage.trim();
    await adminService.updateReport(confirmAction.id, payload);
    setConfirmAction(null);
    setConfirmMessage('');
    load();
    const detail = await adminService.getReport(confirmAction.id);
    setSelected(detail.report);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">Reports</h2>

      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by user ID, username, content ID, report reason..."
          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
        />
        <Button type="submit" variant="secondary" size="sm">Search</Button>
        {search && (
          <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>Clear</Button>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          <option value="">All priorities</option>
          <option value="high">High Priority</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {loading ? <div className="animate-pulse h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" /> : data.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => openReport(r)}
              className={`w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-colors ${
                selected?.id === r.id ? 'border-cyan-500' : 'border-slate-200 dark:border-slate-800 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-sm">#{r.reportNumber} · {r.reasonLabel || r.reason?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-400 capitalize">{r.targetType} · By @{r.reporter?.username}</p>
                  {r.targetId && <p className="text-[10px] font-mono text-slate-400 truncate">Target: {r.targetId}</p>}
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">{r.status?.replace(/_/g, ' ')}</span>
              </div>
              {r.priority === 'high' && <span className="text-[10px] font-bold text-rose-500">High Priority</span>}
            </button>
          ))}
          {!loading && !data.length && <p className="text-sm text-slate-400">No reports found.</p>}
          <AdminPagination pagination={pagination} onPageChange={setPage} />
        </div>

        {selected && (
          <AdminReportDetail
            report={selected}
            adminNote={adminNote}
            onAdminNoteChange={setAdminNote}
            onUpdate={updateReport}
            onClose={() => { setSelected(null); setSearchParams({}, { replace: true }); }}
          />
        )}
      </div>

      <Modal isOpen={Boolean(confirmAction)} onClose={() => { setConfirmAction(null); setConfirmMessage(''); }} title="Confirm Action" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">{confirmAction?.label}</p>
          <textarea
            value={confirmMessage}
            onChange={(e) => setConfirmMessage(e.target.value)}
            rows={3}
            placeholder="Optional message to send to the user..."
            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setConfirmAction(null); setConfirmMessage(''); }}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={runConfirmedAction}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminReports;
