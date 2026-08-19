import React, { useState } from 'react';
import { communitySpotlight } from '../../data/mockData';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/Badge';
import { IconSparkles } from '../ui/Icons';

export const CommunitySpotlight = () => {
  const [followingMap, setFollowingMap] = useState({});

  const toggleFollow = (id) => {
    setFollowingMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-xl shadow-slate-200/50 dark:shadow-black/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-cyan flex items-center justify-center shadow-md shadow-brand-500/20">
            <IconSparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Community Spotlight</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Featured Creators</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {communitySpotlight.map((creator) => {
          const isFollowing = followingMap[creator.id];

          return (
            <div
              key={creator.id}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={creator.avatar} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate hover:text-brand-600 dark:hover:text-cyan-400 cursor-pointer">
                      {creator.name}
                    </h4>
                    {creator.verified && <VerifiedBadge className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {creator.handle || creator.job || creator.city || ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleFollow(creator.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 flex-shrink-0 ${
                  isFollowing
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700'
                    : 'bg-gradient-to-r from-brand-600 via-brand-purple to-brand-cyan text-white shadow-md shadow-brand-500/25 hover:brightness-110'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
