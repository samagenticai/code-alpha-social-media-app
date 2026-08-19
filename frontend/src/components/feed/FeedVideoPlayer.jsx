import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconPlay, IconPause, IconVolume, IconVolumeOff } from '../ui/Icons';

/** True only for actual video files — never image thumbnails */
export const isVideoMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const u = url.toLowerCase();
  if (/\.(mp4|webm|mov|mkv)(\?|$)/i.test(u)) return true;
  if (u.includes('/video/upload/')) return true;
  if (u.includes('resource_type=video')) return true;
  return false;
};

/** Resolve feed post video URL once — stable across parent re-renders */
export const resolvePostVideoUrl = (post) => {
  if (!post) return '';

  const candidates = [
    post.videoUrl,
    post.video?.url,
    ...(Array.isArray(post.media)
      ? post.media
          .filter((m) => m.resourceType === 'video' || m.type === 'video')
          .map((m) => m.url)
      : []),
  ].filter(Boolean);

  const raw = candidates.find(isVideoMediaUrl) || '';
  if (!raw) return '';

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  if (isMobile && raw.includes('cloudinary.com') && raw.includes('/upload/') && !raw.includes('/upload/q_auto')) {
    return raw.replace('/upload/', '/upload/q_auto:good,f_auto,w_720,c_limit/');
  }
  return raw;
};

export const resolvePostVideoThumb = (post, vUrl) => {
  if (!post || !vUrl) return '';
  const isMp4 = vUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) || vUrl.includes('video/upload');
  return (
    post.video?.thumbnail ||
    post.thumbnailUrl ||
    (isMp4 && vUrl.includes('cloudinary.com')
      ? vUrl.replace('/upload/', '/upload/so_0/').replace(/\.(mp4|mov|webm)$/i, '.jpg')
      : '')
  );
};

/**
 * Stable inline feed video — fixed aspect container, no popup, no layout shift.
 * Memoized by postId + videoUrl so likes/comments don't remount the <video>.
 */
export const FeedVideoPlayer = React.memo(function FeedVideoPlayer({ postId, videoUrl, thumbUrl }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const rafRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const centerTimerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Lazy attach src when near viewport — container stays reserved immediately
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !videoUrl) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          return;
        }
        // Leaving the viewport pauses playback but never tears down the post.
        const video = videoRef.current;
        if (video && !video.paused) {
          try {
            video.pause();
          } catch { /* ignore */ }
          setIsPlaying(false);
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [videoUrl]);

  // Only the playing video runs a progress loop. Running one per mounted video
  // put a style write for every feed video into every frame, which starved the
  // main thread during scrolling.
  useEffect(() => {
    if (!isPlaying) return undefined;

    const tick = () => {
      const v = videoRef.current;
      if (v && progressRef.current && v.duration > 0) {
        progressRef.current.style.width = `${(v.currentTime / v.duration) * 100}%`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const flashCenterIcon = useCallback(() => {
    setShowCenterIcon(true);
    if (centerTimerRef.current) clearTimeout(centerTimerRef.current);
    centerTimerRef.current = setTimeout(() => setShowCenterIcon(false), 650);
  }, []);

  useEffect(() => () => {
    if (centerTimerRef.current) clearTimeout(centerTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleTogglePlay = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video || hasError) return;

    if (video.paused) {
      document.querySelectorAll('.feed-video-player video').forEach((v) => {
        if (v !== video && !v.paused) {
          try { v.pause(); } catch { /* ignore */ }
        }
      });
      video.play()
        .then(() => {
          setIsPlaying(true);
          flashCenterIcon();
        })
        .catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play()
            .then(() => {
              setIsPlaying(true);
              flashCenterIcon();
            })
            .catch(() => {});
        });
    } else {
      video.pause();
      setIsPlaying(false);
      flashCenterIcon();
    }
  }, [hasError, flashCenterIcon]);

  const handleToggleMute = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    video.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  if (!videoUrl) return null;

  return (
    <div
      ref={containerRef}
      className="post-video-container feed-video-player mb-3 sm:mb-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 w-full select-none touch-manipulation"
      onClick={handleTogglePlay}
      role="button"
      tabIndex={0}
      aria-label={isPlaying ? 'Pause video' : 'Play video'}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') handleTogglePlay(e);
      }}
    >
      {/* Skeleton / poster — always fills container */}
      {!isReady && (
        <div className="post-video-skeleton absolute inset-0 z-[1]">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 skeleton-shimmer bg-slate-800/80" />
          )}
          <div className="absolute inset-0 bg-slate-950/20" />
        </div>
      )}

      {shouldLoad && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbUrl || undefined}
          preload="metadata"
          loop
          playsInline
          muted={isMuted}
          disablePictureInPicture
          className={`post-video-element absolute inset-0 w-full h-full z-[2] transition-opacity duration-200 ${
            isReady ? 'opacity-100' : 'opacity-0'
          }`}
          onLoadedData={() => { setIsReady(true); setIsBuffering(false); }}
          onCanPlay={() => { setIsReady(true); setIsBuffering(false); }}
          onPlaying={() => { setIsPlaying(true); setIsBuffering(false); setIsReady(true); }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onError={() => { setHasError(true); setIsBuffering(false); }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-[3]" />

      {isBuffering && shouldLoad && !hasError && (
        <div className="absolute inset-0 z-[4] flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/15 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {(showCenterIcon || (!isPlaying && isReady && !hasError)) && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl">
            {isPlaying ? (
              <IconPause className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <IconPlay className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
            )}
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 z-[6] flex flex-col items-center justify-center bg-slate-950/90 text-white p-4 text-center">
          <p className="text-xs font-semibold mb-2">Video unavailable</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              setIsBuffering(true);
              videoRef.current?.load();
            }}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold pointer-events-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls — progress pinned to bottom edge of container */}
      <div className="absolute inset-x-0 bottom-0 z-[7] pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 z-[2]">
          <div ref={progressRef} className="h-full bg-brand-500 transition-none" style={{ width: '0%' }} />
        </div>
        <div className="absolute right-2 bottom-3 pointer-events-auto z-[3]">
          <button
            type="button"
            onClick={handleToggleMute}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 touch-manipulation"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <IconVolumeOff className="w-4 h-4" /> : <IconVolume className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}, (prev, next) => prev.postId === next.postId && prev.videoUrl === next.videoUrl && prev.thumbUrl === next.thumbUrl);

export default FeedVideoPlayer;
