import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconClose } from './Icons';
import { useTheme } from '../../context/ThemeContext';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto no-scrollbar">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 theme-modal-backdrop cursor-pointer"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className={`relative w-full ${maxWidth} max-h-[94vh] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto border flex flex-col transition-colors duration-200`}
          style={{
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div 
              className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0 backdrop-blur-md transition-colors duration-200"
              style={{
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)',
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)',
              }}
            >
              <h3 className="text-sm sm:text-lg font-bold tracking-tight" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                {title}
              </h3>
              <button 
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all hover:rotate-90 cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-3.5 sm:p-6 overflow-y-auto no-scrollbar flex-1 min-h-0" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
