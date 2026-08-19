import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const FollowButton = ({
  isFollowing: initialFollowing = false,
  followRequestPending: initialPending = false,
  followDisabled = false,
  onToggleFollow,
  className = '',
}) => {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(initialPending);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  useEffect(() => {
    setPending(initialPending);
  }, [initialPending]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (followDisabled) return;
    onToggleFollow?.();
  };

  if (followDisabled) {
    return (
      <button
        type="button"
        disabled
        className={`px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed ${className}`}
      >
        Unavailable
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md ${
        following
          ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30'
          : pending
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
            : 'bg-gradient-to-r from-brand-600 via-brand-purple to-brand-cyan text-white shadow-brand-500/25 hover:shadow-brand-500/40 hover:brightness-110'
      } ${className}`}
    >
      {following ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>Following</span>
        </>
      ) : pending ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Requested</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Follow</span>
        </>
      )}
    </motion.button>
  );
};
