import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  className = '',
  onClick,
  active = false,
  disabled = false,
  type = 'button'
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    icon: 'p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-brand-600 via-brand-purple to-brand-cyan text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:brightness-110 border border-white/10',
    secondary: 'bg-slate-200 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700/60 backdrop-blur-md',
    glass: 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 backdrop-blur-lg',
    outline: 'border border-slate-300 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-cyan-400 bg-transparent',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/30 shadow-lg shadow-rose-600/20',
    activeAction: 'bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/40 shadow-inner'
  };

  const selectedVariant = active ? variantStyles.activeAction : variantStyles[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${selectedVariant} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
      {children}
    </button>
  );
};
