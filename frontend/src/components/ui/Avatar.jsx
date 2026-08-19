import React, { useState, useEffect } from 'react';

const sizeMap = {
  xs: 'w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs',
  sm: 'w-7 h-7 sm:w-9 sm:h-9 text-xs sm:text-sm',
  md: 'w-9 h-9 sm:w-11 sm:h-11 text-xs sm:text-base',
  lg: 'w-11 h-11 sm:w-14 sm:h-14 text-sm sm:text-lg',
  xl: 'w-16 h-16 sm:w-24 sm:h-24 text-xl sm:text-2xl',
  // Profile DP — Facebook-style prominence (keeps 1:1 circle via aspect-square)
  '2xl': 'w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 text-2xl sm:text-3xl',
};

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

export const Avatar = ({
  src,
  alt = 'User Avatar',
  size = 'md',
  online = false,
  storyRing = false,
  className = '',
  onClick
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const imageSource = (!src || imgError) ? DEFAULT_AVATAR : src;

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 min-w-0 cursor-pointer select-none rounded-full overflow-visible ${sizeMap[size] || sizeMap.md} ${className}`}
      style={{ aspectRatio: '1 / 1' }}
      onClick={onClick}
    >
      <div
        className={`w-full h-full rounded-full transition-transform duration-200 hover:scale-105 flex items-center justify-center aspect-square overflow-hidden ${
          storyRing
            ? 'bg-gradient-to-tr from-brand-cyan via-brand-purple to-brand-pink p-[2.5px] shadow-md shadow-brand-purple/20'
            : 'p-0'
        }`}
        style={{ aspectRatio: '1 / 1' }}
      >
        <img
          src={imageSource}
          alt={alt || 'User Avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#070a12] bg-slate-200 dark:bg-slate-900 block"
          style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
          loading="lazy"
        />
      </div>

      {online && (
        <span className="absolute bottom-[5%] right-[5%] block w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#070a12] live-pulse z-20" />
      )}
    </div>
  );
};

