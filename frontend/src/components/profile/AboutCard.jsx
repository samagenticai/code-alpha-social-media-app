import React from 'react';
import { motion } from 'framer-motion';

export const AboutCard = ({ profile, isOwner }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-xl space-y-6"
    >
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">About {profile.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Personal info and credentials</p>
        </div>
        <span className="px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-cyan-400 text-xs font-bold rounded-full border border-brand-500/20">
          Verified Profile
        </span>
      </div>

      {/* Bio & Overview */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Bio Overview</h4>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          {profile.bio || 'No bio provided.'}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-cyan-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Role / Title</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{profile.title || 'Creator'}</p>
          </div>
        </div>

        {profile.location && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Location</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{profile.location}</p>
            </div>
          </div>
        )}

        {isOwner && profile.email && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Private Email</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{profile.email}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Member Since</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{profile.joinedDate || 'Joined 2024'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
