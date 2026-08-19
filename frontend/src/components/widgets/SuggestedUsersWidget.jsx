import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { FollowButton } from '../profile/FollowButton';
import { IconUsers, IconRefresh } from '../ui/Icons';
import { userService } from '../../services/userService';

export const SuggestedUsersWidget = ({ isGuest, onRequireAuth }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadSuggested = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await userService.getSuggestedUsers();
      if (res.success && Array.isArray(res.users || res.data)) {
        setUsers(res.users || res.data);
      }
    } catch (err) {
      console.error('Failed to load suggested users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSuggested();
  }, [loadSuggested]);

  const handleToggleFollow = async (targetUser) => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }

    const userId = targetUser.id || targetUser._id;
    const prevIsFollowing = targetUser.isFollowing;
    const prevPending = targetUser.followRequestPending;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => {
        if ((u.id || u._id) === userId) {
          if (targetUser.isPrivate && !prevIsFollowing) {
            return { ...u, followRequestPending: !prevPending };
          }
          return { ...u, isFollowing: !prevIsFollowing };
        }
        return u;
      })
    );

    try {
      const res = await userService.toggleFollowUser(userId);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => {
            if ((u.id || u._id) === userId) {
              return {
                ...u,
                isFollowing: res.isFollowing,
                followRequestPending: res.followRequestPending,
              };
            }
            return u;
          })
        );
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
      // Revert on error
      setUsers((prev) =>
        prev.map((u) => {
          if ((u.id || u._id) === userId) {
            return { ...u, isFollowing: prevIsFollowing, followRequestPending: prevPending };
          }
          return u;
        })
      );
    }
  };

  const handleUserClick = (username) => {
    if (username) {
      const clean = username.replace('@', '');
      navigate(`/profile/${clean}`);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-cyan-400 flex items-center justify-center">
            <IconUsers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            Who to Follow
          </h3>
        </div>

        <button
          type="button"
          onClick={() => loadSuggested(true)}
          disabled={refreshing}
          className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-cyan-400 transition-all cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Refresh suggestions"
        >
          <IconRefresh className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Suggested Users List */}
      <div className="space-y-3">
        {users.slice(0, 5).map((user) => {
          const uName = user.fullName || user.name || 'User';
          const uHandle = user.username || user.handle?.replace('@', '') || 'user';
          const avatarUrl = user.profileImage || user.avatar;
          const userJob = user.job || user.title || user.city;

          return (
            <div
              key={user.id || user._id}
              className="flex items-center justify-between gap-2 p-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group"
            >
              <div
                onClick={() => handleUserClick(uHandle)}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
              >
                <Avatar src={avatarUrl} size="sm" className="!w-9 !h-9 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-cyan-400 truncate block leading-tight">
                    {uName}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate block leading-tight mt-0.5">
                    @{uHandle}
                  </span>
                  {userJob && (
                    <span className="text-[10px] text-brand-600/80 dark:text-cyan-400/80 font-medium truncate block leading-tight">
                      {userJob}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                <FollowButton
                  isFollowing={user.isFollowing}
                  followRequestPending={user.followRequestPending}
                  onToggleFollow={() => handleToggleFollow(user)}
                  className="!px-3 !py-1 !text-[11px] !rounded-xl"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
