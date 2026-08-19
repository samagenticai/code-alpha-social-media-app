import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/Badge';
import { 
  IconClose, 
  IconHeart, 
  IconSend, 
  IconVolume,
  IconVolumeOff,
  IconPause, 
  IconPlay 
} from '../ui/Icons';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

// Eye icon
const IconEye = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

// Stats mini panel component
const StatsPanel = ({ storyId, isOpen, onClose, liveStats }) => {
  const stats = liveStats || { likesCount: 0, viewsCount: 0, likers: [], viewers: [] };
  const [activeTab, setActiveTab] = useState('viewers');

  if (!isOpen) return null;

  const list = activeTab === 'viewers' ? stats.viewers : stats.likers;

  return (
    <div className="absolute bottom-20 left-0 right-0 mx-4 z-40 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('viewers')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'viewers' ? 'bg-white/20 text-white' : 'text-slate-400'
            }`}
          >
            <IconEye className="w-3.5 h-3.5" />
            {stats.viewsCount} Viewers
          </button>
          <button
            onClick={() => setActiveTab('likers')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'likers' ? 'bg-rose-500/30 text-rose-300' : 'text-slate-400'
            }`}
          >
            <IconHeart className="w-3.5 h-3.5" />
            {stats.likesCount} Likes
          </button>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <IconClose className="w-4 h-4" />
        </button>
      </div>

      {/* User List */}
      <div className="max-h-44 overflow-y-auto no-scrollbar">
        {list.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-6">
            {activeTab === 'viewers' ? 'No views yet' : 'No likes yet'}
          </p>
        ) : (
          list.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
              <img
                src={u.avatar}
                alt={u.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-white truncate">{u.name}</p>
                  {u.verified && <VerifiedBadge className="w-3 h-3 text-cyan-400 flex-shrink-0" />}
                </div>
                <p className="text-[10px] text-slate-400 truncate">{u.handle}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const StoryViewer = ({ stories = [], initialIndex = 0, onClose, onReplyToStory, onDeleteStory }) => {
  const { displayUser } = useAuth();

  // Preserve carousel order — do not re-sort (would break initialIndex)
  const validStories = stories.filter((s) => !s.isCreate);
  
  const [userIndex, setUserIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [liveStats, setLiveStats] = useState({ viewsCount: 0, likesCount: 0, likers: [], viewers: [] });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const viewedRef = useRef(new Set());
  const videoRef = useRef(null);

  const currentStory = validStories[userIndex] || validStories[0];
  const storyUser = currentStory?.user || {};
  const storyDisplayName = storyUser.name || storyUser.fullName || 'User';
  const storyUsername = storyUser.username || storyUser.handle?.replace('@', '') || 'user';
  const storyAvatar = storyUser.avatar || storyUser.profileImage;
  const items = currentStory?.items || [
    {
      id: 'default',
      type: currentStory?.type || 'image',
      url: currentStory?.media,
      timestamp: 'Recently',
      caption: ''
    }
  ];
  const currentItem = items[itemIndex] || items[0];

  // Check if this story belongs to the currently logged-in user
  // Use isSelf from backend data first (most reliable), then fallback to ID comparison
  const currentUserId = displayUser?.id || displayUser?._id || '';
  const storyOwnerId = currentStory?.userId || currentStory?.user?.id || currentStory?.user?._id || '';
  const isOwnStory = !!(currentStory?.isSelf || (currentUserId && storyOwnerId && currentUserId === storyOwnerId));

  // Poll live stats for own stories every 3 seconds
  useEffect(() => {
    if (!isOwnStory || !currentItem?.id) return;

    const fetchLiveStats = async () => {
      const res = await userService.getStoryStats(currentItem.id);
      if (res.success) {
        setLiveStats(res);
        setLikesCount(res.likesCount);
      }
    };

    fetchLiveStats(); // immediate fetch
    const interval = setInterval(fetchLiveStats, 3000);
    return () => clearInterval(interval);
  }, [isOwnStory, currentItem?.id]);

  // Sync liked state and initial stats when story slide changes
  useEffect(() => {
    setProgress(0);
    setLiked(currentItem?.isLiked || false);
    setLikesCount(currentItem?.likesCount || 0);
    setLiveStats((prev) => ({
      ...prev,
      viewsCount: currentItem?.viewsCount ?? prev.viewsCount ?? 0,
      likesCount: currentItem?.likesCount ?? prev.likesCount ?? 0,
    }));
    setShowStats(false);
    setMediaReady(Boolean(currentItem?.bgGradient));
  }, [userIndex, itemIndex, currentItem?.id, currentItem?.bgGradient]);

  // Record view when story item opens (non-self only)
  useEffect(() => {
    if (!currentItem?.id || isOwnStory) return;
    if (viewedRef.current.has(currentItem.id)) return;
    viewedRef.current.add(currentItem.id);
    userService.viewStory(currentItem.id).catch(() => {});
  }, [currentItem?.id, isOwnStory]);

  const handleSendReply = (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !currentStory) return;

    if (onReplyToStory) {
      onReplyToStory({
        user: currentStory.user,
        storyId: currentStory.id || currentStory._id,
        media: currentItem.url || currentStory.media || '',
        caption: currentItem.caption || '',
        bgGradient: currentItem.bgGradient || currentStory.bgGradient || '',
        text: replyText.trim(),
      });
    }

    setReplyText('');
    onClose();
  };

  const handleLike = async () => {
    if (!currentItem?.id) return;
    const newLiked = !liked;
    const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setLiked(newLiked);
    setLikesCount(newCount);
    setLiveStats((prev) => ({ ...prev, likesCount: newCount }));

    try {
      const res = await userService.likeStory(currentItem.id);
      if (res.success) {
        setLiked(res.isLiked);
        setLikesCount(res.likesCount);
        setLiveStats((prev) => ({ ...prev, likesCount: res.likesCount }));
      }
    } catch {}
  };

  const SLIDE_DURATION = 7000;
  const UPDATE_INTERVAL = 50;

  const userIndexRef = useRef(userIndex);
  const itemIndexRef = useRef(itemIndex);
  useEffect(() => { userIndexRef.current = userIndex; }, [userIndex]);
  useEffect(() => { itemIndexRef.current = itemIndex; }, [itemIndex]);

  const handleNextSlide = useCallback(() => {
    const uIdx = userIndexRef.current;
    const iIdx = itemIndexRef.current;
    const story = validStories[uIdx];
    const storyItems = story?.items?.length ? story.items : [{ id: 'default' }];
    const itemsLen = storyItems.length;

    if (iIdx < itemsLen - 1) {
      setItemIndex(iIdx + 1);
      setProgress(0);
    } else if (uIdx < validStories.length - 1) {
      setUserIndex(uIdx + 1);
      setItemIndex(0);
      setProgress(0);
    } else {
      setProgress(100);
      setIsPaused(true);
    }
  }, [validStories]);

  const handlePrevSlide = useCallback(() => {
    const uIdx = userIndexRef.current;
    const iIdx = itemIndexRef.current;

    if (iIdx > 0) {
      setItemIndex(iIdx - 1);
      setProgress(0);
    } else if (uIdx > 0) {
      const prevUserStories = validStories[uIdx - 1];
      const prevCount = prevUserStories?.items?.length || 1;
      setUserIndex(uIdx - 1);
      setItemIndex(prevCount - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [validStories]);

  // Auto Advance Progress Loop (images/text use timer; videos sync to element duration)
  useEffect(() => {
    if (isPaused) return;

    const isVideoItem = currentItem?.type === 'video';
    const video = videoRef.current;

    if (isVideoItem && video) {
      const onTimeUpdate = () => {
        const dur = video.duration || 0;
        if (dur > 0) {
          setProgress((video.currentTime / dur) * 100);
        }
      };
      const onEnded = () => {
        handleNextSlide();
        setProgress(0);
      };

      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('ended', onEnded);

      return () => {
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('ended', onEnded);
      };
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + (UPDATE_INTERVAL / SLIDE_DURATION) * 100;
        if (nextProgress >= 100) {
          handleNextSlide();
          return 0;
        }
        return nextProgress;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, [userIndex, itemIndex, isPaused, validStories.length, items.length, currentItem?.type, currentItem?.id, handleNextSlide]);

  // Lock body scroll while story viewer is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, []);

  // Keyboard navigation & Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextSlide, handlePrevSlide, onClose]);

  if (!currentStory) return null;

  return (
    <div className="story-viewer-root animate-fadeIn select-none">
      {/* Desktop backdrop close */}
      <div className="absolute inset-0 z-0 cursor-pointer hidden sm:block" onClick={onClose} aria-hidden />

      <div
        className="story-viewer-frame z-10"
        onMouseDown={() => { setIsPaused(true); setShowStats(false); }}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => { setIsPaused(true); setShowStats(false); }}
        onTouchEnd={() => setIsPaused(false)}
      >

        {/* 1. Multi-Segment Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex gap-1.5">
          {items.map((_, idx) => {
            let itemProgress = 0;
            if (idx < itemIndex) itemProgress = 100;
            else if (idx === itemIndex) itemProgress = progress;

            return (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-white transition-all ease-linear"
                  style={{ width: `${itemProgress}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* 2. Top Header User Info & Controls */}
        <div className="absolute top-6 inset-x-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar src={storyAvatar} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h4 className="text-xs font-bold text-white drop-shadow-md truncate">{storyDisplayName}</h4>
                {storyUser.verified && <VerifiedBadge className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
              </div>
              <p className="text-[10px] text-slate-300 drop-shadow truncate">@{storyUsername}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentItem.type === 'video' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsMuted((m) => !m); }}
                className="p-2 text-slate-300 hover:text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <IconVolumeOff className="w-5 h-5" /> : <IconVolume className="w-5 h-5" />}
              </button>
            )}
            {isPaused && (
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-amber-400 font-semibold border border-amber-400/30 flex items-center gap-1">
                <IconPause className="w-3 h-3" /> PAUSED
              </span>
            )}
            {/* Stats button + Delete button — only for own story */}
            {isOwnStory && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(true); setIsPaused(true); }}
                  className="p-2 text-slate-300 hover:text-rose-400 bg-black/40 hover:bg-rose-500/20 rounded-full backdrop-blur-md transition-colors"
                  title="Delete Story"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-colors"
              title="Close Story (Esc)"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3. Media Viewer */}
        <div className="story-viewer-media">
          {!mediaReady && !currentItem.bgGradient && (
            <div className="absolute inset-0 z-[1] skeleton-shimmer bg-slate-900" aria-hidden />
          )}

          {currentItem.bgGradient ? (
            <div className={`w-full h-full ${currentItem.bgGradient} flex items-center justify-center p-6 text-center`}>
              {currentItem.caption && (
                <p className="text-lg sm:text-xl font-bold text-white drop-shadow-lg leading-snug">
                  {currentItem.caption}
                </p>
              )}
            </div>
          ) : currentItem.type === 'video' ? (
            <video
              ref={videoRef}
              key={currentItem.id || currentItem.url}
              src={currentItem.url}
              autoPlay
              playsInline
              muted={isMuted}
              preload="auto"
              className={`w-full h-full object-cover transition-opacity duration-200 ${mediaReady ? 'opacity-100' : 'opacity-0'}`}
              onLoadedData={() => setMediaReady(true)}
              onCanPlay={() => setMediaReady(true)}
            />
          ) : (
            <img
              src={currentItem.url || currentStory.media}
              alt="Story segment"
              className={`w-full h-full object-cover transition-opacity duration-200 ${mediaReady ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setMediaReady(true)}
            />
          )}

          {/* Gradient Overlay for Top & Bottom readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

          {/* Caption Overlay (for photo/video stories) */}
          {!currentItem.bgGradient && currentItem.caption && (
            <div className="absolute bottom-20 inset-x-6 z-20 text-center">
              <p className="text-sm font-semibold text-white bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 inline-block shadow-lg max-w-full break-words">
                {currentItem.caption}
              </p>
            </div>
          )}

          {/* Tap Left / Right Navigation Zones */}
          <div 
            onClick={handlePrevSlide}
            className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer" 
          />
          <div 
            onClick={handleNextSlide}
            className="absolute right-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer" 
          />
        </div>

        {/* Stats Panel (own story only) */}
        <StatsPanel
          storyId={currentItem?.id}
          isOpen={showStats && isOwnStory}
          liveStats={liveStats}
          onClose={() => { setShowStats(false); setIsPaused(false); }}
        />

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 mx-6 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Delete Story?</h3>
              <p className="text-xs text-slate-400 mb-5">This story will be permanently deleted.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteConfirm(false); setIsPaused(false); }}
                  className="flex-1 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const storyId = currentItem?.id || currentItem?._id || currentStory?.id || currentStory?._id;
                    if (!storyId) return;
                    await userService.deleteStory(storyId);
                    onDeleteStory?.(storyId);
                    setDeleteConfirm(false);
                    onClose();
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Bottom Footer — Reply (others) or Stats button (own) */}
        {isOwnStory ? (
          <div className="absolute bottom-4 inset-x-4 z-30 flex items-center justify-center gap-2 safe-bottom">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowStats(s => !s); setIsPaused(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full border border-white/10 transition-all touch-manipulation"
              aria-label={`${liveStats.viewsCount} views, ${liveStats.likesCount} likes`}
            >
              <IconEye className="w-4 h-4 text-slate-300" />
              <span className="text-xs font-semibold text-slate-200 tabular-nums">{liveStats.viewsCount ?? 0}</span>
              <span className="text-white/30 mx-0.5">·</span>
              <IconHeart className="w-4 h-4 text-rose-400" filled />
              <span className="text-xs font-semibold text-slate-200 tabular-nums">{liveStats.likesCount ?? 0}</span>
              <span className="text-[10px] text-slate-400 ml-1 hidden xs:inline">{showStats ? 'Hide' : 'Stats'}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="absolute bottom-4 inset-x-4 z-30 flex items-center gap-2 safe-bottom">
            <input
              type="text"
              value={replyText}
              onChange={(e) => { setReplyText(e.target.value); e.stopPropagation(); }}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              placeholder={`Reply to ${storyDisplayName.split(' ')[0]}...`}
              className="flex-1 px-4 py-2.5 bg-black/60 text-xs text-white placeholder-slate-400 border border-white/20 rounded-full backdrop-blur-md focus:outline-none focus:border-brand-500"
            />
            {replyText.trim() && (
              <button
                type="submit"
                className="p-2.5 rounded-full bg-gradient-to-r from-brand-600 via-brand-purple to-brand-cyan text-white shadow-lg shadow-brand-500/40 transition-all active:scale-95 flex-shrink-0"
                title="Send Story Reply"
              >
                <IconSend className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleLike}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90 flex-shrink-0 ${
                liked ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40' : 'bg-black/50 text-slate-300 hover:text-white border border-white/20'
              }`}
            >
              <IconHeart className="w-5 h-5" filled={liked} />
            </button>
          </form>
        )}

        {/* Desktop Side Chevron Buttons */}
        <button
          onClick={handlePrevSlide}
          className="hidden sm:flex absolute -left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/90 text-white border border-slate-800 items-center justify-center hover:bg-slate-800 transition-colors shadow-lg z-30"
          title="Previous Story"
        >
          ‹
        </button>
        <button
          onClick={handleNextSlide}
          className="hidden sm:flex absolute -right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/90 text-white border border-slate-800 items-center justify-center hover:bg-slate-800 transition-colors shadow-lg z-30"
          title="Next Story"
        >
          ›
        </button>

      </div>
    </div>
  );
};
