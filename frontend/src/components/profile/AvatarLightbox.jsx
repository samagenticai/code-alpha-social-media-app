import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const AvatarLightbox = ({
  isOpen,
  onClose,
  src,
  alt = 'Profile picture',
  name,
  handle
}) => {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const handleSave = async (e) => {
    e?.stopPropagation();
    if (!src) return;
    const defaultName = `${name ? name.replace(/\s+/g, '-').toLowerCase() : 'profile'}-photo.jpg`;
    try {
      const response = await fetch(src, { mode: 'cors' });
      if (!response.ok) throw new Error('Network fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = defaultName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
    } catch (err) {
      console.warn('Blob fetch download failed, falling back to direct anchor:', err);
      const link = document.createElement('a');
      link.href = src;
      link.download = defaultName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex flex-col w-screen h-screen theme-modal-backdrop text-white overflow-hidden select-none cursor-pointer"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Profile picture modal"
      >
        {/* Top Header Bar */}
        <div
          className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 bg-slate-900/80 backdrop-blur-md flex-shrink-0 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={src}
              alt={alt}
              className="w-8 h-8 rounded-full object-cover border border-white/20"
            />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                {name || alt}
              </span>
              {handle && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="text-xs text-slate-400 font-medium truncate hidden sm:inline">
                    {handle}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleSave}
              aria-label="Save image to device"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition-all cursor-pointer"
              title="Download and save photo to your device"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cancel and Close"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-rose-600 text-white border border-white/20 shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {/* Main Full-Screen Media Viewport */}
        <div
          className="relative flex-1 min-h-0 w-full flex items-center justify-center p-4 sm:p-8 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative flex items-center justify-center max-w-full max-h-full"
          >
            {/* Outer Glowing Gradient Ring */}
            <div className="relative p-1.5 sm:p-2.5 rounded-full bg-gradient-to-tr from-brand-cyan via-brand-purple to-brand-pink shadow-[0_0_80px_rgba(168,85,247,0.45)]">
              <img
                src={src}
                alt={alt}
                className="w-56 h-56 sm:w-80 sm:h-80 md:w-[380px] md:h-[380px] lg:w-[420px] lg:h-[420px] rounded-full object-cover aspect-square border-4 border-white dark:border-slate-900 bg-slate-900 shadow-2xl block"
                draggable={false}
              />
            </div>
          </motion.div>
        </div>

        {/* Footer Hint */}
        <div className="w-full text-center z-10 pb-3 flex-shrink-0">
          <p className="text-xs text-slate-400 font-medium">
            Click anywhere outside or press ESC to close
          </p>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
