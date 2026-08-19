import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const FullScreenMediaViewer = ({
  isOpen,
  onClose,
  src,
  alt = 'Media',
  variant = 'image', // 'image' | 'cover'
}) => {
  const [scale, setScale] = useState(1);

  const resetZoom = useCallback(() => setScale(1), []);

  useEffect(() => {
    if (!isOpen) {
      resetZoom();
      return;
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + 0.25, 3));
      if (e.key === '-') setScale((s) => Math.max(s - 0.25, 0.5));
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose, resetZoom]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.gsap) {
      window.gsap.fromTo('.fs-media-viewer-img', { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' });
    }
  }, [isOpen, src]);

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));

  return (
    <AnimatePresence>
      {isOpen && src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col theme-modal-backdrop cursor-pointer"
          onClick={onClose}
        >
          {/* Top bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 sm:py-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <button type="button" onClick={zoomOut} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold cursor-pointer" aria-label="Zoom out">−</button>
              <span className="text-xs text-white/70 font-mono min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
              <button type="button" onClick={zoomIn} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold cursor-pointer" aria-label="Zoom in">+</button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Media */}
          <div
            className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              key={src}
              src={src}
              alt={alt}
              className={`fs-media-viewer-img max-w-full select-none touch-manipulation ${
                variant === 'cover'
                  ? 'max-h-[70vh] w-full object-contain rounded-lg'
                  : 'max-h-[80vh] rounded-full aspect-square object-cover'
              }`}
              style={{ scale, transformOrigin: 'center center' }}
              animate={{ scale }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2))}
              draggable={false}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
