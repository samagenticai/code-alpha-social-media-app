import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconBell,
  IconHeart,
  IconMessage,
  IconBookmark,
  IconEye,
  IconFlame,
  IconCheck,
  IconTrash,
  IconSparkles,
  IconUser,
  IconUserPlus,
} from '../ui/Icons';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { notificationService } from '../../services/notificationService';
import { useNotificationsPolling } from '../../hooks/useNotificationsPolling';
import { NotificationSkeleton } from '../ui/Skeleton';

export const NotificationsView = ({
  onNavigateToPost,
  onNavigateToStory,
  onNavigateToMessages,
  onNavigateToReport,
  onRefreshUnreadCount,
  user,
  isGuest,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const handleSync = useCallback(({ notifications: nextNotifications, unreadCount, error }) => {
    if (error) {
      console.warn('Failed to load notifications:', error);
      setLoading(false);
      return;
    }

    if (Array.isArray(nextNotifications)) {
      setNotifications(nextNotifications);
    }
    if (typeof unreadCount === 'number') {
      onRefreshUnreadCount?.(unreadCount);
    }
    setLoading(false);
  }, [onRefreshUnreadCount]);

  useNotificationsPolling({
    onSync: handleSync,
    enabled: !isGuest,
  });

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onRefreshUnreadCount?.(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleMarkSingleRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n));
        onRefreshUnreadCount?.(next.filter((n) => !n.read).length);
        return next;
      });
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleDeleteSingle = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id && n._id !== id);
        onRefreshUnreadCount?.(next.filter((n) => !n.read).length);
        return next;
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      onRefreshUnreadCount?.(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'likes') return n.type === 'post_like' || n.type === 'story_like';
    if (filter === 'comments') return n.type === 'post_comment';
    if (filter === 'messages') return n.type === 'message';
    if (filter === 'stories') return n.type === 'story_view' || n.type === 'story_like';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationDetails = (n) => {
    switch (n.type) {
      case 'post_like':
        return {
          icon: IconHeart,
          colorClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
          label: 'liked your post',
        };
      case 'post_comment':
        return {
          icon: IconMessage,
          colorClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
          label: 'commented on your post',
        };
      case 'post_save':
        return {
          icon: IconBookmark,
          colorClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          label: 'saved your post',
        };
      case 'story_view':
        return {
          icon: IconEye,
          colorClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          label: 'viewed your story',
        };
      case 'story_like':
        return {
          icon: IconFlame,
          colorClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          label: 'liked your story',
        };
      case 'message':
        return {
          icon: IconMessage,
          colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          label: 'sent you a message',
        };
      case 'follow':
        return {
          icon: IconUserPlus,
          colorClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
          label: 'started following you',
        };
      case 'follow_request':
        return {
          icon: IconUserPlus,
          colorClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          label: 'sent you a follow request',
        };
      case 'follow_accepted':
        return {
          icon: IconCheck,
          colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          label: 'accepted your follow request',
        };
      case 'report_reply':
        return {
          icon: IconMessage,
          colorClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          label: 'replied to your report',
        };
      case 'report_resolved':
        return {
          icon: IconCheck,
          colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          label: 'resolved your report',
        };
      case 'report_rejected':
      case 'report_status':
        return {
          icon: IconBell,
          colorClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          label: n.type === 'report_rejected' ? 'reviewed your report' : 'updated your report status',
        };
      default:
        return {
          icon: IconBell,
          colorClass: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
          label: 'interacted with your activity',
        };
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleNotificationClick = async (notification, e) => {
    const id = notification.id || notification._id;
    if (!notification.read) {
      await handleMarkSingleRead(id, e);
    }

    const reportTypes = ['report_reply', 'report_resolved', 'report_rejected', 'report_status'];
    if (reportTypes.includes(notification.type) && notification.reportId) {
      onNavigateToReport?.(notification.reportId);
      return;
    }
    if (notification.type === 'message') {
      onNavigateToMessages?.();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-12">
      {/* Header Section Card */}
      <div className="relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-indigo-950/80 border border-slate-800 text-white shadow-xl backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-1">
              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
                <IconBell className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  Activity Notifications
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Stay updated with likes, comments, stories & messages
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
              >
                <IconCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
              >
                <IconTrash className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All' },
          { id: 'likes', label: 'Likes' },
          { id: 'comments', label: 'Comments' },
          { id: 'messages', label: 'Messages' },
          { id: 'stories', label: 'Stories' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === tab.id
                ? 'bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <NotificationSkeleton />
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-center rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2 sm:mb-4 shadow-inner">
            <IconBell className="w-6 h-6 sm:w-8 sm:h-8 opacity-40" />
          </div>
          <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            No Notifications Yet
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xs sm:max-w-sm">
            When creators like your posts, view your stories, comment, or send direct messages, updates will appear right here!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notification) => {
              const details = getNotificationDetails(notification);
              const TypeIcon = details.icon;

              return (
                <motion.div
                  key={notification.id || notification._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => handleNotificationClick(notification, e)}
                  className={`group relative flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer ${
                    !notification.read
                      ? 'bg-gradient-to-r from-brand-500/10 via-cyan-500/5 to-transparent dark:from-cyan-500/10 dark:via-cyan-950/20 border-brand-500/30 dark:border-cyan-500/30 shadow-md shadow-cyan-500/5'
                      : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 pr-2">
                    {/* User Avatar with Badge Icon */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={notification.sender?.avatar}
                        alt={notification.sender?.name}
                        size="sm"
                        className="sm:!w-10 sm:!h-10"
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 p-0.5 sm:p-1 rounded-full border border-white dark:border-slate-900 shadow-sm ${details.colorClass}`}
                      >
                        <TypeIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Notification Main Text */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {notification.sender?.name || 'User'}
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                          {details.label}
                        </span>
                      </div>

                      {/* Comment or Message Preview Text if available */}
                      {notification.text && (
                        <p className="mt-0.5 text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-1 italic bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 w-fit">
                          "{notification.text}"
                        </p>
                      )}

                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Unread Indicator */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {!notification.read && (
                      <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 animate-pulse" />
                    )}

                    <button
                      onClick={(e) => handleDeleteSingle(notification.id || notification._id, e)}
                      title="Delete notification"
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 sm:p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg sm:rounded-xl transition-all"
                    >
                      <IconTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
