import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './Avatar';

export const UserMenu = ({ user, isGuest, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative flex-shrink-0" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 p-0.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-all focus:outline-none cursor-pointer active:scale-95"
        aria-label="User Menu"
      >
        <Avatar
          src={user?.avatar}
          alt={user?.name}
          size="sm"
          online={!isGuest}
          className="!w-7 !h-7 sm:!w-9 sm:!h-9 ring-2 ring-brand-500/20 hover:ring-brand-500 transition-all"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Clean Minimal Menu Popover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/60 p-1.5 z-50 overflow-hidden"
            >
              {!isGuest ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Log Out</span>
                  <span className="text-xs">🚪</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-brand-600 dark:text-cyan-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Sign In</span>
                  <span className="text-xs">→</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

