import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconClose, IconPlus, IconVideo, IconImage, IconGrid } from '../ui/Icons';

const MENU_ITEMS = [
  {
    id: 'post',
    label: 'Create Post',
    description: 'Share text, thoughts, or updates',
    icon: IconGrid,
    color: 'from-brand-600 to-brand-purple',
  },
  {
    id: 'reel',
    label: 'Create Reel',
    description: 'Short vertical video for the Reels feed',
    icon: IconVideo,
    color: 'from-rose-500 to-orange-500',
    highlight: true,
  },
  {
    id: 'photo',
    label: 'Upload Photo',
    description: 'Post an image to your feed',
    icon: IconImage,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'video',
    label: 'Upload Video',
    description: 'Share a video post on your feed',
    icon: IconVideo,
    color: 'from-violet-500 to-purple-600',
  },
];

export const CreateMenu = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[75] theme-modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 48, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 48, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-sm bg-white dark:bg-slate-950 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden safe-bottom"
        >
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center text-white">
                <IconPlus className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              aria-label="Close"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-2">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    item.highlight
                      ? 'bg-gradient-to-r from-rose-500/10 to-orange-500/10 dark:from-rose-500/15 dark:to-orange-500/15 border border-rose-200/80 dark:border-rose-500/30 ring-1 ring-rose-500/20'
                      : 'bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-500/40'
                  }`}
                >
                  <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {item.label}
                      {item.highlight && (
                        <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold">
                          New
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
