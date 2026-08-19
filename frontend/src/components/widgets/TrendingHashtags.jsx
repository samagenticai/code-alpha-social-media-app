import React from 'react';
import { IconFlame, IconSparkles } from '../ui/Icons';

const TRENDING_TOPICS = [
  { tag: 'PulseVibes', category: 'Community', posts: '14.2k', hot: true },
  { tag: 'SpatialReels', category: 'Video & Motion', posts: '9.8k', hot: true },
  { tag: 'AIArt', category: 'Digital Design', posts: '7.5k', hot: false },
  { tag: 'WebDev', category: 'Tech & Code', posts: '5.1k', hot: false },
  { tag: 'GoldenHour', category: 'Photography', posts: '3.4k', hot: false },
];

export const TrendingHashtags = ({ onSearchTag }) => {
  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
            <IconFlame className="w-4 h-4" />
          </div>
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
            What's Happening
          </h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Trending
        </span>
      </div>

      <div className="space-y-2">
        {TRENDING_TOPICS.map((item) => (
          <button
            key={item.tag}
            type="button"
            onClick={() => onSearchTag?.(item.tag)}
            className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {item.category}
              </p>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-cyan-400 transition-colors">
                #{item.tag}
              </h4>
            </div>
            <div className="flex items-center gap-1 text-right">
              {item.hot && <IconSparkles className="w-3 h-3 text-amber-500" />}
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                {item.posts}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
