import React from 'react';

/**
 * Base Shimmer Skeleton Element
 */
export const Skeleton = ({ className = '', style = {} }) => {
  return (
    <div
      className={`skeleton-shimmer bg-slate-200/80 dark:bg-slate-800/80 rounded-lg overflow-hidden relative ${className}`}
      style={style}
    />
  );
};

/**
 * Post-shaped skeleton — matches real PostCard dimensions (theme-aware)
 * @param {'media'|'video'|'image'|'text'} variant
 */
export const PostSkeleton = ({ variant = 'media' }) => {
  const showMedia = variant !== 'text';
  const mediaClass =
    variant === 'image'
      ? 'post-image-container post-image-container--single'
      : 'post-video-container';

  return (
    <div
      className="post-card post-skeleton rounded-xl sm:rounded-2xl p-3.5 sm:p-5 mb-3.5 sm:mb-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden"
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 !rounded-full flex-shrink-0" />
          <div className="space-y-1.5 min-w-[120px]">
            <Skeleton className="h-3 w-28 sm:w-32 rounded-md" />
            <Skeleton className="h-2.5 w-16 sm:w-20 rounded-md" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 !rounded-full" />
      </div>

      <div className="space-y-2 mb-3 sm:mb-4">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-[75%] rounded-md" />
      </div>

      {showMedia && (
        <div className={`${mediaClass} relative w-full rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-slate-200/60 dark:border-slate-800/60`}>
          <Skeleton className="w-full h-full !rounded-none absolute inset-0" />
        </div>
      )}

      <div className="flex items-center justify-between py-2 border-t border-b border-slate-200/60 dark:border-slate-800/60 mb-2.5 sm:mb-3">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>

      <div className="flex items-center justify-between gap-1">
        <Skeleton className="h-8 flex-1 !rounded-lg sm:!rounded-xl" />
        <Skeleton className="h-8 flex-1 !rounded-lg sm:!rounded-xl" />
        <Skeleton className="h-8 flex-1 !rounded-lg sm:!rounded-xl" />
        <Skeleton className="h-8 flex-1 !rounded-lg sm:!rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Stories Carousel Skeleton
 */
export const StoryCarouselSkeleton = () => {
  return (
    <div className="flex items-center gap-3 overflow-hidden py-1 mb-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-0.5 border-2 border-slate-200/70 dark:border-slate-800/70">
            <Skeleton className="w-full h-full !rounded-full" />
          </div>
          <Skeleton className="h-2 w-12 rounded-md" />
        </div>
      ))}
    </div>
  );
};

/**
 * Profile Page Skeleton
 */
export const ProfileSkeleton = () => {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="glass-panel rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80">
        {/* Cover image placeholder */}
        <Skeleton className="h-28 sm:h-44 w-full !rounded-none" />
        <div className="p-4 sm:p-6 relative pt-0">
          <div className="flex justify-between items-end -mt-10 sm:-mt-14 mb-4">
            <Skeleton className="w-20 h-20 sm:w-28 sm:h-28 !rounded-full ring-4 ring-white dark:ring-slate-900" />
            <Skeleton className="h-8 w-24 !rounded-xl" />
          </div>
          <div className="space-y-2 mb-4">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="h-3 w-[70%] rounded-md" />
          </div>
          {/* Stats Bar */}
          <div className="flex gap-6 pt-4 border-t border-slate-200/70 dark:border-slate-800/70">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
        </div>
      </div>

      {/* 3-column media grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="aspect-square !rounded-xl" />
        ))}
      </div>
    </div>
  );
};

/**
 * Notifications Skeleton
 */
export const NotificationSkeleton = () => {
  return (
    <div className="space-y-3 animate-fadeIn">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="glass-panel p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="w-10 h-10 !rounded-full flex-shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-[75%] rounded-md" />
              <Skeleton className="h-2.5 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="w-8 h-8 !rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};

/**
 * Explore / Search Skeleton
 */
export const ExploreSkeleton = () => {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Chips tags row */}
      <div className="flex gap-2 overflow-hidden py-1">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 !rounded-full flex-shrink-0" />
        ))}
      </div>
      {/* Grid items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] !rounded-2xl" />
        ))}
      </div>
    </div>
  );
};

/**
 * Conversation List Skeleton
 */
export const ConversationSkeleton = () => {
  return (
    <div className="space-y-2 p-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl">
          <Skeleton className="w-11 h-11 !rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-3.5 w-32 rounded-md" />
            <Skeleton className="h-2.5 w-48 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};
