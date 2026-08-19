import React from 'react';
import { IconSparkles, IconPlus } from '../ui/Icons';
import { Button } from '../ui/Button';

export const DailyChallenge = ({ onJoinChallenge }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-brand-600/90 via-brand-purple/90 to-brand-cyan/90 text-white shadow-lg shadow-brand-500/20 border border-white/20">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

      <div className="relative z-10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider">
            <IconSparkles className="w-3 h-3 text-amber-300" /> Daily Challenge
          </span>
          <span className="text-[10px] text-white/80 font-medium">Ends in 8h</span>
        </div>

        <div>
          <h3 className="text-sm font-extrabold text-white drop-shadow">
            Golden Hour Aesthetics
          </h3>
          <p className="text-[11px] text-white/90 leading-snug mt-0.5">
            Share your best sunset photo or workspace vibe with the community!
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => onJoinChallenge?.('create_post')}
          className="w-full !py-1.5 bg-white text-slate-900 font-extrabold hover:bg-slate-100 shadow-md text-xs flex items-center justify-center gap-1.5 transition-all"
        >
          <IconPlus className="w-3.5 h-3.5" /> Join Challenge
        </Button>
      </div>
    </div>
  );
};
