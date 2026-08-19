import React from 'react';
import { motion } from 'framer-motion';

export const UserStreakWidget = ({ currentStreak = 7 }) => {
  const days = [
    { label: 'M', active: true },
    { label: 'T', active: true },
    { label: 'W', active: true },
    { label: 'T', active: true },
    { label: 'F', active: true },
    { label: 'S', active: true },
    { label: 'S', active: true, today: true },
  ];

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center text-sm shadow-md shadow-rose-500/20">
            🔥
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              Activity Streak
            </h3>
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">
              Daily Creator
            </span>
          </div>
        </div>

        <span className="text-[11px] font-black font-mono text-rose-500 bg-rose-500/10 dark:bg-rose-500/20 px-2 py-0.5 rounded-full">
          {currentStreak} Days
        </span>
      </div>

      <div className="flex items-center justify-between gap-1.5 my-2.5">
        {days.map((d, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
              {d.label}
            </span>
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all ${
                d.active
                  ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-sm shadow-rose-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              } ${d.today ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900 scale-105' : ''}`}
            >
              {d.active ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 text-center">
        ⚡ You're on fire! Keep posting daily to unlock the <strong className="text-slate-700 dark:text-slate-200">Diamond Creator</strong> badge.
      </p>
    </div>
  );
};
