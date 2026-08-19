import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { IconEye, IconEyeOff, IconLock, IconUser } from '../ui/Icons';
import { BRAND } from '../../config/brand';
import { useAuth } from '../../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const fieldClass =
  'w-full h-11 sm:h-12 pl-11 pr-4 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition-all';

export const AuthForm = ({
  initialMode = 'login',
  onSuccess,
  showGuestSkip = false,
  onGuestSkip,
}) => {
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
    setMode(authModalMode || initialMode);
    setFieldErrors({});
    setForgotHint('');
  }, [authModalMode, initialMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setAuthModalMode?.(newMode);
    setFieldErrors({});
    setForgotHint('');
    setShowPassword(false);
    setShowConfirmPassword(false);
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

    if (mode === 'login') {
      if (!form.loginId.trim()) errors.loginId = 'Email or username is required.';
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
      onSuccess?.(result);
      if (result.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/feed', { replace: true });
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-3 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {mode === 'login' ? 'Welcome back' : `Join ${BRAND.name}`}
        </h1>
        <p className="hidden sm:block mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {mode === 'login'
            ? 'Sign in to continue to your account.'
            : 'Create an account to start sharing with the community.'}
        </p>
      </div>

      <div className="flex p-1 mb-3 sm:mb-5 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 h-9 sm:h-10 text-sm font-semibold rounded-lg transition-all ${
            mode === 'login'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Log In
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`flex-1 h-9 sm:h-10 text-sm font-semibold rounded-lg transition-all ${
            mode === 'register'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Sign Up
        </button>
      </div>

      {authError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-3.5 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-sm text-rose-600 dark:text-rose-400"
        >
          {authError}
        </motion.div>
      )}

      {authSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-3.5 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {authSuccess}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3.5" noValidate>
        {mode === 'register' && (
          <>
            <Field
              label="Full name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Alex Rivera"
              autoComplete="name"
              error={fieldErrors.fullName}
              icon={<IconUser className="w-4 h-4" />}
            />
            <Field
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="alexrivera"
              autoComplete="username"
              error={fieldErrors.username}
              icon={<span className="text-xs font-bold">@</span>}
            />
          </>
        )}

        {mode === 'login' ? (
          <Field
            label="Email or username"
            name="loginId"
            value={form.loginId}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="username"
            error={fieldErrors.loginId}
            icon={<IconUser className="w-4 h-4" />}
          />
        ) : (
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            error={fieldErrors.email}
            icon={<IconUser className="w-4 h-4" />}
          />
        )}

        <div>
          <label htmlFor="password" className="block text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5">
            Password
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <IconLock className="w-4 h-4" />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
              className={`${fieldClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && <p className="mt-1 text-xs text-rose-500">{fieldErrors.password}</p>}
        </div>

        {mode === 'register' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5">
              Confirm password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <IconLock className="w-4 h-4" />
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className={`${fieldClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-500">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        )}

        {mode === 'login' && (
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none min-h-8 sm:min-h-10">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() =>
                setForgotHint('Password reset is not enabled yet. Use Settings → Help & Support to contact us.')
              }
              className="text-sm font-semibold text-brand-600 dark:text-cyan-400 hover:underline min-h-8 sm:min-h-10"
            >
              Forgot password?
            </button>
          </div>
        )}

        {forgotHint && mode === 'login' && (
          <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
            {forgotHint}
          </p>
        )}

        <Button type="submit" variant="primary" fullWidth disabled={isSubmitting} className="!h-11 sm:!h-12 !text-sm !font-bold mt-0.5 sm:mt-1">
          {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      {showGuestSkip && mode === 'login' && (
        <button
          type="button"
          onClick={onGuestSkip}
          className="mt-2 sm:mt-3 w-full h-9 sm:h-11 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          Continue as guest
        </button>
      )}

      <p className="hidden sm:block mt-3 sm:mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
        <button
          type="button"
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          className="ml-1.5 font-semibold text-brand-600 dark:text-cyan-400 hover:underline"
        >
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </p>
    </div>
  );
};

const Field = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  icon,
  type = 'text',
}) => (
  <div>
    <label htmlFor={name} className="block text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5">
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={fieldClass}
      />
    </div>
    {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
  </div>
);
