import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconPlay, IconPause, IconVolume, IconVolumeOff } from '../ui/Icons';
import { getCloudinaryThumbnailUrl, getOptimizedCloudinaryVideoUrl } from '../../utils/reelMedia';

/** True only for actual video files — never image thumbnails */
export const isVideoMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)) return false;
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
  return getOptimizedCloudinaryVideoUrl(raw, { mobile: isMobile }) || raw;
};

export const resolvePostVideoThumb = (post, vUrl) => {
  if (!post || !vUrl) return '';
  const explicit = post.video?.thumbnail || post.thumbnailUrl || '';
  if (explicit && !isVideoMediaUrl(explicit)) return explicit;
  return getCloudinaryThumbnailUrl(vUrl);
};

const pauseOtherFeedVideos = (except) => {
  document.querySelectorAll('.feed-video-player video').forEach((v) => {
    if (v !== except && !v.paused) {
      try {
        v.pause();
      } catch {
        /* ignore */
      }
    }
  });
};

/**
 * Stable inline feed video — fixed aspect container, visible frames, reliable pause.
 */
export const FeedVideoPlayer = React.memo(function FeedVideoPlayer({ postId, videoUrl, thumbUrl }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const rafRef = useRef(null);
  const centerTimerRef = useRef(null);
  const wantPlayRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  const safePoster = thumbUrl && !isVideoMediaUrl(thumbUrl) ? thumbUrl : undefined;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !videoUrl) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          return;
        }
        const video = videoRef.current;
        if (video && !video.paused) {
          wantPlayRef.current = false;
          try {
            video.pause();
          } catch {
            /* ignore */
          }
          setIsPlaying(false);
        }
      },
      { rootMargin: '240px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [videoUrl]);

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

  useEffect(
    () => () => {
      wantPlayRef.current = false;
      if (centerTimerRef.current) clearTimeout(centerTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const video = videoRef.current;
      if (video) {
        try {
          video.pause();
        } catch {
          /* ignore */
        }
      }
    },
    []
  );

  const markFrame = useCallback(() => {
    setHasFrame(true);
    setIsBuffering(false);
  }, []);

  const handleTogglePlay = useCallback(
    (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      setShouldLoad(true);

      const video = videoRef.current;
      if (!video || hasError) return;

      if (video.paused) {
        pauseOtherFeedVideos(video);
        wantPlayRef.current = true;
        video.muted = isMuted;
        const playAttempt = video.play();
        if (playAttempt?.then) {
          playAttempt
            .then(() => {
              if (!wantPlayRef.current) {
                video.pause();
                setIsPlaying(false);
                return;
              }
              setIsPlaying(true);
              markFrame();
              flashCenterIcon();
            })
            .catch(() => {
              if (!wantPlayRef.current) return;
              video.muted = true;
              setIsMuted(true);
              video
                .play()
                .then(() => {
                  if (!wantPlayRef.current) {
                    video.pause();
                    setIsPlaying(false);
                    return;
                  }
                  setIsPlaying(true);
                  markFrame();
                  flashCenterIcon();
                })
                .catch(() => {});
            });
        }
      } else {
        wantPlayRef.current = false;
        video.pause();
        setIsPlaying(false);
        flashCenterIcon();
      }
    },
    [hasError, isMuted, flashCenterIcon, markFrame]
  );

  const handleToggleMute = useCallback(
    (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      const video = videoRef.current;
      if (!video) return;
      const next = !isMuted;
      video.muted = next;
      setIsMuted(next);
    },
    [isMuted]
  );

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
      {!hasFrame && (
        <div className="post-video-skeleton absolute inset-0 z-[1] pointer-events-none">
          {safePoster ? (
            <img
              src={safePoster}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 skeleton-shimmer bg-slate-800/80" />
          )}
        </div>
      )}

      {shouldLoad && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={safePoster}
          preload="metadata"
          loop
          playsInline
          muted={isMuted}
          disablePictureInPicture
          className="post-video-element"
          onLoadedMetadata={markFrame}
          onLoadedData={markFrame}
          onCanPlay={markFrame}
          onPlaying={() => {
            if (!wantPlayRef.current) {
              videoRef.current?.pause();
              setIsPlaying(false);
              return;
            }
            setIsPlaying(true);
            markFrame();
          }}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (v && v.currentTime > 0) markFrame();
          }}
          onPause={() => {
            if (!wantPlayRef.current) setIsPlaying(false);
          }}
          onWaiting={() => setIsBuffering(true)}
          onError={() => {
            setHasError(true);
            setIsBuffering(false);
          }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none z-[3]" />

      {isBuffering && shouldLoad && !hasError && !hasFrame && (
        <div className="absolute inset-0 z-[4] flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/15 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {(showCenterIcon || (!isPlaying && hasFrame && !hasError)) && (
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
              setHasFrame(false);
              videoRef.current?.load();
            }}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold pointer-events-auto"
          >
            Retry
          </button>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-[7] pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <div ref={progressRef} className="h-full bg-brand-500 transition-none" style={{ width: '0%' }} />
        </div>
        <div className="absolute right-2 bottom-3 pointer-events-auto">
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
