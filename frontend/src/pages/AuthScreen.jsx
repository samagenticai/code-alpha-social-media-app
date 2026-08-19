import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo, BrandIcon } from '../components/brand/Logo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { BRAND } from '../config/brand';
import { IconVideo, IconMessage, IconUsers, IconLock } from '../components/ui/Icons';

const INTRO_MS = 1600;

const HIGHLIGHTS = [
  {
    icon: IconVideo,
    title: 'Posts & Reels',
    text: 'Share moments in a clean, full-screen experience.',
  },
  {
    icon: IconMessage,
    title: 'Private messaging',
    text: 'Chat with people you follow, without the noise.',
  },
  {
    icon: IconUsers,
    title: 'Real community',
    text: 'Follow creators, join conversations, stay in control.',
  },
];

export const AuthScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/feed';
  usePageTitle('Welcome');
  const {
    isAuthenticated,
    isGuest,
    isLoading,
    enterGuestMode,
    user,
    authModalMode,
  } = useAuth();
  const [formMode, setFormMode] = useState(authModalMode || 'login');
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroDone(true), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const destination = user?.role === 'admin'
        ? '/admin'
        : (redirectTo.startsWith('/admin') ? '/feed' : redirectTo);
      navigate(destination, { replace: true });
      return;
    }
    if (!isLoading && isGuest) {
      navigate('/feed', { replace: true });
    }
  }, [isLoading, isAuthenticated, isGuest, navigate, redirectTo, user?.role]);

  useEffect(() => {
    if (authModalMode) setFormMode(authModalMode);
  }, [authModalMode]);

  const handleSkip = () => {
    enterGuestMode();
    navigate('/feed');
  };

  const showSplash = isLoading || !introDone || isAuthenticated || isGuest;

  return (
    <div className="relative app-viewport w-full bg-[#f8fafc] dark:bg-[#070a12] text-slate-900 dark:text-slate-100 overflow-hidden overscroll-none">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -left-24 w-72 h-72 sm:w-[28rem] sm:h-[28rem] rounded-full bg-brand-600/15 dark:bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-64 h-64 sm:w-[24rem] sm:h-[24rem] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="auth-splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: 360 }}
              transition={{
                scale: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 2.4, repeat: Infinity, ease: 'linear' },
              }}
            >
              <BrandIcon size={72} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5 text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-brand-600 to-cyan-600 dark:from-white dark:via-cyan-300 dark:to-brand-400 bg-clip-text text-transparent"
            >
              {BRAND.name}
            </motion.p>
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {BRAND.shortTagline}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="auth-options"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 h-full min-h-0 flex flex-col overflow-hidden"
          >
            <header className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 pt-[max(0.7rem,env(safe-area-inset-top))] pb-2">
              <Logo size="md" className="min-w-0" />
              <ThemeToggle />
            </header>

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
              <section className="hidden lg:flex flex-col justify-center w-[46%] xl:w-[48%] px-10 xl:px-16 pb-10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-cyan-400 mb-4">
                  {BRAND.shortTagline}
                </p>
                <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white max-w-lg">
                  {BRAND.tagline}
                </h2>
                <p className="mt-4 text-base text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                  A focused social space for posts, reels, and conversations — built to feel fast, private, and easy to use on any screen.
                </p>

                <ul className="mt-10 space-y-4 max-w-md">
                  {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                    <li key={title} className="flex gap-3.5">
                      <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center text-brand-600 dark:text-cyan-400">
                        <Icon className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{text}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="mt-12 text-xs text-slate-400 flex items-center gap-1.5">
                  <IconLock className="w-3.5 h-3.5" />
                  Secure sign-in · Private accounts · Community guidelines
                </p>
              </section>

              <section className="flex-1 min-h-0 overflow-hidden px-4 sm:px-6 lg:overflow-y-auto lg:pr-10 xl:pr-16 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="h-full w-full max-w-[26.5rem] mx-auto lg:ml-auto lg:mr-0 lg:max-w-[26.5rem] flex items-center">
                  <div className="w-full bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-black/30 px-4 py-4 sm:p-7 backdrop-blur-md">
                    <AuthForm
                      initialMode={formMode}
                      showGuestSkip
                      onGuestSkip={handleSkip}
                    />
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
