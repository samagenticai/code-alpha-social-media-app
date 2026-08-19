import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PostCard } from '../feed/PostCard';
import { PostSkeleton } from '../ui/Skeleton';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { VerifiedBadge } from '../ui/Badge';
import { IconFlame, IconHeart, IconComment, IconShare, IconPlay, IconTrendingUp, IconVideo, IconUsers } from '../ui/Icons';
import { trendingService } from '../../services/trendingService';
import { userService } from '../../services/userService';

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'posts', label: 'Posts' },
  { id: 'reels', label: 'Reels' },
  { id: 'creators', label: 'Creators' },
];

const PERIOD_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
];

const SECTION_META = {
  trendingNow: {
    icon: IconFlame,
    iconColor: 'text-amber-500 dark:text-amber-400',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    title: 'Trending Now',
    subtitle: 'Posts receiving the highest engagement right now',
  },
  rising: {
    icon: IconTrendingUp,
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    title: 'Rising',
    subtitle: 'Content rapidly gaining likes and comments',
  },
  trendingReels: {
    icon: IconVideo,
    iconColor: 'text-violet-500 dark:text-violet-400',
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
    title: 'Trending Reels',
    subtitle: 'Popular reels from creators across the platform',
  },
  trendingCreators: {
    icon: IconUsers,
    iconColor: 'text-cyan-500 dark:text-cyan-400',
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    title: 'Trending Creators',
    subtitle: 'Creators whose recent content is performing best',
  },
};

