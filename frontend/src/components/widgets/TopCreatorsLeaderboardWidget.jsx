import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/Badge';
import { userService } from '../../services/userService';

const FALLBACK_TOP_CREATORS = [
  {
    id: 'tc_1',
    rank: 1,
    badge: '🥇',
    name: 'Ahmad Shah',
    handle: '@ahmadshah',
    username: 'ahmadshah',
    title: 'Lead Architect',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    verified: true,
    points: '24.5k',
  },
  {
    id: 'tc_2',
    rank: 2,
    badge: '🥈',
    name: 'Elena Rostova',
    handle: '@elenarostova',
    username: 'elenarostova',
    title: 'UI/UX Director',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    verified: true,
    points: '19.2k',
  },
  {
    id: 'tc_3',
    rank: 3,
    badge: '🥉',
    name: 'Marcus Chen',
    handle: '@marcuschen',
    username: 'marcuschen',
    title: 'Full Stack Dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    verified: false,
    points: '15.8k',
  },
];

export const TopCreatorsLeaderboardWidget = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState(FALLBACK_TOP_CREATORS);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const res = await userService.getSuggestedUsers();
        const usersList = res.users || res.data || [];
        if (usersList.length >= 3) {
          const formatted = usersList.slice(0, 3).map((u, idx) => ({
            id: u.id || u._id,
            rank: idx + 1,
            badge: idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉',
            name: u.fullName || u.name,
            handle: u.username ? `@${u.username}` : (u.handle || '@user'),
            username: (u.username || u.handle || '').replace('@', ''),
            title: u.title || 'Creator',
            avatar: u.profileImage || u.avatar || FALLBACK_TOP_CREATORS[idx]?.avatar,
            verified: u.verified || false,
            points: `${(28 - idx * 5).toFixed(1)}k`,
          }));
          setCreators(formatted);
        }
      } catch {
        // use fallback
      }
    };
    fetchCreators();
  }, []);

  const handleUserClick = (username) => {
    if (username) {
      navigate(`/profile/${username.toLowerCase()}`);
    }
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
            🏆
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              Top Creators
            </h3>
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">
              Weekly Leaderboard
            </span>
          </div>
        </div>

        <span className="text-[10px] font-bold text-brand-600 dark:text-cyan-400 bg-brand-500/10 dark:bg-cyan-500/10 px-2 py-0.5 rounded-full">
          Top 3
        </span>
      </div>

      {/* Creator items */}
      <div className="space-y-2.5">
        {creators.map((c) => (
          <div
            key={c.id}
            onClick={() => handleUserClick(c.username)}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base flex-shrink-0">{c.badge}</span>
              <Avatar
                src={c.avatar}
                alt={c.name}
                size="sm"
                className="!w-8 !h-8 ring-2 ring-brand-500/20 group-hover:ring-brand-500 transition-all flex-shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1 group-hover:text-brand-600 dark:group-hover:text-cyan-400 transition-colors">
                  {c.name}
                  {c.verified && <VerifiedBadge className="w-3 h-3" />}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {c.title}
                </p>
              </div>
            </div>

            <div className="text-right flex-shrink-0 pl-2">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block font-mono">
                {c.points}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-semibold">
                Karma
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
