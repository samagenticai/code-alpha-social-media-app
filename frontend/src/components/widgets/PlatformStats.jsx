import React from 'react';
import { platformStats } from '../../data/mockData';

export const PlatformStats = () => {
  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-xl shadow-slate-200/50 dark:shadow-black/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Platform Analytics</h3>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Live Growth
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {platformStats.map((stat) => (
          <div
            key={stat.id}
            className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
          >
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium truncate">
              {stat.label}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {stat.value}
              </span>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
