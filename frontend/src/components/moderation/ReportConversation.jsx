import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { getReportStatusLabel } from '../moderation/ReportModal';

const formatTime = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export const ReportConversation = ({
  report,
  loadMessages,
  sendMessage,
  isAdmin = false,
  disabled = false,
  onReportUpdate,
}) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reportMeta, setReportMeta] = useState(report);
  const scrollRef = useRef(null);

  const reportId = report?.id || report?._id;

  const loadMessagesRef = useRef(loadMessages);
  loadMessagesRef.current = loadMessages;

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const onReportUpdateRef = useRef(onReportUpdate);
  onReportUpdateRef.current = onReportUpdate;

  useEffect(() => {
    setReportMeta(report);
  }, [report]);

  const fetchMessages = useCallback(async (isInitial = false) => {
    if (!reportId) return;
    if (isInitial) setLoading(true);
    try {
      if (typeof loadMessagesRef.current === 'function') {
        const res = await loadMessagesRef.current(reportId);
        const list = res.messages || res.data || [];
        setMessages(list);

        if (res.report && res.report.status !== reportMeta?.status) {
          setReportMeta(res.report);
          onReportUpdateRef.current?.(res.report);
        }
      }
    } catch (err) {
      console.error('Failed to load report messages:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [reportId, reportMeta?.status]);

  useEffect(() => {
    fetchMessages(true);
  }, [reportId]);

  usePolling(() => fetchMessages(false), 4000, Boolean(reportId));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() || sending || disabled || !reportId) return;
    setSending(true);
    try {
      if (typeof sendMessageRef.current === 'function') {
        const res = await sendMessageRef.current(reportId, text.trim());
        if (res.message) {
          setMessages((prev) => [...prev, res.message]);
        } else {
          await fetchMessages(false);
        }
        setText('');
      }
    } catch (err) {
      console.error('Failed to send report message:', err);
    } finally {
      setSending(false);
    }
  };

  if (!reportMeta) return null;

  const isClosed = ['resolved', 'rejected'].includes(reportMeta.status);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
        <p className="text-xs font-bold text-slate-900 dark:text-white">
          Report #{reportMeta.reportNumber || reportId?.slice(-6).toUpperCase()} · {getReportStatusLabel(reportMeta.status)}
        </p>
        <p className="text-[10px] text-slate-500 capitalize">
          {reportMeta.reasonLabel || reportMeta.reason?.replace(/_/g, ' ')} · {reportMeta.targetType || 'Post'}
        </p>
      </div>

      <div ref={scrollRef} className="max-h-60 sm:max-h-72 overflow-y-auto p-3 space-y-2.5">
        {loading && messages.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-slate-400 animate-pulse">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <p className="text-xs">No messages in this report yet.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = isAdmin ? msg.senderRole === 'admin' : msg.senderRole === 'user';
            return (
              <div key={msg.id || msg._id || Math.random()} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  isSelf
                    ? 'bg-brand-600 text-white dark:bg-cyan-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {!isSelf && <Avatar src={msg.senderAvatar} alt={msg.senderName} size="xs" className="!w-4 !h-4" />}
                    <span className={`text-[10px] font-bold ${isSelf ? 'text-white/90' : 'text-slate-500'}`}>
                      {msg.senderRole === 'admin' ? 'Support Admin' : msg.senderName || 'User'}
                    </span>
                  </div>
                  <p className="text-xs whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={`text-[9px] mt-1 ${isSelf ? 'text-white/70' : 'text-slate-400'}`}>{formatTime(msg.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isClosed && !disabled && (
        <form onSubmit={handleSend} className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-white/50 dark:bg-slate-900/50">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isAdmin ? 'Reply to user...' : 'Add more details...'}
            className="flex-1 min-w-0 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
          />
          <Button type="submit" variant="primary" size="sm" disabled={sending || !text.trim()} className="!px-3.5 flex-shrink-0">
            {sending ? '...' : 'Send'}
          </Button>
        </form>
      )}

      {isClosed && (
        <p className="px-3.5 py-2 text-[10px] font-medium text-slate-400 border-t border-slate-200 dark:border-slate-800 text-center bg-slate-100/50 dark:bg-slate-900/50">
          This report is closed. Conversation is read-only.
        </p>
      )}
    </div>
  );
};

export default ReportConversation;
