import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { IconClose } from '../ui/Icons';
import { PLATFORM_DOCUMENTS, getDocumentTitle } from '../../data/platformDocuments';

const IconDoc = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const PlatformDocumentModal = ({ docKey, onClose }) => {
  if (!docKey || !PLATFORM_DOCUMENTS[docKey]) return null;

  const doc = PLATFORM_DOCUMENTS[docKey];

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 theme-modal-backdrop cursor-pointer"
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        className="relative w-full max-w-2xl lg:max-w-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex-shrink-0 flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <IconDoc className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span className="truncate">{doc.title || getDocumentTitle(docKey)}</span>
            </h3>
            {doc.lastUpdated && (
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                Last updated: {doc.lastUpdated}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex-shrink-0"
            aria-label="Close"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6 no-scrollbar">
          {doc.sections.map((section, idx) => (
            <section key={idx}>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {section.heading}
              </h4>
              <div className="space-y-2.5">
                {section.paragraphs.map((para, pIdx) => (
                  <p
                    key={pIdx}
                    className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="flex-shrink-0 flex justify-end gap-2 px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
