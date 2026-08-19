import React from 'react';
import { motion } from 'framer-motion';
import { BRAND } from '../../config/brand';

export const BrandIcon = ({ size = 36, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-purple to-cyan-400 p-[2px] shadow-lg shadow-brand-500/30 ${className}`}
    >
      <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#070a12] flex items-center justify-center relative overflow-hidden transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/30 to-cyan-400/30 blur-sm" />
        <svg className="w-3/5 h-3/5 text-cyan-400 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    </div>
  );
};

export const Logo = ({ size = 'md', showTagline = false, className = '' }) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-base' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 44, text: 'text-2xl' },
    xl: { icon: 56, text: 'text-3xl' },
  };

  const { icon, text } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <BrandIcon size={icon} />
      <div className="flex flex-col">
        <span className={`font-black tracking-tight ${text} bg-gradient-to-r from-slate-900 via-brand-600 to-cyan-600 dark:from-white dark:via-cyan-300 dark:to-brand-400 bg-clip-text text-transparent`}>
          {BRAND.name}
        </span>
        {showTagline && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-400/80 -mt-1">
            {BRAND.shortTagline}
          </span>
        )}
      </div>
    </div>
  );
};

export const LogoCompact = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <BrandIcon size={32} />
      <span className="font-extrabold text-lg bg-gradient-to-r from-slate-900 via-brand-600 to-cyan-600 dark:from-white dark:via-cyan-300 dark:to-brand-400 bg-clip-text text-transparent">
        {BRAND.name}
      </span>
    </div>
  );
};
