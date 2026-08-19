import React from 'react';
import { motion } from 'framer-motion';
import { IconHome, IconUserPlus, IconVideo, IconUser, IconSettings } from '../ui/Icons';

export const BottomNavigation = ({ activeTab, setActiveTab, pendingFollowRequests = 0 }) => {
  const items = [
    { id: 'home', label: 'Home', icon: IconHome },
    { id: 'followRequests', label: 'Requests', icon: IconUserPlus, badge: pendingFollowRequests },
    { id: 'videos', label: 'Reels', icon: IconVideo, isCenter: true },
    { id: 'profile', label: 'Profile', icon: IconUser },
    { id: 'settings', label: 'Settings', icon: IconSettings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-[#070a12]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-3 py-1.5 transition-colors duration-300 shadow-2xl safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center -top-2 transition-transform active:scale-90 cursor-pointer ${
                  isActive ? 'scale-105' : 'hover:scale-105'
                }`}
                aria-label="Reels"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-tr from-brand-600 via-brand-purple to-cyan-400 text-white shadow-brand-500/40 ring-2 ring-white dark:ring-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span
                  className={`text-[9px] font-bold mt-0.5 ${
                    isActive ? 'text-brand-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-brand-600 dark:text-cyan-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 px-1 rounded-full bg-rose-500 text-[9px] font-extrabold text-white flex items-center justify-center ring-2 ring-white dark:ring-[#070a12]">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute bottom-0 w-4 h-0.5 rounded-full bg-brand-600 dark:bg-cyan-400"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

