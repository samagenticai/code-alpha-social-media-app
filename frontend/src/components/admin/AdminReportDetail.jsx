import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { AdminIdLink } from './AdminIdLink';
import { ReportTargetPreview } from './ReportTargetPreview';
import { ReportConversation } from '../moderation/ReportConversation';
import { Button } from '../ui/Button';
import { adminService } from '../../services/adminService';

const UserIdentityBlock = ({ title, user }) => {
  if (!user) return null;
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
      <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">{title}</p>
      <div className="flex items-center gap-2">
        <Avatar src={user.avatar} alt={user.fullName} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.fullName}</p>
          <p className="text-xs text-slate-500">{user.handle || `@${user.username}`}</p>
          {user.email && <p className="text-[10px] text-slate-400 truncate">{user.email}</p>}
          <p className="text-[10px] text-slate-400 mt-0.5">
            User ID: <AdminIdLink id={user.id} type="user" />
          </p>
        </div>
      </div>
    </div>
  );
};

export const AdminReportDetail = ({ report, adminNote, onAdminNoteChange, onUpdate, onClose }) => {
  const navigate = useNavigate();
  if (!report) return null;

  const viewContent = () => {
    const { targetType, targetId, targetPreview, reportedUser } = report;
    if (targetType === 'user' && targetId) {
      navigate(`/admin/users?highlight=${targetId}`);
      return;
    }
    if (reportedUser?.id) {
      navigate(`/admin/users?highlight=${reportedUser.id}`);
      return;
    }
    if (targetType === 'post' && targetId) {
      navigate(`/admin/posts?highlight=${targetId}`);
      return;
    }
    if (targetType === 'reel' && targetId) {
      navigate(`/admin/reels?highlight=${targetId}`);
      return;
    }
    if (targetType === 'comment' && targetPreview?.parentId) {
      const path = targetPreview.parentType === 'reel'
        ? `/admin/reels?highlight=${targetPreview.parentId}`
        : `/admin/posts?highlight=${targetPreview.parentId}`;
      navigate(path);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 sticky top-4 max-h-[85vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-lg">Report #{report.reportNumber || report.id?.slice(-6).toUpperCase()}</h3>
          <p className="text-[10px] font-mono text-slate-400">Report ID: <AdminIdLink id={report.id} type="report" /></p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 capitalize shrink-0">
          {report.status?.replace(/_/g, ' ')}
        </span>
      </div>

      <UserIdentityBlock title="Reporter" user={report.reporter} />
      {report.reportedUser && report.reportedUser.id !== report.reporter?.id && (
        <UserIdentityBlock title="Reported User" user={report.reportedUser} />
      )}

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase text-slate-500">Target</p>
        <p className="text-xs capitalize">
          Type: <span className="font-bold">{report.targetType}</span>
          {report.targetId && (
            <> · Content ID: <AdminIdLink id={report.targetId} type={report.targetType === 'user' ? 'user' : report.targetType} meta={report.targetPreview} /></>
          )}
        </p>
        <ReportTargetPreview preview={report.targetPreview} targetType={report.targetType} targetId={report.targetId} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-500">Reason</p>
          <p className="font-semibold">{report.reasonLabel || report.reason?.replace(/_/g, ' ')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-500">Priority</p>
          <p className="font-semibold capitalize">{report.priority}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">Submitted</p>
          <p>{report.createdAt ? new Date(report.createdAt).toLocaleString() : '—'}</p>
        </div>
      </div>

      {report.description && (
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Description</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{report.description}</p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Conversation</p>
        <ReportConversation
          report={report}
          isAdmin
          loadMessages={adminService.getReportMessages.bind(adminService)}
          sendMessage={adminService.sendReportMessage.bind(adminService)}
        />
      </div>

      <textarea
        value={adminNote}
        onChange={(e) => onAdminNoteChange?.(e.target.value)}
        rows={3}
        placeholder="Admin note (private)..."
        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
      />

      <div className="flex flex-wrap gap-1">
        <Button type="button" variant="secondary" size="sm" onClick={viewContent}>View Content</Button>
        {report.reporter?.id && (
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/admin/users?highlight=${report.reporter.id}`)}>View Reporter</Button>
        )}
        {report.reportedUser?.id && (
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/admin/users?highlight=${report.reportedUser.id}`)}>View Reported User</Button>
        )}
        {report.status === 'pending' && (
          <button type="button" onClick={() => onUpdate?.(report.id, { status: 'in_review' })} className="text-xs font-bold px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-600">Mark In Review</button>
        )}
        <button type="button" onClick={() => onUpdate?.(report.id, { status: 'resolved', adminNote }, 'Resolve this report?')} className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600">Resolve</button>
        <button type="button" onClick={() => onUpdate?.(report.id, { status: 'rejected', adminNote }, 'Reject this report?')} className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-500/10 text-slate-600">Reject</button>
        <button type="button" onClick={() => onUpdate?.(report.id, { priority: 'high' })} className="text-xs font-bold px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600">High Priority</button>
      </div>

      {onClose && (
        <button type="button" onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
      )}
    </div>
  );
};

export default AdminReportDetail;
