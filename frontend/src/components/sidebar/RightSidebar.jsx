import React, { useEffect, useState } from 'react';
import { Avatar } from '../ui/Avatar';
import {
  IconPlus,
  IconVideo,
  IconBookmark,
  IconHeart,
  IconUser,
  IconGrid,
} from '../ui/Icons';
import { userService } from '../../services/userService';

const QuickActionButton = ({ icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/40 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 transition-all group touch-manipulation"
  >
    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
      <Icon className="w-4 h-4" />
    </span>
    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">{label}</span>
  </button>
);

const StatChip = ({ label, value, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex-1 min-w-0 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/70 hover:border-brand-500/30 transition-colors text-center touch-manipulation"
  >
    <p className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">{value}</p>
    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{label}</p>
  </button>
);

export const RightSidebar = ({
  onQuickAction,
  isGuest,
  onRequireAuth,
  currentUser,
  onTabChange,
}) => {
  const [savedCount, setSavedCount] = useState(0);
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    if (isGuest || !currentUser?.username) return;

    let cancelled = false;
    const loadSidebarData = async () => {
      try {
        const [savedRes, postsRes] = await Promise.all([
          userService.getSavedPosts().catch(() => ({ posts: [] })),
          userService.getUserPosts(currentUser.username).catch(() => ({ posts: [] })),
        ]);
        if (cancelled) return;
        setSavedCount(savedRes.posts?.length || 0);
        setRecentPosts((postsRes.posts || postsRes.data || []).slice(0, 3));
      } catch {
        /* ignore */
      }
    };

    loadSidebarData();
    return () => { cancelled = true; };
  }, [isGuest, currentUser?.username]);

  const handleAction = (action) => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    onQuickAction?.(action);
  };

  const goProfile = () => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    const un = currentUser?.username || currentUser?.handle?.replace('@', '') || 'user';
    onTabChange?.('profile');
    window.history.pushState({}, '', `/profile/${un}`);
  };

  const displayName = currentUser?.name || currentUser?.fullName || 'Your Profile';
  const postsCount = currentUser?.postsCount ?? 0;
  const followersCount = currentUser?.followers ?? currentUser?.followersCount ?? 0;
  const followingCount = currentUser?.following ?? currentUser?.followingCount ?? 0;

  return (
    <aside className="right-sidebar hidden lg:flex flex-col gap-4 w-72 xl:w-80 h-full py-4 px-2 overflow-y-auto no-scrollbar flex-shrink-0 border-l border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#070a12]/80 backdrop-blur-2xl transition-colors duration-300 z-20">
      {/* Quick Actions */}
      <section className="rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <QuickActionButton icon={IconPlus} label="Create Post" onClick={() => handleAction('create_post')} />
          <QuickActionButton icon={IconVideo} label="Create Reel" onClick={() => handleAction('create_reel')} />
          <QuickActionButton icon={IconGrid} label="Create Story" onClick={() => handleAction('create_story')} />
        </div>
      </section>

      {/* Your Activity */}
      {!isGuest && currentUser && (
        <section className="rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar src={currentUser.avatar || currentUser.profileImage} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                @{currentUser.username || currentUser.handle?.replace('@', '') || 'user'}
              </p>
            </div>
          </div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Your Activity
          </h3>
          <div className="flex gap-2">
            <StatChip label="Posts" value={postsCount} onClick={goProfile} />
            <StatChip label="Followers" value={followersCount} onClick={goProfile} />
            <StatChip label="Following" value={followingCount} onClick={goProfile} />
          </div>
        </section>
      )}

      {/* Saved */}
      <section className="rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Saved
        </h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleAction('saved_posts')}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70 hover:border-brand-500/30 transition-colors touch-manipulation"
          >
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <IconBookmark className="w-4 h-4" />
            </span>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Saved Posts</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{savedCount} saved</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleAction('view_reels')}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70 hover:border-brand-500/30 transition-colors touch-manipulation"
          >
            <span className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <IconVideo className="w-4 h-4" />
            </span>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Saved Reels</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Browse your video feed</p>
            </div>
          </button>
        </div>
      </section>

      {/* Recent */}
      {!isGuest && (
        <section className="rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Recent Posts
          </h3>
          {recentPosts.length === 0 ? (
            <div className="text-center py-4">
              <IconUser className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">No posts yet</p>
              <button
                type="button"
                onClick={() => handleAction('create_post')}
                className="mt-2 text-[11px] font-bold text-brand-600 dark:text-cyan-400 hover:underline"
              >
                Create your first post
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentPosts.map((post) => (
                <li
                  key={post.id || post._id}
                  className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60"
                >
                  {post.imageUrl || post.images?.[0] ? (
                    <img
                      src={post.imageUrl || post.images[0]}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <IconHeart className="w-4 h-4 text-brand-500" />
                    </span>
                  )}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-snug flex-1 min-w-0">
                    {post.content || post.caption || 'Your post'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isGuest && (
        <section className="rounded-2xl bg-gradient-to-br from-brand-600/10 to-cyan-500/10 border border-brand-500/20 p-4 text-center">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">Join the community</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">Sign in to track your activity and save content.</p>
          <button
            type="button"
            onClick={() => onRequireAuth?.()}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-md hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </section>
      )}
    </aside>
  );
};
