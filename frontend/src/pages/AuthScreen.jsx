import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo, BrandIcon } from '../components/brand/Logo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { BRAND } from '../config/brand';
import { IconVideo, IconMessage, IconUsers, IconLock } from '../components/ui/Icons';

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

  if (isLoading) {
    return (
      <div className="app-viewport flex items-center justify-center bg-[#f8fafc] dark:bg-[#070a12]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <BrandIcon size={44} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative app-viewport w-full bg-[#f8fafc] dark:bg-[#070a12] text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -left-24 w-72 h-72 sm:w-[28rem] sm:h-[28rem] rounded-full bg-brand-600/15 dark:bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-64 h-64 sm:w-[24rem] sm:h-[24rem] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl" />
      </div>

      <header className="relative z-20 flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 pt-[max(0.85rem,env(safe-area-inset-top))] pb-3">
        <Logo size="md" className="min-w-0" />
        <ThemeToggle />
      </header>

      <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row">
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

        <section className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 lg:pr-10 xl:pr-16 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-[26.5rem] lg:ml-auto lg:mr-0 py-3 sm:py-6 lg:flex lg:min-h-full lg:items-center">
            <div className="w-full">
              <div className="lg:hidden mb-5">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {BRAND.tagline}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Connect, create, and explore — designed for mobile and desktop.
                </p>
              </div>

              <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-black/30 p-5 sm:p-7 backdrop-blur-md">
                <AuthForm
                  initialMode={formMode}
                  showGuestSkip
                  onGuestSkip={handleSkip}
                />
              </div>

              <p className="mt-5 sm:mt-6 text-center text-[11px] sm:text-xs text-slate-400 px-2">
                © {new Date().getFullYear()} {BRAND.name}. By continuing you agree to our terms and privacy policy.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
