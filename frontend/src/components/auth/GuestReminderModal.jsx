import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { IconClose, IconSparkles } from '../ui/Icons';
import { BRAND } from '../../config/brand';
import { useAuth } from '../../context/AuthContext';

export const GuestReminderModal = () => {
  const { guestReminderOpen, setGuestReminderOpen, openAuthModal, isGuest } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setGuestReminderOpen(false);
    };
    if (guestReminderOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [guestReminderOpen, setGuestReminderOpen]);

  if (!isGuest || !guestReminderOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 theme-modal-backdrop cursor-pointer"
          onClick={() => setGuestReminderOpen(false)}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 24 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-900/20 dark:shadow-brand-500/15 overflow-hidden z-10 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-brand-600/15 via-transparent to-cyan-500/10 pointer-events-none" />

          <button
            onClick={() => setGuestReminderOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
          >
            <IconClose className="w-4 h-4" />
          </button>

          <div className="relative px-6 pt-8 pb-6">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-purple to-brand-cyan flex items-center justify-center shadow-xl shadow-brand-500/30"
            >
              <IconSparkles className="w-8 h-8 text-white" />
            </motion.div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
              Enjoying {BRAND.name}?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Create a free account to post, like, comment, follow creators, and unlock the full experience.
            </p>

            <div className="space-y-2.5">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  setGuestReminderOpen(false);
                  openAuthModal('register');
                }}
                className="!py-3"
              >
                Create Free Account
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setGuestReminderOpen(false);
                  openAuthModal('login');
                }}
              >
                Log In
              </Button>
              <button
                onClick={() => setGuestReminderOpen(false)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Continue browsing as guest
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
