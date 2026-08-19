import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconSearch, IconBell, IconPlus, IconMessage } from '../ui/Icons';
import { LogoCompact } from '../brand/Logo';
import { Avatar } from '../ui/Avatar';

export const TopNavigation = ({
  onOpenCreatePost,
  onOpenSearch,
  searchQuery,
  setSearchQuery,
  onOpenNotifications,
  onOpenMessages,
  onOpenProfile,
  onOpenSettings,
  onLogout,
  user,
  isGuest,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  // Global hotkey Ctrl+K / Cmd+K to trigger search page navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-2.5 py-2 sm:px-4 sm:py-3 md:px-6 transition-colors duration-300">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* App Logo & Name */}
        <div className="flex items-center flex-shrink-0">
          <LogoCompact />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Search Icon Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSearch}
            title="Search creators (Ctrl+K)"
            className="relative p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-center cursor-pointer"
          >
            <IconSearch className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>

          {/* Create Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenCreatePost}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 via-brand-purple to-brand-cyan text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 hover:brightness-110 transition-all cursor-pointer"
          >
            <IconPlus className="w-4 h-4" />
            <span>Create</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenMessages}
            className="md:hidden relative p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <IconMessage className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadMessagesCount > 0 && !isGuest && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-3.5 px-1 flex items-center justify-center text-[9px] font-extrabold rounded-full bg-brand-500 text-white shadow-md">
                {unreadMessagesCount}
              </span>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenNotifications}
            title="Notifications"
            className="relative p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <IconBell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadNotificationsCount > 0 && !isGuest && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-extrabold rounded-full bg-cyan-500 text-white shadow-md ring-2 ring-white dark:ring-[#090d16]">
                {unreadNotificationsCount}
              </span>
            )}
          </motion.button>

          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1 p-0.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-all focus:outline-none cursor-pointer active:scale-95 flex-shrink-0"
            aria-label="View Profile"
            title="View Profile"
          >
            <Avatar
              src={user?.avatar}
              alt={user?.name}
              size="sm"
              online={!isGuest}
              className="!w-7 !h-7 sm:!w-9 sm:!h-9 ring-2 ring-brand-500/20 hover:ring-brand-500 transition-all"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
