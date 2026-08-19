import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CoverLightbox = ({
  isOpen,
  onClose,
  src,
  alt = 'Cover Photo',
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
    const defaultName = `${name ? name.replace(/\s+/g, '-').toLowerCase() : 'profile'}-cover.jpg`;
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
        aria-label="Cover photo modal"
      >
        {/* Top Header Bar */}
        <div
          className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 bg-slate-900/80 backdrop-blur-md flex-shrink-0 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
              {name || 'Cover Photo'}
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
          className="relative flex-1 min-h-0 w-full flex items-center justify-center p-3 sm:p-6 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.img
            src={src}
            alt={alt}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            draggable={false}
            className="max-w-full max-h-full object-contain rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl select-none"
          />
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

export const CoverBanner = ({
  coverImage,
  isOwner,
  onEditCover,
  embedded = false,
  profileName,
  profileHandle
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageSrc = coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80';

  return (
    <>
      <div
        onClick={() => setLightboxOpen(true)}
        className={`relative w-full h-28 sm:h-36 md:h-40 overflow-hidden select-none cursor-pointer group ${
          embedded ? 'rounded-none border-0 shadow-none' : 'rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-xl'
        } transition-colors`}
        title="Click to view cover photo"
      >
        <img
          src={imageSrc}
          alt="Profile Cover"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 via-purple-600/15 to-cyan-500/20 mix-blend-overlay pointer-events-none" />

        {/* Hover hint */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-white/20">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
            <span>View Cover</span>
          </span>
        </div>

        {isOwner && onEditCover && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onEditCover();
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-900/80 hover:bg-slate-950 text-white text-xs font-semibold rounded-xl border border-white/20 backdrop-blur-md shadow-lg flex items-center gap-2 transition-all cursor-pointer z-10"
          >
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Change Cover</span>
          </motion.button>
        )}
      </div>

      <CoverLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        src={imageSrc}
        name={profileName}
        handle={profileHandle}
      />
    </>
  );
};
