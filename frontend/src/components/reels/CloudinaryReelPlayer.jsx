import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getOptimizedCloudinaryVideoUrl, isVideoFileUrl } from '../../utils/reelMedia';

/**
 * Reels <video> player.
 * IMPORTANT: ancestors must NOT combine overflow:hidden + border-radius —
 * Chromium blanks video frames while audio still plays.
 */
export const CloudinaryReelPlayer = ({
  videoUrl,
  thumbnailUrl,
  isActive,
  isMuted = false,
  volume = 0.8,
  isPlaying = true,
  videoRef: externalRef,
  onAutoplayBlocked,
}) => {
  const internalRef = useRef(null);
  const videoRef = externalRef || internalRef;
  const playTokenRef = useRef(0);
  const userMutedRef = useRef(isMuted);

  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const optimizedUrl = useMemo(
    () => getOptimizedCloudinaryVideoUrl(videoUrl, { mobile: isMobile }),
    [videoUrl, isMobile]
  );

  const safePoster =
    thumbnailUrl && typeof thumbnailUrl === 'string' && !isVideoFileUrl(thumbnailUrl)
      ? thumbnailUrl
      : undefined;

  useEffect(() => {
    return () => {
      playTokenRef.current += 1;
      const video = videoRef.current;
      if (video) {
        try {
          video.pause();
        } catch {
          /* ignore */
        }
      }
    };
  }, [videoRef]);

  useEffect(() => {
    setHasError(false);
    setIsBuffering(false);
    setHasFrame(false);
  }, [optimizedUrl]);

  useEffect(() => {
    userMutedRef.current = isMuted;
    if (!isMuted) setAutoplayBlocked(false);
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !optimizedUrl) return undefined;

    const onFrame = () => {
      setHasFrame(true);
      setIsBuffering(false);
    };
    const onWaiting = () => setIsBuffering(true);
    const onError = () => {
      setIsBuffering(false);
      setHasError(true);
    };

    video.addEventListener('loadedmetadata', onFrame);
    video.addEventListener('loadeddata', onFrame);
    video.addEventListener('canplay', onFrame);
    video.addEventListener('playing', onFrame);
    video.addEventListener('timeupdate', onFrame);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);

    if (video.readyState >= 2) onFrame();

    return () => {
      video.removeEventListener('loadedmetadata', onFrame);
      video.removeEventListener('loadeddata', onFrame);
      video.removeEventListener('canplay', onFrame);
      video.removeEventListener('playing', onFrame);
      video.removeEventListener('timeupdate', onFrame);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
    };
  }, [optimizedUrl, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !optimizedUrl) return undefined;

    const token = ++playTokenRef.current;
    const vol = Math.max(0, Math.min(1, volume));
    video.volume = vol;
    video.muted = isMuted || vol === 0;

    if (!isActive || !isPlaying || hasError || document.hidden) {
      try {
        video.pause();
      } catch {
        /* ignore */
      }
      setIsBuffering(false);
      return undefined;
    }

    setIsBuffering(true);
    let cancelled = false;

    const tryPlay = async () => {
      try {
        await video.play();
        if (cancelled || token !== playTokenRef.current) {
          video.pause();
          return;
        }
        setAutoplayBlocked(false);
        setHasFrame(true);
        setIsBuffering(false);
      } catch {
        if (cancelled || token !== playTokenRef.current) return;
        if (!userMutedRef.current) {
          setAutoplayBlocked(true);
          onAutoplayBlocked?.();
        }
        video.muted = true;
        try {
          await video.play();
          if (cancelled || token !== playTokenRef.current) {
            video.pause();
            return;
          }
          setHasFrame(true);
          setIsBuffering(false);
        } catch {
          /* autoplay blocked */
        }
      }
    };

    tryPlay();

    return () => {
      cancelled = true;
    };
  }, [isActive, isPlaying, hasError, optimizedUrl, isMuted, volume, videoRef, onAutoplayBlocked]);

  useEffect(() => {
    const handleVisibility = () => {
      const video = videoRef.current;
      if (!video || !isActive) return;
      if (document.hidden) {
        video.pause();
      } else if (isPlaying) {
        const vol = Math.max(0, Math.min(1, volume));
        video.volume = vol;
        video.muted = isMuted || vol === 0;
        video.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive, isPlaying, isMuted, volume, videoRef]);

  if (!videoUrl || !optimizedUrl) return null;

  return (
    <div className="reel-player-root">
      {/* Poster always under the video so the stage is never an empty black void */}
      {safePoster && (
        <img
          src={safePoster}
          alt=""
          className="reel-poster-layer"
          loading="eager"
          decoding="async"
          draggable={false}
        />
      )}

      <video
        ref={videoRef}
        src={optimizedUrl}
        poster={safePoster}
        className="reel-video-layer"
        loop
        playsInline
        webkit-playsinline="true"
        muted={isMuted}
        preload={isActive ? 'auto' : 'metadata'}
        disablePictureInPicture
        controlsList="nodownload no-remote-playback"
      />

      {isBuffering && !hasError && !hasFrame && (
        <div className="reel-buffer-layer">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-brand-400 animate-spin" />
        </div>
      )}

      {autoplayBlocked && isMuted && isPlaying && (
        <div className="absolute bottom-24 inset-x-0 z-[5] flex justify-center pointer-events-none px-4">
          <span className="px-3 py-1.5 rounded-full bg-black/70 text-[11px] font-semibold text-white border border-white/15">
            Tap sound icon to unmute
          </span>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 z-[6] flex flex-col items-center justify-center bg-slate-950/90 text-white p-6 text-center">
          <p className="text-xs font-bold mb-2">Video playback issue</p>
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              setHasFrame(false);
              setIsBuffering(true);
              const video = videoRef.current;
              if (video) {
                video.load();
                video.play().catch(() => {});
              }
            }}
            className="px-4 py-1.5 bg-brand-600 rounded-lg text-xs font-bold"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default CloudinaryReelPlayer;
