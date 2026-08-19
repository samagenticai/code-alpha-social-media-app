import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { IconClose, IconEye, IconEyeOff } from '../ui/Icons';
import { BrandIcon } from '../brand/Logo';
import { BRAND } from '../../config/brand';
import { useAuth } from '../../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { login, register, authError, authSuccess, authModalMode, setAuthModalMode } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [forgotHint, setForgotHint] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    loginId: '',
  });

  useEffect(() => {
    if (isOpen) {
      setMode(authModalMode || initialMode);
      setFieldErrors({});
    }
  }, [isOpen, authModalMode, initialMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setAuthModalMode(newMode);
    setFieldErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (mode === 'register') {
      if (!form.fullName.trim()) errors.fullName = 'Full name is required.';
      const cleanUsername = form.username.trim().toLowerCase();
      if (!USERNAME_REGEX.test(cleanUsername)) {
        errors.username = 'Username must be 3–30 characters (letters, numbers, underscores).';
      }
    }

    const emailValue = mode === 'login' ? form.loginId.trim() : form.email.trim();
    if (mode === 'login') {
      if (!emailValue) errors.loginId = 'Email or username is required.';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (mode === 'register' && form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const result =
      mode === 'login'
        ? await login({
            email: form.loginId.trim(),
            password: form.password,
            rememberMe,
          })
        : await register({
            fullName: form.fullName.trim(),
            username: form.username.trim().toLowerCase(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
          });

    setIsSubmitting(false);

    if (result.success) {
      setForm({ fullName: '', username: '', email: '', password: '', confirmPassword: '', loginId: '' });
      onClose();
      if (result.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/feed', { replace: true });
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 theme-modal-backdrop cursor-pointer"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-slate-900/20 dark:shadow-brand-500/10 overflow-hidden z-10 max-h-[95vh] overflow-y-auto"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-cyan-500/10 pointer-events-none" />

        <div className="relative px-5 sm:px-6 pt-5 sm:pt-6 pb-2">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <BrandIcon size={40} />
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                  {mode === 'login' ? 'Welcome Back' : `Join ${BRAND.name}`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'login'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-purple text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'register'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-purple text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              Sign Up
            </button>
          </div>

          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400"
            >
              {authError}
            </motion.div>
          )}

          {authSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400"
            >
              {authSuccess}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full Name</label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Alex Rivera"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500/80 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                  {fieldErrors.fullName && <p className="mt-1 text-[11px] text-rose-500">{fieldErrors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Username</label>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    placeholder="alexrivera"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500/80 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                  {fieldErrors.username && <p className="mt-1 text-[11px] text-rose-500">{fieldErrors.username}</p>}
                </div>
              </>
            )}

            {mode === 'login' ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email or Username</label>
                <input
                  name="loginId"
                  type="text"
                  value={form.loginId}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  placeholder="you@example.com or username"
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500/80 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
                {fieldErrors.loginId && <p className="mt-1 text-[11px] text-rose-500">{fieldErrors.loginId}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500/80 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
                {fieldErrors.email && <p className="mt-1 text-[11px] text-rose-500">{fieldErrors.email}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'register' ? 'Min. 8 characters' : 'Enter your password'}
                  className="w-full px-4 py-2.5 pr-10 bg-slate-100 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500/80 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-[11px] text-rose-500">{fieldErrors.password}</p>}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-2.5 pr-10 bg-slate-100 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500/80 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                  >
                    {showConfirmPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="mt-1 text-[11px] text-rose-500">{fieldErrors.confirmPassword}</p>}
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotHint('Password reset is not enabled yet. Use Settings → Help & Support to contact us.')}
                  className="text-xs font-semibold text-brand-600 dark:text-cyan-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {forgotHint && mode === 'login' && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                {forgotHint}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              className="mt-2 !py-3"
            >
              {isSubmitting
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </Button>
          </form>
        </div>

        <div className="relative px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="ml-1.5 text-brand-600 dark:text-cyan-400 hover:underline font-semibold transition-colors"
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
