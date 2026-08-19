import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/Badge';
import { FollowButton } from './FollowButton';
import { userService } from '../../services/userService';

export const SuggestedConnections = ({ creators = [], onRequireAuth }) => {
  const navigate = useNavigate();
  const [followState, setFollowState] = useState({});

  const handleUserClick = (creator) => {
    const uname = creator.username || (creator.handle ? creator.handle.replace('@', '') : '') || creator.id;
    if (uname) {
      navigate(`/profile/${String(uname).toLowerCase()}`);
    }
  };

  const handleToggleFollow = async (creatorId, defaultFollowing) => {
    const isCurFollowing = followState[creatorId]?.isFollowing ?? defaultFollowing;
    const isCurPending = followState[creatorId]?.followRequestPending ?? false;

    // Optimistic toggle
    setFollowState((prev) => ({
      ...prev,
      [creatorId]: {
        isFollowing: !isCurFollowing && !isCurPending,
        followRequestPending: false,
      },
    }));

    try {
      const res = await userService.toggleFollowUser(creatorId);
      setFollowState((prev) => ({
        ...prev,
        [creatorId]: {
          isFollowing: Boolean(res.isFollowing),
          followRequestPending: Boolean(res.followRequestPending),
        },
      }));
    } catch (err) {
      console.error('Error toggling follow in suggested:', err);
      setFollowState((prev) => ({
        ...prev,
        [creatorId]: {
          isFollowing: isCurFollowing,
          followRequestPending: isCurPending,
        },
      }));
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-xl space-y-4 my-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Suggested Creators</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              Pioneers
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Discover inspiring creators & mutual connections</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {creators.map((creator) => {
          const isFollowing = followState[creator.id]?.isFollowing ?? creator.isFollowing;
          const followRequestPending = followState[creator.id]?.followRequestPending ?? false;

          return (
            <motion.div
              key={creator.id}
              whileHover={{ y: -3 }}
              className="flex flex-col justify-between p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/30 transition-all text-center"
            >
              <div className="flex flex-col items-center">
                <button type="button" onClick={() => handleUserClick(creator)} className="cursor-pointer focus:outline-none">
                  <Avatar src={creator.avatar} alt={creator.name} size="md" storyRing className="mb-2" />
                </button>
                <div className="flex items-center gap-1">
                  <h4 onClick={() => handleUserClick(creator)} className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate hover:text-brand-600 dark:hover:text-cyan-400 cursor-pointer">
                    {creator.name}
                  </h4>
                  {creator.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mb-3">
                  {creator.handle || (creator.username ? `@${creator.username}` : '') || creator.city || ''}
                </p>
              </div>

              <FollowButton
                isFollowing={isFollowing}
                followRequestPending={followRequestPending}
                onToggleFollow={() => handleToggleFollow(creator.id, creator.isFollowing)}
                className="w-full !py-1.5 !text-[11px]"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
