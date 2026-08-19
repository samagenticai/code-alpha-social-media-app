import React from 'react';
import { motion } from 'framer-motion';
import {
  IconHome,
  IconCompass,
  IconVideo,
  IconMessage,
  IconBell,
  IconBookmark,
  IconUser,
  IconSettings,
  IconUserPlus,
} from '../ui/Icons';
import { Logo } from '../brand/Logo';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  unreadMessages = 0,
  unreadNotifications = 0,
  pendingFollowRequests = 0,
  user,
  isGuest,
  onLogout,
  isAuthenticated,
}) => {
  const menuItems = [
    { id: 'home', label: 'Home Feed', icon: IconHome },
    { id: 'videos', label: 'Spatial Reels', icon: IconVideo, badge: 'LIVE' },
    { id: 'explore', label: 'Trending', icon: IconCompass },
    { id: 'messages', label: 'Messages', icon: IconMessage, count: unreadMessages },
    ...(isAuthenticated
      ? [{ id: 'followRequests', label: 'Follow Requests', icon: IconUserPlus, count: pendingFollowRequests }]
      : []),
    { id: 'bookmarks', label: 'Saved Posts', icon: IconBookmark },
    { id: 'notifications', label: 'Notifications', icon: IconBell, count: unreadNotifications },
    { id: 'profile', label: 'Profile Hub', icon: IconUser },
    { id: 'settings', label: 'Settings', icon: IconSettings },
  ];

  return (
    <aside className="sidebar-nav hidden md:flex flex-col justify-between w-64 xl:w-72 h-full py-3.5 px-3 overflow-hidden flex-shrink-0 select-none border-r border-slate-200/80 dark:border-slate-800/60 bg-white/50 dark:bg-transparent backdrop-blur-xl transition-colors duration-400">
      {/* Top: Logo & Compact Navigation Pages */}
      <div className="flex flex-col min-h-0 flex-1 space-y-2 overflow-hidden mb-2">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="px-2 flex-shrink-0"
        >
          <Logo size="md" showTagline />
        </motion.div>

        {/* Navigation Pages List */}
        <nav className="space-y-0.5 relative px-1 overflow-y-auto no-scrollbar flex-1 min-h-0">
          <p className="px-3 mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pages & Navigation
          </p>

          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(item.id)}
                className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-colors duration-300 group ${
                  isActive
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300/80 dark:border-cyan-500/30 shadow-sm dark:shadow-cyan-500/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}

                {!isActive && (
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-slate-100/70 dark:bg-slate-800/40 transition-opacity duration-200" />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  <div className={`p-1 rounded-lg transition-colors duration-300 ${
                    isActive
                      ? 'bg-brand-500/10 dark:bg-cyan-500/20 text-brand-600 dark:text-cyan-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-cyan-400'
                  }`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span>{item.label}</span>
                </div>

                <div className="relative z-10 flex items-center gap-1.5">
                  {item.badge && (
                    <Badge variant="hot" className="text-[10px] px-1.5 py-0">{item.badge}</Badge>
                  )}
                  {item.count !== undefined && item.count > 0 && !isGuest && (
                    <Badge variant="count">{item.count}</Badge>
                  )}
                </div>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Compact User Card / Guest Sign In */}
      <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 px-1 flex-shrink-0 mt-auto">
        {isGuest ? (
          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Browsing as Guest</p>
            <button
              onClick={() => setActiveTab('profile')}
              className="w-full py-1.5 bg-gradient-to-r from-brand-600 to-brand-cyan text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-all"
            >
              Sign In to unlock
            </button>
          </div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => setActiveTab('profile')}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/40 dark:hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar src={user?.avatar} alt={user?.name} size="sm" online />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-cyan-400 transition-colors">
                  {user?.name || 'User'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.handle || '@user'}</p>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onLogout?.(); }}
              title="Log Out"
              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </motion.div>
        )}
      </div>
    </aside>
  );
};