const FilterChip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
      active
        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25'
        : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-cyan-500/50'
    }`}
  >
    {children}
  </button>
);

const SectionHeader = ({ icon: Icon, iconColor, iconBg, title, subtitle }) => (
  <div className="mb-3 sm:mb-4 flex items-center gap-3">
    {Icon && (
      <div className={`p-2 sm:p-2.5 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0 shadow-xs`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
    )}
    <div>
      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
        {title}
      </h3>
      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

const TrendingReelCard = ({ reel, onOpenReels }) => {
  const thumb =
    reel.thumbnailUrl ||
    reel.video?.thumbnail ||
    reel.images?.[0] ||
    '';

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      onClick={() => onOpenReels?.(reel)}
      className="group text-left glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-brand-500/40 transition-all"
    >
      <div className="relative aspect-[9/14] bg-slate-100 dark:bg-slate-900">
        {thumb ? (
          <img src={thumb} alt={reel.caption || 'Reel'} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <IconPlay className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Avatar src={reel.user?.avatar} alt={reel.user?.fullName} size="xs" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{reel.user?.fullName}</p>
              <p className="text-[10px] text-white/70 truncate">@{reel.user?.username}</p>
            </div>
          </div>
          <p className="text-[11px] text-white/90 line-clamp-2">{reel.caption || reel.content}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-white/80">
            <span className="flex items-center gap-1"><IconComment className="w-3 h-3" /> Comment</span>
            <span className="flex items-center gap-1"><IconShare className="w-3 h-3" /> Share</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
};

const TrendingCreatorCard = ({ creator, isGuest, onRequireAuth, onFollowChange }) => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(creator.isFollowing || false);
  const [followPending, setFollowPending] = useState(creator.followRequestPending || false);
  const [followDisabled, setFollowDisabled] = useState(creator.followDisabled || false);
  const [followersCount, setFollowersCount] = useState(creator.followersCount || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(creator.isFollowing || false);
    setFollowPending(creator.followRequestPending || false);
    setFollowDisabled(creator.followDisabled || false);
    setFollowersCount(creator.followersCount || 0);
  }, [creator]);

  const handleFollow = async () => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await userService.toggleFollowUser(creator.id);
      setIsFollowing(res.isFollowing);
      setFollowPending(res.followRequestPending || false);
      setFollowDisabled(res.followDisabled || false);
      setFollowersCount(res.followersCount ?? followersCount);
      onFollowChange?.(creator.id, res.isFollowing, res.followersCount);
    } catch (err) {
      console.error('Follow failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const username = (creator.username || '').replace('@', '');

  return (
    <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 hover:border-brand-500/30 transition-all">
      <div
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        onClick={() => navigate(`/profile/${username.toLowerCase()}`)}
      >
        <Avatar src={creator.avatar || creator.profileImage} alt={creator.fullName} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{creator.fullName}</h4>
            {creator.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">@{username}</p>
          {creator.title && (
            <p className="text-[10px] text-brand-600 dark:text-cyan-400 truncate mt-0.5">{creator.title}</p>
          )}
          <p className="text-[10px] text-slate-400 mt-0.5">{followersCount.toLocaleString()} followers</p>
        </div>
      </div>
      <Button
        type="button"
        variant={isFollowing ? 'secondary' : followPending ? 'secondary' : 'primary'}
        size="sm"
        onClick={handleFollow}
        disabled={loading || followDisabled}
        className="flex-shrink-0 text-xs font-bold"
      >
        {followDisabled ? 'Unavailable' : isFollowing ? 'Following' : followPending ? 'Requested' : 'Follow'}
      </Button>
    </div>
  );
};

const LoadMoreButton = ({ loading, hasMore, onClick }) => {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center pt-3">
      <Button type="button" variant="secondary" size="sm" onClick={onClick} disabled={loading} className="font-bold">
        {loading ? 'Loading…' : 'Load More'}
      </Button>
    </div>
  );
};

export const TrendingView = ({
  user,
  isGuest,
  onRequireAuth,
  onPostUpdate,
  onEditPost,
  onDeletePost,
  onOpenReels,
}) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sections, setSections] = useState({
    trendingNow: { items: [], page: 1, hasMore: false, total: 0 },
    rising: { items: [], page: 1, hasMore: false, total: 0 },
    trendingReels: { items: [], page: 1, hasMore: false, total: 0 },
    trendingCreators: { items: [], page: 1, hasMore: false, total: 0 },
  });
  const [sectionLoading, setSectionLoading] = useState(null);

  const loadTrending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await trendingService.getTrending({
        type: typeFilter,
        period: periodFilter,
        page: 1,
        limit: 8,
      });

      setSections({
        trendingNow: res.trendingNow || { items: [], page: 1, hasMore: false, total: 0 },
        rising: res.rising || { items: [], page: 1, hasMore: false, total: 0 },
        trendingReels: res.trendingReels || { items: [], page: 1, hasMore: false, total: 0 },
        trendingCreators: res.trendingCreators || { items: [], page: 1, hasMore: false, total: 0 },
      });
    } catch (err) {
      setError(err.message || 'Failed to load trending content');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, periodFilter]);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  const loadMoreSection = async (sectionKey, apiSection) => {
    const current = sections[sectionKey];
    if (!current?.hasMore || sectionLoading) return;

    setSectionLoading(sectionKey);
    try {
      const nextPage = (current.page || 1) + 1;
      const res = await trendingService.loadSection(apiSection, {
        type: typeFilter,
        period: periodFilter,
        page: nextPage,
        limit: 8,
      });

      setSections((prev) => ({
        ...prev,
        [sectionKey]: {
          ...res,
          items: [...(prev[sectionKey]?.items || []), ...(res.items || [])],
        },
      }));
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setSectionLoading(null);
    }
  };

  const showPosts = typeFilter === 'all' || typeFilter === 'posts';
  const showReels = typeFilter === 'all' || typeFilter === 'reels';
  const showCreators = typeFilter === 'all' || typeFilter === 'creators';

  return (
    <div className="space-y-5 sm:space-y-8 animate-fadeIn max-w-4xl mx-auto w-full">
      {/* Sleek Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((f) => (
            <FilterChip key={f.id} active={typeFilter === f.id} onClick={() => setTypeFilter(f.id)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200/80 dark:border-slate-800">
          {PERIOD_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setPeriodFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                periodFilter === f.id
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {error && !loading && (
        <div className="glass-panel p-6 rounded-2xl border border-red-200 dark:border-red-900/50 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button type="button" variant="secondary" size="sm" onClick={loadTrending} className="mt-3 font-bold">
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          {showPosts && (
            <>
              <section>
                <SectionHeader {...SECTION_META.trendingNow} />
                {sections.trendingNow.items.length > 0 ? (
                  <div className="space-y-4">
                    {sections.trendingNow.items.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        user={user}
                        isGuest={isGuest}
                        onRequireAuth={onRequireAuth}
                        onEditPost={onEditPost}
                        onDeletePost={onDeletePost}
                        onPostUpdate={onPostUpdate}
                      />
                    ))}
                    <LoadMoreButton
                      loading={sectionLoading === 'trendingNow'}
                      hasMore={sections.trendingNow.hasMore}
                      onClick={() => loadMoreSection('trendingNow', 'trending_now')}
                    />
                  </div>
                ) : (
                  <EmptyState message="No trending posts yet. Be the first to spark engagement!" />
                )}
              </section>

              <section>
                <SectionHeader {...SECTION_META.rising} />
                {sections.rising.items.length > 0 ? (
                  <div className="space-y-4">
                    {sections.rising.items.map((post) => (
                      <PostCard
                        key={`rising-${post.id}`}
                        post={post}
                        user={user}
                        isGuest={isGuest}
                        onRequireAuth={onRequireAuth}
                        onEditPost={onEditPost}
                        onDeletePost={onDeletePost}
                        onPostUpdate={onPostUpdate}
                      />
                    ))}
                    <LoadMoreButton
                      loading={sectionLoading === 'rising'}
                      hasMore={sections.rising.hasMore}
                      onClick={() => loadMoreSection('rising', 'rising')}
                    />
                  </div>
                ) : (
                  <EmptyState message="Nothing rising yet — check back as engagement picks up." />
                )}
              </section>
            </>
          )}

          {showReels && (
            <section>
              <SectionHeader {...SECTION_META.trendingReels} />
              {sections.trendingReels.items.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    {sections.trendingReels.items.map((reel) => (
                      <TrendingReelCard key={reel.id} reel={reel} onOpenReels={onOpenReels} />
                    ))}
                  </div>
                  <LoadMoreButton
                    loading={sectionLoading === 'trendingReels'}
                    hasMore={sections.trendingReels.hasMore}
                    onClick={() => loadMoreSection('trendingReels', 'reels')}
                  />
                </>
              ) : (
                <EmptyState message="No trending reels yet. Create a reel to get discovered!" />
              )}
            </section>
          )}

          {showCreators && (
            <section>
              <SectionHeader {...SECTION_META.trendingCreators} />
              {sections.trendingCreators.items.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sections.trendingCreators.items.map((creator) => (
                      <TrendingCreatorCard
                        key={creator.id}
                        creator={creator}
                        isGuest={isGuest}
                        onRequireAuth={onRequireAuth}
                      />
                    ))}
                  </div>
                  <LoadMoreButton
                    loading={sectionLoading === 'trendingCreators'}
                    hasMore={sections.trendingCreators.hasMore}
                    onClick={() => loadMoreSection('trendingCreators', 'creators')}
                  />
                </>
              ) : (
                <EmptyState message="No trending creators yet. Start posting to climb the charts!" />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{message}</p>
  </div>
);

export default TrendingView;
