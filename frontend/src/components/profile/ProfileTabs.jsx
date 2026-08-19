import React from 'react';
import { motion } from 'framer-motion';
import { IconGrid, IconImage, IconVideo, IconBookmark } from '../ui/Icons';

export const ProfileTabs = ({ activeTab, setActiveTab, isOwner = true }) => {
  const tabs = [
    { id: 'posts', label: 'Posts', icon: IconGrid },
    { id: 'photos', label: 'Photos', icon: IconImage },
    { id: 'videos', label: 'Reels', icon: IconVideo },
    ...(isOwner ? [{ id: 'saved', label: 'Saved', icon: IconBookmark }] : []),
  ];

  return (
    <div className="w-full mb-4 sm:mb-6 border-b border-slate-200/80 dark:border-slate-800/80 select-none">
      <div className="flex items-center justify-between w-full py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 px-1 sm:px-4 py-2 sm:py-3 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                isActive
                  ? 'text-brand-600 dark:text-cyan-400 bg-brand-500/10 dark:bg-cyan-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors ${isActive ? 'text-brand-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="truncate">{tab.label}</span>

              {isActive && (
                <motion.div
                  layoutId="profile-active-tab"
                  className="absolute bottom-0 left-1 right-1 sm:left-0 sm:right-0 h-0.5 bg-gradient-to-r from-brand-600 via-brand-purple to-cyan-400 rounded-full shadow-sm shadow-cyan-400/50"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

