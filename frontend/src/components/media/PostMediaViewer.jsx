import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const PostMediaViewer = ({
  isOpen,
  onClose,
  post,
  initialIndex = 0,
  mediaType = 'image',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const images = post?.images?.length ? post.images : post?.imageUrl ? [post.imageUrl] : [];
  const videoUrl = post?.video?.url || post?.videoUrl;
  const hasMultiple = mediaType === 'image' && images.length > 1;

  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (mediaType === 'image' && images.length > 1) {
        if (e.key === 'ArrowLeft') setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
        if (e.key === 'ArrowRight') setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose, mediaType, images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  if (!isOpen || !post) return null;

  const author = post.user || {};
  const authorName = author.name || author.fullName || 'User';

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex flex-col w-screen h-screen theme-modal-backdrop text-slate-900 dark:text-slate-100 overflow-hidden cursor-pointer"
        onClick={onClose}
      >
        {/* Top Header Bar */}
        <div
          className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5
                     border-b border-slate-200 dark:border-slate-800/80
                     bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex-shrink-0 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-xs">
              {authorName}
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {mediaType === 'video' ? 'Video View' : `Photo ${hasMultiple ? `${currentIndex + 1} of ${images.length}` : ''}`}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel and Close"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2
                       rounded-xl text-xs sm:text-sm font-bold
                       bg-slate-200/80 dark:bg-slate-800/80
                       text-slate-700 dark:text-slate-200
                       hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white
                       border border-slate-300/80 dark:border-slate-700/80
                       shadow-sm transition-all cursor-pointer flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Cancel</span>
          </button>
        </div>

        {/* Main Full-Screen Media Viewport */}
        <div
          className="relative flex-1 min-h-0 w-full flex items-center justify-center p-3 sm:p-6 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {mediaType === 'video' && videoUrl ? (
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          ) : images[currentIndex] ? (
            <motion.img
              key={images[currentIndex]}
              src={images[currentIndex]}
              alt={`Post image ${currentIndex + 1}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              draggable={false}
              className="max-w-full max-h-full object-contain rounded-xl sm:rounded-2xl shadow-2xl select-none"
            />
          ) : (
            <p className="text-xs sm:text-sm text-slate-400">No media available</p>
          )}

          {/* Prev / Next navigation for multi-image posts */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="Previous image"
                className="absolute left-3 sm:left-6 w-10 h-10 sm:w-12 sm:h-12
                           flex items-center justify-center rounded-full
                           bg-white/80 dark:bg-slate-800/80
                           text-slate-800 dark:text-white
                           hover:bg-white dark:hover:bg-slate-700
                           border border-slate-200 dark:border-slate-700
                           shadow-lg transition-all backdrop-blur-md cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="Next image"
                className="absolute right-3 sm:right-6 w-10 h-10 sm:w-12 sm:h-12
                           flex items-center justify-center rounded-full
                           bg-white/80 dark:bg-slate-800/80
                           text-slate-800 dark:text-white
                           hover:bg-white dark:hover:bg-slate-700
                           border border-slate-200 dark:border-slate-700
                           shadow-lg transition-all backdrop-blur-md cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dot navigation indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                    className={`rounded-full transition-all cursor-pointer ${
                      idx === currentIndex
                        ? 'w-5 h-2 bg-brand-600 dark:bg-cyan-400'
                        : 'w-2 h-2 bg-slate-400 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-400'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
