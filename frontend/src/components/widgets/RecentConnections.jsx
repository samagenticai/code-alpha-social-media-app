import React from 'react';
import { recentConnections } from '../../data/mockData';
import { Avatar } from '../ui/Avatar';
import { IconMessage } from '../ui/Icons';

export const RecentConnections = () => {
  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-xl shadow-slate-200/50 dark:shadow-black/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Connections</h3>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">Recently Followed</span>
      </div>

      <div className="space-y-3">
        {recentConnections.map((conn) => (
          <div
            key={conn.id}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={conn.avatar} size="sm" online={conn.online} />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                  {conn.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{conn.connectedAgo}</p>
              </div>
            </div>

            <button
              className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Message connection"
            >
              <IconMessage className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
