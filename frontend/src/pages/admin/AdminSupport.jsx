import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { AdminPagination } from '../../components/admin/AdminPagination';

const STATUS_OPTIONS = ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'];

export const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getSupportTickets({ page, limit: 20 });
      setTickets(res.data || []);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openTicket = async (id) => {
    const res = await adminService.getSupportTicket(id);
    setSelected(res.ticket);
  };

  const ticketId = selected?._id || selected?.id;

  const updateTicket = async (payload) => {
    if (!ticketId) return;
    await adminService.updateSupportTicket(ticketId, payload);
    const res = await adminService.getSupportTicket(ticketId);
    setSelected(res.ticket);
    load();
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    await updateTicket({ message: reply, status: 'in_progress' });
    setReply('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">Support</h2>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {loading ? <div className="animate-pulse h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" /> : tickets.map((t) => (
            <button key={t.id} type="button" onClick={() => openTicket(t.id)} className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/30">
              <p className="font-bold text-sm">#{t.ticketNumber} · {t.subject}</p>
              <p className="text-xs text-slate-400">@{t.user?.username} · {t.status.replace(/_/g, ' ')} · {t.priority}</p>
            </button>
          ))}
          {!loading && !tickets.length && <p className="text-sm text-slate-400">No support tickets yet.</p>}
          <AdminPagination pagination={pagination} onPageChange={setPage} />
        </div>
        {selected && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold">#{selected.ticketNumber} — {selected.subject}</h3>
            <p className="text-xs text-slate-400 capitalize">{selected.category?.replace(/_/g, ' ')} · @{selected.user?.username}</p>
            <div className="flex flex-wrap gap-2">
              <select value={selected.status} onChange={(e) => updateTicket({ status: e.target.value })} className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <select value={selected.priority || 'normal'} onChange={(e) => updateTicket({ priority: e.target.value })} className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {(selected.messages || []).map((m, i) => (
                <div key={i} className={`p-2 rounded-xl text-sm ${m.senderRole === 'admin' ? 'bg-cyan-500/10 ml-4' : 'bg-slate-100 dark:bg-slate-800 mr-4'}`}>
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">{m.senderRole === 'admin' ? 'Admin' : 'User'}</p>
                  {m.message}
                </div>
              ))}
            </div>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Admin reply..." className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={sendReply} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-cyan-500 text-white">Send Reply</button>
              <button type="button" onClick={() => updateTicket({ status: 'resolved' })} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700">Resolve</button>
              <button type="button" onClick={() => updateTicket({ status: 'closed' })} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
