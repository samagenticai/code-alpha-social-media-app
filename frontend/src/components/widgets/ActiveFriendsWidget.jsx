import React, { useState, useEffect } from 'react';
import { Avatar } from '../ui/Avatar';
import { IconMessage } from '../ui/Icons';
import { userService } from '../../services/userService';

const FALLBACK_ONLINE_USERS = [
  {
    id: 'onl_1',
    name: 'Sarah Jenkins',
    username: 'sarahj',
    title: 'Product Designer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    activity: 'Active in Design',
  },
  {
    id: 'onl_2',
    name: 'David Kim',
    username: 'davidk',
    title: 'iOS Developer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    activity: 'Coding live',
  },
  {
    id: 'onl_3',
    name: 'Aria Taylor',
    username: 'ariadev',
    title: 'AI Researcher',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    activity: 'Online now',
  },
];

export const ActiveFriendsWidget = ({ onOpenMessages, isGuest, onRequireAuth }) => {
  const [onlineUsers, setOnlineUsers] = useState(FALLBACK_ONLINE_USERS);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userService.getSuggestedUsers();
        const list = res.users || res.data || [];
        if (list.length > 0) {
          const formatted = list.slice(0, 3).map((u, idx) => ({
            id: u.id || u._id,
            name: u.fullName || u.name,
            username: (u.username || u.handle || '').replace('@', ''),
            title: u.title || 'Creator',
            avatar: u.profileImage || u.avatar || FALLBACK_ONLINE_USERS[idx]?.avatar,
            activity: idx === 0 ? 'Active in Design' : idx === 1 ? 'Coding live' : 'Online now',
          }));
          setOnlineUsers(formatted);
        }
      } catch {
        // fallback
      }
    };
    fetchUsers();
  }, []);

  const handleMessageClick = (user) => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    onOpenMessages?.(user);
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              Active Creators
            </h3>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block">
              Online Now
            </span>
          </div>
        </div>

        <span className="w-2 h-2 rounded-full bg-emerald-500" />
      </div>

      {/* Online list */}
      <div className="space-y-2">
        {onlineUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  size="sm"
                  className="!w-8 !h-8 ring-2 ring-emerald-500/30"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-cyan-400 transition-colors">
                  {user.name}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {user.activity}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleMessageClick(user)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-600 hover:text-white dark:hover:bg-cyan-500 dark:hover:text-slate-950 transition-all cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
              title={`Message ${user.name}`}
            >
              <IconMessage className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
