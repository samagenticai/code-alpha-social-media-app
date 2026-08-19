import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const MediaContextMenu = ({
  isOpen,
  onClose,
  onView,
  onEdit,
  showEdit = true,
  viewLabel = 'View Photo',
  editLabel = 'Edit Photo',
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] theme-modal-backdrop cursor-pointer"
            onClick={onClose}
          />
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed z-[61] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[200px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-2xl shadow-black/30 overflow-hidden"
          >
            <div className="p-1.5">
              <button
                type="button"
                onClick={() => { onView?.(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <span className="text-lg">👁️</span>
                <span>{viewLabel}</span>
              </button>
              {showEdit && (
                <button
                  type="button"
                  onClick={() => { onEdit?.(); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <span className="text-lg">✏️</span>
                  <span>{editLabel}</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
