import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo, BrandIcon } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { BRAND } from '../config/brand';

export const AuthScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/feed';
  usePageTitle('Welcome');
  const { isAuthenticated, isGuest, isLoading, enterGuestMode, authModalOpen, closeAuthModal, openAuthModal, authModalMode, user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('login');

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
    if (typeof window !== 'undefined' && window.gsap) {
      const gsap = window.gsap;
      gsap.to('.auth-orb-1', { x: 80, y: 60, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.auth-orb-2', { x: -60, y: 40, duration: 12, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.fromTo('.auth-logo', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.7)' });
      gsap.fromTo('.auth-actions > *', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, delay: 0.4, ease: 'power3.out' });
    }
  }, []);

  const handleLogin = () => { setModalMode('login'); setModalOpen(true); openAuthModal('login'); };
  const handleSignUp = () => { setModalMode('register'); setModalOpen(true); openAuthModal('register'); };
  const handleSkip = () => { enterGuestMode(); navigate('/feed'); };
  const handleModalClose = () => { setModalOpen(false); closeAuthModal(); };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f4f6fb] dark:bg-[#070a12] transition-colors">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <BrandIcon size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative app-viewport w-full overflow-hidden flex flex-col items-center justify-center bg-[#f4f6fb] dark:bg-[#070a12] text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="auth-orb-1 absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-600/15 dark:bg-brand-600/20 blur-[160px]" />
        <div className="auth-orb-2 absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[150px]" />
        <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] rounded-full bg-purple-600/8 dark:bg-purple-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-md w-full">
        <motion.div
          className="auth-logo flex flex-col items-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Logo size="xl" showTagline className="items-center !flex-col" />
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-6 leading-relaxed max-w-xs">
            Connect, create, and explore with {BRAND.name} — your premium social experience.
          </p>
        </motion.div>

        <div className="auth-actions w-full space-y-3">
          <Button variant="primary" fullWidth size="lg" onClick={handleLogin} className="!py-3.5">
            Log In
          </Button>
          <Button variant="secondary" fullWidth size="lg" onClick={handleSignUp} className="!py-3.5">
            Sign Up
          </Button>
          <button
            onClick={handleSkip}
            className="w-full py-3 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium"
          >
            Skip for Now
          </button>
        </div>
      </div>

      <footer className="absolute bottom-6 text-xs text-slate-400">
        © {new Date().getFullYear()} {BRAND.name} · {BRAND.tagline}
      </footer>

      <AuthModal isOpen={modalOpen || authModalOpen} onClose={handleModalClose} initialMode={modalMode || authModalMode} />
    </div>
  );
};
