import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { IconClose } from '../ui/Icons';
import { BrandIcon } from '../brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { AuthForm } from './AuthForm';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { authModalMode } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 theme-modal-backdrop cursor-pointer"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[92dvh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 pt-4 pb-2 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md">
          <BrandIcon size={36} />
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Close"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-6 pb-6 pt-1">
          <AuthForm initialMode={authModalMode || initialMode} onSuccess={onClose} />
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
