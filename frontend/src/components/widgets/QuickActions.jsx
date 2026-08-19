import React from 'react';
import { quickActions } from '../../data/mockData';
import { IconPlus, IconVideo, IconUser, IconBookmark } from '../ui/Icons';

export const QuickActions = ({ onActionClick }) => {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'plus': return IconPlus;
      case 'video': return IconVideo;
      case 'user': return IconUser;
      case 'bookmark': return IconBookmark;
      default: return IconPlus;
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-xl shadow-slate-200/50 dark:shadow-black/30">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3.5">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-2.5">
        {quickActions.map((item) => {
          const Icon = getIcon(item.iconName);
          return (
            <button
              key={item.id}
              onClick={() => onActionClick(item.action)}
              className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 ${item.color}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
