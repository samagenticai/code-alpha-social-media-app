import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { FollowButton } from '../profile/FollowButton';
import { CloudinaryReelPlayer } from './CloudinaryReelPlayer';
import { ReelCommentsDrawer } from './ReelCommentsDrawer';
import { CreateReelModal } from './CreateReelModal';
import { ReelVideoControls } from './ReelVideoControls';
import { IconHeart, IconComment, IconShare, IconDots, IconEdit, IconTrash, IconLocation, IconFlag } from '../ui/Icons';
import { BRAND } from '../../config/brand';
import { userService } from '../../services/userService';
import { ReportModal } from '../moderation/ReportModal';
import {
  hasReelVideo,
  resolveReelThumbnail,
  resolveReelPlaybackUrl,
} from '../../utils/reelMedia';
import { stopAllReelMedia } from '../../utils/reelMediaControl';

const ReelSlide = React.memo(({
  reel,
  isActive,
  isNear = false,
  currentUser,
  isGuest,
  onRequireAuth,
  onReelUpdate,
  onReelDelete,
  isMuted,
  onToggleMute,
  volume = 0.8,
  onVolumeChange,
  onEditReel,
  isPlaying = true,
  onTogglePlay,
}) => {
  const [isLiked, setIsLiked] = useState(reel.isLiked || false);
  const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [following, setFollowing] = useState(reel.user?.isFollowing || false);
  const [followPending, setFollowPending] = useState(reel.user?.followRequestPending || false);
  const [followDisabled, setFollowDisabled] = useState(reel.user?.followDisabled || false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportNotice, setReportNotice] = useState('');
  const [showCenterControl, setShowCenterControl] = useState(false);
  const centerControlTimer = useRef(null);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const videoUrl = resolveReelPlaybackUrl(reel, { mobile: typeof window !== 'undefined' && window.innerWidth < 640 });
  const thumbnail = resolveReelThumbnail(reel);
  const author = reel.user || reel.author || {};
  const reelId = reel.id || reel._id;
  const myId = currentUser?.id?.toString?.() || currentUser?._id?.toString?.() || '';
  const authorId = author.id?.toString?.() || author._id?.toString?.() || reel.authorId?.toString?.() || '';
  const isOwnReel = myId && authorId && myId === authorId;
  const canManage = isOwnReel && !reel.isDemo;

  useEffect(() => {
    setIsLiked(reel.isLiked || false);
    setLikesCount(reel.likesCount || 0);
    setFollowing(reel.user?.isFollowing || false);
    setFollowPending(reel.user?.followRequestPending || false);
    setFollowDisabled(reel.user?.followDisabled || false);
  }, [reel]);

  const handleLike = async () => {
    if (isGuest) { onRequireAuth?.(); return; }
    if (likeLoading) return;
    setLikeLoading(true);
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      const res = await userService.toggleLikeReel(reelId);
      if (res.success) {
        setIsLiked(res.isLiked);
        setLikesCount(res.likesCount);
        if (res.reel) onReelUpdate?.(res.reel);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFollow = async () => {
    if (isGuest) { onRequireAuth?.(); return; }
    const aid = author.id || author._id;
    if (!aid) return;
    try {
      const res = await userService.toggleFollowUser(aid);
      if (res.success !== false) {
        setFollowing(res.isFollowing);
        setFollowPending(res.followRequestPending || false);
        setFollowDisabled(res.followDisabled || false);
      }
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/feed?tab=videos&reel=${reelId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${author.fullName} on ${BRAND.name}`, url });
        return;
      }
    } catch { /* fall through */ }
    await navigator.clipboard?.writeText(url);
  };

  const handleMuteToggle = () => {
    onToggleMute?.();
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await userService.deleteReel(reelId);
      if (res.success) {
        onReelDelete?.(reelId);
      }
    } catch (err) {
      console.error('Delete reel failed:', err);
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
      setMenuOpen(false);
    }
  };

  const handleVideoTap = (e) => {
    e.stopPropagation();
    onTogglePlay?.();
    setShowCenterControl(true);
    if (centerControlTimer.current) clearTimeout(centerControlTimer.current);
    centerControlTimer.current = setTimeout(() => setShowCenterControl(false), 700);
  };

  useEffect(() => () => {
    if (centerControlTimer.current) clearTimeout(centerControlTimer.current);
  }, []);

  const handleReportClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    if (isPlaying) onTogglePlay?.();
    setShowReportModal(true);
  };

  const goToProfile = () => {
    const un = author.username || author.handle?.replace('@', '');
    if (un) navigate(`/profile/${un}`);
  };

  const hasMedia = hasReelVideo(reel) || Boolean(videoUrl);
  if (!hasMedia) return null;

  const caption = reel.caption || reel.content;
  const hashtagLine = (reel.hashtags || []).map((t) => `#${t}`).join(' ');

  return (
    <section
      className="reel-slide"
      data-reel-id={reelId}
    >
      <div ref={containerRef} className="reel-card">
        <div className="reel-card-inner relative touch-manipulation" onClick={isActive ? handleVideoTap : undefined}>
          {(isActive || isNear) ? (
            <CloudinaryReelPlayer
              videoRef={videoRef}
              videoUrl={videoUrl}
              thumbnailUrl={thumbnail}
              isActive={isActive}
              isMuted={isMuted}
              volume={volume}
              isPlaying={isPlaying}
            />
          ) : (
            <div className="relative w-full h-full bg-black">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt=""
                  className="w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full bg-slate-950" />
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none z-[5] rounded-[inherit]" />

          {!isPlaying && isActive && (
            <div className="absolute inset-0 bg-black/20 pointer-events-none z-[8] rounded-[inherit]" aria-hidden />
          )}

          <ReelVideoControls
            videoRef={videoRef}
            containerRef={containerRef}
            isActive={isActive}
            isMuted={isMuted}
            onToggleMute={handleMuteToggle}
            volume={volume}
            onVolumeChange={onVolumeChange}
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
            canManage={canManage}
            showCenterPlayPause={isActive && (showCenterControl || !isPlaying)}
            centerIsPlaying={isPlaying}
          />
        </div>

        {canManage && (
          <div className="absolute top-2.5 left-2.5 z-30">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <IconDots className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setMenuOpen(false); setDeleteConfirm(false); }} />
                <div className="absolute top-10 left-0 z-50 min-w-[140px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onEditReel?.(reel); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <IconEdit className="w-3.5 h-3.5" /> Edit Reel
                  </button>
                  {!deleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      <IconTrash className="w-3.5 h-3.5" /> Delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700"
                    >
                      {deleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="absolute right-2 sm:right-3 reel-overlay-actions flex flex-col items-center gap-3 sm:gap-3.5 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleLike(); }}
            className="flex flex-col items-center gap-1 group touch-manipulation"
            aria-label={isLiked ? 'Unlike' : 'Like'}
            aria-pressed={isLiked}
          >
            <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isLiked ? 'bg-rose-500/90 text-white scale-105' : 'bg-black/50 text-white group-hover:bg-black/70'
              }`}>
              <IconHeart className="w-4 h-4 sm:w-5 sm:h-5" filled={isLiked} />
            </span>
            {/* Public viewers: no numeric like count. Owner sees total on their own reel. */}
            <span className="text-[10px] font-bold text-white drop-shadow leading-none">
              {isOwnReel ? likesCount : (isLiked ? 'Liked' : 'Like')}
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}
            className="flex flex-col items-center gap-1 group touch-manipulation"
            aria-label="Open comments"
          >
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-black/70">
              <IconComment className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[10px] font-bold text-white drop-shadow leading-none">Comment</span>
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleShare(); }} className="flex flex-col items-center gap-1 group touch-manipulation">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-black/70">
              <IconShare className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[10px] font-bold text-white drop-shadow leading-none">Share</span>
          </button>
          {!isOwnReel && (
            <button
              type="button"
              onClick={handleReportClick}
              className="flex flex-col items-center gap-1 group touch-manipulation pointer-events-auto"
              aria-label="Report reel"
            >
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-rose-500/80 transition-colors">
                <IconFlag className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </span>
              <span className="text-[10px] font-bold text-white drop-shadow leading-none">Report</span>
            </button>
          )}
        </div>

        <div className="absolute left-0 right-0 bottom-0 z-20 text-white reel-overlay-bottom pointer-events-none">
          <div className="reel-meta-panel px-3 pb-0">
            <div className="flex items-center gap-2 min-w-0">
              <button type="button" onClick={goToProfile} className="pointer-events-auto flex-shrink-0">
                <Avatar src={author.avatar || author.profileImage} size="sm" className="!w-9 !h-9 ring-2 ring-white/30" />
              </button>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={goToProfile}
                  className="text-sm font-bold truncate drop-shadow-md hover:underline pointer-events-auto text-left block w-full leading-tight"
                >
                  {author.fullName || author.name || 'User'}
                </button>
                <button
                  type="button"
                  onClick={goToProfile}
                  className="text-[11px] text-white/75 truncate pointer-events-auto text-left block w-full leading-tight mt-0.5"
                >
                  @{author.username || author.handle?.replace('@', '') || 'user'}
                </button>
              </div>
              {!isOwnReel && (
                <div className="pointer-events-auto flex-shrink-0 self-center">
                  <FollowButton
                    isFollowing={following}
                    followRequestPending={followPending}
                    followDisabled={followDisabled}
                    onToggleFollow={handleFollow}
                    className="!py-1 !px-3 !text-[10px] !whitespace-nowrap"
                  />
                </div>
              )}
            </div>
            {caption && (
              <p className="text-xs leading-snug line-clamp-2 drop-shadow-md mt-2 pointer-events-none">{caption}</p>
            )}
            {hashtagLine && (
              <p className="text-[10px] text-cyan-300/90 mt-1 line-clamp-1 pointer-events-none">{hashtagLine}</p>
            )}
            {reel.location && (
              <p className="text-[10px] text-white/70 mt-1 flex items-center gap-1 pointer-events-none">
                <IconLocation className="w-3 h-3 flex-shrink-0" /> {reel.location}
              </p>
            )}
          </div>
        </div>
      </div>

      <ReelCommentsDrawer
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        reel={reel}
        currentUser={currentUser}
        isGuest={isGuest}
        onRequireAuth={onRequireAuth}
        onReelUpdate={onReelUpdate}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="reel"
        targetId={reelId}
        targetLabel={`Reel by ${author.fullName || author.name || 'user'}`}
        onSubmitted={() => {
          setReportNotice('Report submitted. Thank you for helping keep the community safe.');
          setTimeout(() => setReportNotice(null), 4000);
        }}
      />

      {reportNotice && (
        <div className="absolute top-14 inset-x-4 z-40 px-3 py-2 rounded-xl bg-emerald-600/90 backdrop-blur-md text-white text-xs font-semibold text-center shadow-lg pointer-events-none">
          {reportNotice}
        </div>
      )}
    </section>
  );
});

const REELS_MUTE_KEY = 'pulse_reels_muted';

export const ReelsViewer = ({
  currentUser,
  isGuest,
  onRequireAuth,
  initialReelId,
  publishedReel,
  onPublishedReelConsumed,
  onOpenCreateReel,
}) => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return sessionStorage.getItem(REELS_MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [volume, setVolume] = useState(0.8);
  const [editReel, setEditReel] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const containerRef = useRef(null);
  const skipInitialStopRef = useRef(true);

  const handleEditReel = useCallback((r) => {
    setEditReel(r);
    setEditOpen(true);
  }, []);

  const loadReels = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userService.getReels();
      if (res.success && res.reels?.length) {
        const ordered = [...res.reels].sort((a, b) => {
          const ao = a.reelOrder ?? Number.MAX_SAFE_INTEGER;
          const bo = b.reelOrder ?? Number.MAX_SAFE_INTEGER;
          if (ao !== bo) return ao - bo;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        setReels(ordered);
        if (initialReelId) {
          const idx = ordered.findIndex((r) => (r.id || r._id) === initialReelId);
          if (idx >= 0) setActiveIndex(idx);
        }
      } else {
        setReels([]);
      }
    } catch (err) {
      setError('Could not load reels. Try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [initialReelId]);

  useEffect(() => { loadReels(); }, [loadReels]);

  useEffect(() => {
    if (!publishedReel) return;
    setReels((prev) => {
      const id = publishedReel.id || publishedReel._id;
      return [publishedReel, ...prev.filter((r) => (r.id || r._id) !== id)];
    });
    setActiveIndex(0);
    setTimeout(() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 80);
    onPublishedReelConsumed?.();
  }, [publishedReel, onPublishedReelConsumed]);

  const activeIndexRef = useRef(0);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  useEffect(() => {
    if (skipInitialStopRef.current) {
      skipInitialStopRef.current = false;
      setIsPlaying(true);
      return;
    }
    stopAllReelMedia();
    setIsPlaying(true);
  }, [activeIndex]);

  useEffect(() => {
    return () => {
      stopAllReelMedia();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !reels.length) return;

    const slides = container.querySelectorAll('.reel-slide');
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = -1;
        let bestRatio = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.dataset.reelIndex);
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIdx = idx;
          }
        });
        if (bestIdx >= 0 && bestRatio >= 0.55 && bestIdx !== activeIndexRef.current) {
          stopAllReelMedia();
          activeIndexRef.current = bestIdx;
          setActiveIndex(bestIdx);
        }
      },
      { root: container, threshold: [0.55, 0.65, 0.75, 0.9] }
    );

    slides.forEach((slide, idx) => {
      slide.dataset.reelIndex = String(idx);
      observer.observe(slide);
    });

    return () => observer.disconnect();
  }, [reels.length]);

  useEffect(() => {
    if (initialReelId && reels.length && containerRef.current) {
      const idx = reels.findIndex((r) => (r.id || r._id) === initialReelId);
      if (idx >= 0) {
        containerRef.current.querySelectorAll('.reel-slide')[idx]?.scrollIntoView({ behavior: 'instant' });
        setActiveIndex(idx);
      }
    }
  }, [initialReelId, reels, loading]);

  const handleReelUpdate = (updated) => {
    const id = updated.id || updated._id;
    setReels((prev) => prev.map((r) => ((r.id || r._id) === id ? { ...r, ...updated } : r)));
  };

  const handleReelDelete = (reelId) => {
    setReels((prev) => prev.filter((r) => (r.id || r._id) !== reelId));
    setActiveIndex((i) => Math.max(0, Math.min(i, reels.length - 2)));
  };

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      try {
        sessionStorage.setItem(REELS_MUTE_KEY, String(nextMuted));
      } catch { /* ignore */ }
      if (!nextMuted && volume === 0) {
        setVolume(0.8);
      }
      return nextMuted;
    });
  }, [volume]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      // Immediately sync the active DOM video — don't wait only on React state
      const container = containerRef.current;
      const activeSlide = container?.querySelector(`.reel-slide[data-reel-index="${activeIndexRef.current}"]`);
      const video = activeSlide?.querySelector('video');
      if (video) {
        if (next) {
          document.querySelectorAll('.reel-slide video').forEach((v) => {
            if (v !== video) {
              try {
                v.pause();
              } catch {
                /* ignore */
              }
            }
          });
          video.play().catch(() => {});
        } else {
          try {
            video.pause();
          } catch {
            /* ignore */
          }
        }
      }
      return next;
    });
  }, []);

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (newVol > 0) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  };

  if (loading) {
    return (
      <div className="relative -mx-3 sm:-mx-0 md:-mx-4 h-full min-h-0 overflow-hidden flex items-center justify-center bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-2xl p-4">
        {/* Ambient Dark Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-950/40 via-slate-950 to-purple-950/40 opacity-80" />
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xl" />

        {/* 9:16 Reel Stage Skeleton Loader */}
        <div className="relative z-10 w-full max-w-[380px] aspect-[9/16] max-h-[min(100%,calc(100vh-140px))] rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 flex flex-col justify-between overflow-hidden shadow-2xl animate-pulse">
          {/* Top Bar Skeleton */}
          <div className="flex items-center justify-between">
            <div className="w-20 h-5 rounded-full bg-white/10" />
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div className="w-8 h-8 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Center Brand Pulse */}
          <div className="flex flex-col items-center justify-center gap-3 my-auto">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-14 h-14 rounded-full bg-brand-500/20 animate-ping" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-cyan flex items-center justify-center shadow-lg shadow-brand-500/30 text-white font-extrabold text-xl">
                P
              </div>
            </div>
            <p className="text-xs font-bold tracking-wider text-slate-300 uppercase animate-pulse">
              Loading Reel Stream...
            </p>
          </div>

          {/* Bottom & Action Skeleton */}
          <div className="flex items-end justify-between">
            <div className="space-y-2 flex-1 pr-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20" />
                <div className="space-y-1">
                  <div className="w-24 h-3 rounded bg-white/20" />
                  <div className="w-16 h-2 rounded bg-white/10" />
                </div>
              </div>
              <div className="w-3/4 h-2.5 rounded bg-white/15" />
              <div className="w-1/2 h-2.5 rounded bg-white/10" />
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15" />
              <div className="w-9 h-9 rounded-full bg-white/15" />
              <div className="w-9 h-9 rounded-full bg-white/15" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500">{error}</p>
        <button type="button" onClick={loadReels} className="mt-3 text-sm font-bold text-brand-600">Retry</button>
      </div>
    );
  }

  if (!reels.length) {
    return (
      <div className="glass-panel p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 mx-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">No reels yet.</p>
        <p className="text-xs text-slate-400 mt-1">Use Create → Create Reel to publish your first video.</p>
        {onOpenCreateReel && (
          <button type="button" onClick={onOpenCreateReel} className="mt-4 text-sm font-bold text-brand-600">
            Create Reel
          </button>
        )}
      </div>
    );
  }

  const activeReel = reels[activeIndex];
  const activeThumb = activeReel ? resolveReelThumbnail(activeReel) : '';

  return (
    <div className="reels-viewport-root relative h-full min-h-0 overflow-hidden bg-slate-950 md:rounded-2xl md:border md:border-slate-800/80 md:shadow-2xl">
      <div className="reels-ambient-bg absolute inset-0 overflow-hidden pointer-events-none z-0 hidden md:block">
        {activeThumb ? (
          <img
            src={activeThumb}
            alt=""
            className="w-full h-full object-cover opacity-35 scale-105 filter blur-xl"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-brand-900/40 via-slate-950 to-purple-900/40" />
        )}
        <div className="absolute inset-0 bg-slate-950/40" />
      </div>

      <CreateReelModal
        isOpen={editOpen}
        onClose={() => { setEditOpen(false); setEditReel(null); }}
        editReel={editReel}
        onUpdated={handleReelUpdate}
        currentUser={currentUser}
      />

      <div
        ref={containerRef}
        className="reels-scroll-container relative z-10 no-scrollbar"
      >
        {reels.map((reel, idx) => (
          <ReelSlide
            key={reel.id || reel._id}
            reel={reel}
            isActive={idx === activeIndex}
            isNear={Math.abs(idx - activeIndex) <= 1}
            isPlaying={idx === activeIndex && isPlaying}
            onTogglePlay={handleTogglePlay}
            currentUser={currentUser}
            isGuest={isGuest}
            onRequireAuth={onRequireAuth}
            onReelUpdate={handleReelUpdate}
            onReelDelete={handleReelDelete}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onEditReel={handleEditReel}
          />
        ))}
      </div>
    </div>
  );
};
