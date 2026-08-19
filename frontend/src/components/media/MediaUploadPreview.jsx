import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

export const MediaUploadPreview = ({
  isOpen,
  onClose,
  previewUrl,
  onConfirm,
  isUploading = false,
  title = 'Preview',
  variant = 'image',
}) => (
  <AnimatePresence>
    {isOpen && previewUrl && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex flex-col theme-modal-backdrop"
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-4">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button type="button" onClick={onClose} disabled={isUploading} className="p-2 rounded-full bg-white/10 text-white cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 min-h-0">
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={previewUrl}
            alt="Preview"
            className={`max-w-full max-h-[65vh] object-contain ${variant === 'image' ? 'rounded-full aspect-square object-cover' : 'rounded-xl'}`}
          />
        </div>
        <div className="flex-shrink-0 p-4 flex gap-3 justify-end border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isUploading} className="!text-white hover:!bg-white/10">Cancel</Button>
          <Button variant="primary" size="sm" onClick={onConfirm} disabled={isUploading} className="!px-6">
            {isUploading ? 'Uploading...' : 'Save Photo'}
          </Button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
