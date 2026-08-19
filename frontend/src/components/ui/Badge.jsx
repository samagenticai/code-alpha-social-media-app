import React from 'react';
import { IconVerified } from './Icons';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-200/80 text-slate-800 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/60',
    brand: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/20 dark:text-brand-400 dark:border-brand-500/30',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/30',
    hot: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 animate-pulse',
    count: 'bg-gradient-to-r from-brand-600 to-brand-purple text-white font-bold text-xs px-2 py-0.5 rounded-full shadow-md shadow-brand-600/30',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm transition-colors ${variantStyles[variant] || variantStyles.default} ${className}`}>
      {children}
    </span>
  );
};

export const VerifiedBadge = ({ className = 'w-4 h-4 text-brand-600 dark:text-cyan-400' }) => (
  <IconVerified className={className} />
);
