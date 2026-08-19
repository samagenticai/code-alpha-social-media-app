import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { IconSun, IconMoon } from './Icons';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      aria-label="Toggle dark/light theme"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      className={`relative flex items-center justify-between w-12 h-7 sm:w-14 sm:h-8 p-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-inner cursor-pointer transition-colors duration-300 flex-shrink-0 ${className}`}
    >
      <div className="flex items-center justify-between w-full px-0.5 sm:px-1 text-slate-500 dark:text-slate-400">
        <IconSun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
        <IconMoon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
      </div>

      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center border border-slate-200 dark:border-slate-700 ${
          isDark ? 'left-6 sm:left-7 text-cyan-400' : 'left-1 text-amber-500'
        }`}
      >
        {isDark ? (
          <IconMoon className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-cyan-400/20" />
        ) : (
          <IconSun className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500/20" />
        )}
      </motion.div>
    </motion.button>
  );
};
