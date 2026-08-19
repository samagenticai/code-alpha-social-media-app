import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { followRequestService } from '../../services/followRequestService';
import { useFollowRequestsPolling } from '../../hooks/useFollowRequestsPolling';

const formatRequestDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const getRequestId = (request) => request?.id || request?._id;

export const FollowRequestsView = ({ onCountChange }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const hasLoadedRef = useRef(false);

  const handleSync = useCallback(({ requests: nextRequests, count, error: syncError }) => {
    if (syncError) {
      if (!hasLoadedRef.current) {
        setError(syncError);
      }
      if (hasLoadedRef.current) {
        setLoading(false);
      }
      return;
    }

    setRequests(nextRequests || []);
    if (typeof count === 'number') {
      onCountChange?.(count);
    }
    setError('');
    hasLoadedRef.current = true;
    setLoading(false);
  }, [onCountChange]);

  useFollowRequestsPolling({ onSync: handleSync, enabled: true });

  const refetchRequests = useCallback(async () => {
    try {
      const res = await followRequestService.getFollowRequests();
      setRequests(res.requests || []);
      onCountChange?.(res.count || 0);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load follow requests.');
    }
  }, [onCountChange]);

  const handleAccept = async (requestId) => {
    const previous = requests;
    setActionId(requestId);
    setError('');

    setRequests((prev) => {
      const next = prev.filter((r) => getRequestId(r) !== requestId);
      onCountChange?.(next.length);
      return next;
    });

    try {
      await followRequestService.acceptRequest(requestId);
      await refetchRequests();
    } catch (err) {
      setRequests(previous);
      onCountChange?.(previous.length);
      setError(err.message || 'Failed to accept request.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (requestId) => {
    const previous = requests;
    setActionId(requestId);
    setError('');

    setRequests((prev) => {
      const next = prev.filter((r) => getRequestId(r) !== requestId);
      onCountChange?.(next.length);
      return next;
    });

    try {
      await followRequestService.rejectRequest(requestId);
      await refetchRequests();
    } catch (err) {
      setRequests(previous);
      onCountChange?.(previous.length);
      setError(err.message || 'Failed to reject request.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn max-w-2xl mx-auto w-full">
      <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">Follow Requests</h2>
        <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review and manage users who want to follow you.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel h-20 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="glass-panel p-5 rounded-2xl border border-red-200 dark:border-red-900/50 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button type="button" variant="secondary" size="sm" onClick={refetchRequests} className="mt-3 font-bold">
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No pending follow requests.</p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((request) => {
            const user = request.requester || {};
            const username = (user.username || '').replace('@', '');
            const requestId = getRequestId(request);
            const isBusy = actionId === requestId;

            return (
              <motion.div
                key={requestId}
                layout
                className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
              >
                <div
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => navigate(`/profile/${username.toLowerCase()}`)}
                >
                  <Avatar src={user.avatar || user.profileImage} alt={user.fullName} size="md" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.fullName || user.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{username}</p>
                    {user.title && (
                      <p className="text-[11px] text-brand-600 dark:text-cyan-400 truncate mt-0.5">{user.title}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatRequestDate(request.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleAccept(requestId)}
                    className="flex-1 sm:flex-none font-bold text-xs"
                  >
                    {isBusy ? 'Accepting...' : 'Accept'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleReject(requestId)}
                    className="flex-1 sm:flex-none font-bold text-xs"
                  >
                    {isBusy ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FollowRequestsView;
