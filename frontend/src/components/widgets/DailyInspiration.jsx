import React from 'react';
import { dailyInspiration } from '../../data/mockData';
import { IconSparkles } from '../ui/Icons';

export const DailyInspiration = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 border border-brand-500/30 bg-gradient-to-br from-brand-500/10 via-purple-500/10 to-cyan-500/10 dark:from-brand-900/40 dark:via-purple-950/40 dark:to-slate-950/80 backdrop-blur-2xl shadow-lg dark:shadow-xl shadow-brand-500/10 group">
      {/* Decorative ambient gradient circle */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-brand-500/20 blur-2xl group-hover:bg-brand-500/30 transition-all duration-500" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-cyan-500/20 blur-2xl group-hover:bg-cyan-500/30 transition-all duration-500" />

      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold tracking-widest text-brand-600 dark:text-cyan-400 uppercase bg-brand-500/10 dark:bg-cyan-500/10 px-2.5 py-1 rounded-full border border-brand-500/20 dark:border-cyan-500/20">
            {dailyInspiration.tag}
          </span>
          <IconSparkles className="w-5 h-5 text-amber-500 dark:text-amber-400 animate-pulse" />
        </div>

        <blockquote className="text-sm font-semibold text-slate-800 dark:text-slate-100 italic leading-relaxed">
          "{dailyInspiration.quote}"
        </blockquote>

        <div className="flex items-center justify-end pt-1">
          <cite className="text-xs font-bold text-slate-600 dark:text-slate-400 not-italic">
            — {dailyInspiration.author}
          </cite>
        </div>
      </div>
    </div>
  );
};
