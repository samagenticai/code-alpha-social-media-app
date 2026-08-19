import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconSparkles, IconCheck } from '../ui/Icons';

const INITIAL_POLL = {
  id: 'poll_2026_01',
  question: 'What is your primary focus this year? 🚀',
  totalVotes: 342,
  options: [
    { id: 'opt_1', text: 'Full-Stack Web Dev 💻', votes: 142 },
    { id: 'opt_2', text: 'AI & Machine Learning 🤖', votes: 128 },
    { id: 'opt_3', text: 'Mobile Apps (iOS/Android) 📱', votes: 48 },
    { id: 'opt_4', text: 'Cloud & DevOps ☁️', votes: 24 },
  ],
};

export const CommunityPollWidget = () => {
  const [poll, setPoll] = useState(INITIAL_POLL);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    try {
      const savedVote = localStorage.getItem(`synora_poll_${poll.id}`);
      if (savedVote) {
        setSelectedOption(savedVote);
        setHasVoted(true);
      }
    } catch {
      // fallback
    }
  }, [poll.id]);

  const handleVote = (optionId) => {
    if (hasVoted) return;

    setSelectedOption(optionId);
    setHasVoted(true);

    setPoll((prev) => ({
      ...prev,
      totalVotes: prev.totalVotes + 1,
      options: prev.options.map((opt) =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      ),
    }));

    try {
      localStorage.setItem(`synora_poll_${poll.id}`, optionId);
    } catch {
      // fallback
    }

    if (typeof window !== 'undefined' && window.confetti) {
      window.confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
            <IconSparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              Community Poll
            </h3>
            <span className="text-[9px] font-bold text-brand-600 dark:text-cyan-400 uppercase tracking-wider block">
              Live Voting
            </span>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {poll.totalVotes} votes
        </span>
      </div>

      {/* Question */}
      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 leading-snug">
        {poll.question}
      </p>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const isSelected = selectedOption === opt.id;
          const percentage = Math.round((opt.votes / Math.max(poll.totalVotes, 1)) * 100);

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleVote(opt.id)}
              disabled={hasVoted}
              className={`w-full relative overflow-hidden rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-left transition-all border ${
                isSelected
                  ? 'border-brand-500 bg-brand-500/10 dark:bg-cyan-500/15 shadow-sm'
                  : hasVoted
                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50'
                  : 'border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] cursor-pointer'
              }`}
            >
              {/* Animated Vote Percentage Fill Bar */}
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`absolute inset-y-0 left-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-brand-600/25 to-cyan-500/25 dark:from-brand-600/35 dark:to-cyan-500/35'
                      : 'bg-slate-200/50 dark:bg-slate-800/50'
                  }`}
                />
              )}

              {/* Content text */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold truncate ${
                  isSelected ? 'text-brand-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-200'
                }`}>
                  {opt.text}
                </span>

                {hasVoted ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isSelected && (
                      <div className="w-3.5 h-3.5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <IconCheck className="w-2 h-2 stroke-[3]" />
                      </div>
                    )}
                    <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      {percentage}%
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold group-hover:text-brand-500">
                    Vote
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
