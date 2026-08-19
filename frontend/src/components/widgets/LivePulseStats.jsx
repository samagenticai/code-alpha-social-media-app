import React from 'react';

export const LivePulseStats = () => {
  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Pulse Community Live
          </h3>
        </div>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-sm font-extrabold text-brand-600 dark:text-cyan-400">1,420</p>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Creators Online</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-sm font-extrabold text-purple-600 dark:text-purple-400">3.8k</p>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Posts Today</p>
        </div>
      </div>
    </div>
  );
};
