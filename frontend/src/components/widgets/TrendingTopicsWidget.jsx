import React from 'react';
import { IconHashtag, IconTrending } from '../ui/Icons';

const TRENDING_TOPICS = [
  { tag: 'Technology', count: '14.8k posts', category: 'Trending in Tech' },
  { tag: 'Design', count: '9.2k posts', category: 'Creative' },
  { tag: 'Photography', count: '7.6k posts', category: 'Visual Arts' },
  { tag: 'Coding', count: '5.4k posts', category: 'Software' },
  { tag: 'AI', count: '18.1k posts', category: 'Artificial Intelligence' },
];

export const TrendingTopicsWidget = ({ onSearchTag }) => {
  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="w-7 h-7 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
          <IconTrending className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
          Trending Topics
        </h3>
      </div>

      {/* Topics List */}
      <div className="space-y-2">
        {TRENDING_TOPICS.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSearchTag?.(item.tag)}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
          >
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none mb-1">
                {item.category}
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-cyan-400 transition-colors block">
                #{item.tag}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex-shrink-0">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
