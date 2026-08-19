import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { getOptimizedCloudinaryVideoUrl } from '../../utils/reelMedia';

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
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const playGenRef = useRef(0);
  const userMutedRef = useRef(isMuted);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const optimizedUrl = useMemo(
    () => getOptimizedCloudinaryVideoUrl(videoUrl, { mobile: isMobile }),
    [videoUrl, isMobile]
  );

  // Soft pause on unmount
  useEffect(() => {
    return () => {
      playGenRef.current += 1;
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch { /* ignore */ }
      }
    };
  }, [videoRef]);

  // Reset states when videoUrl changes
  useEffect(() => {
    setHasError(false);
    setIsBuffering(false);
    setIsReady(false);
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    playGenRef.current += 1;
    const gen = playGenRef.current;

    if (!isActive || !optimizedUrl) {
      try {
        video.pause();
      } catch { /* ignore */ }
      setIsBuffering(false);
      return undefined;
    }

    // Connect source if needed without destroying cache
    if (video.src !== optimizedUrl) {
      setIsBuffering(true);
      setIsReady(false);
      video.src = optimizedUrl;
      video.preload = 'auto';
      video.load();
    } else if (video.readyState >= 2) {
      setIsReady(true);
      setIsBuffering(false);
    }

    const markReady = () => {
      if (gen !== playGenRef.current) return;
      setIsReady(true);
      setIsBuffering(false);
    };

    const onWaiting = () => {
      if (gen !== playGenRef.current) return;
      setIsBuffering(true);
    };

    const onPlaying = () => {
      if (gen !== playGenRef.current) return;
      setIsReady(true);
      setIsBuffering(false);
    };

    const onTimeUpdate = () => {
      if (gen !== playGenRef.current) return;
      if (video.currentTime > 0) {
        setIsReady(true);
        setIsBuffering(false);
      }
    };

    const onError = () => {
      if (gen !== playGenRef.current) return;
      setIsBuffering(false);
      setHasError(true);
    };

    video.addEventListener('loadeddata', markReady);
    video.addEventListener('canplay', markReady);
    video.addEventListener('canplaythrough', markReady);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('loadeddata', markReady);
      video.removeEventListener('canplay', markReady);
      video.removeEventListener('canplaythrough', markReady);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('error', onError);
    };
  }, [isActive, optimizedUrl, videoRef]);

  useEffect(() => {
    userMutedRef.current = isMuted;
    if (!isMuted) setAutoplayBlocked(false);
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive || !optimizedUrl || hasError) return;

    const vol = Math.max(0, Math.min(1, volume));
    video.volume = vol;
    video.muted = isMuted || vol === 0;

    if (isPlaying && !document.hidden) {
      const gen = playGenRef.current;
      const tryPlay = async () => {
        if (gen !== playGenRef.current) return;
        try {
          await video.play();
          setAutoplayBlocked(false);
        } catch {
          if (gen !== playGenRef.current) return;
          if (!userMutedRef.current) {
            setAutoplayBlocked(true);
            onAutoplayBlocked?.();
          }
          video.muted = true;
          try {
            await video.play();
          } catch {
            /* autoplay blocked */
          }
        }
      };
      tryPlay();
    } else {
      video.pause();
    }
  }, [isActive, isPlaying, isReady, hasError, optimizedUrl, isMuted, volume, videoRef, onAutoplayBlocked]);

  useEffect(() => {
    const handleVisibility = () => {
      const video = videoRef.current;
      if (!video || !isActive) return;
      if (document.hidden) {
        video.muted = true;
        video.pause();
      } else if (isPlaying && isReady) {
        const vol = Math.max(0, Math.min(1, volume));
        video.volume = vol;
        video.muted = isMuted || vol === 0;
        video.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleVisibility);
    };
  }, [isActive, isPlaying, isReady, isMuted, volume, videoRef]);

  if (!videoUrl) return null;

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Thumbnail poster image until first frame is rendered */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none z-0 ${
            isReady ? 'opacity-0' : 'opacity-100'
          }`}
          loading="eager"
          decoding="async"
        />
      )}

      <video
        ref={videoRef}
        poster={thumbnailUrl || undefined}
        className="absolute inset-0 w-full h-full reel-video-layer bg-transparent z-10 max-w-full max-h-full"
        style={{ opacity: 1, visibility: 'visible' }}
        loop
        playsInline
        webkit-playsinline="true"
        muted={isMuted}
        preload="metadata"
        disablePictureInPicture
        controlsList="nodownload no-remote-playback"
      />

      {/* Lightweight Video Buffering Overlay */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-brand-400 animate-spin" />
        </div>
      )}

      {autoplayBlocked && isMuted && isPlaying && (
        <div className="absolute bottom-24 inset-x-0 z-30 flex justify-center pointer-events-none px-4">
          <span className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-semibold text-white border border-white/15 shadow-lg">
            Tap sound icon to unmute
          </span>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white p-6 text-center z-30">
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm pointer-events-none" />
          )}
          <div className="relative z-10 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs shadow-2xl space-y-2.5">
            <p className="text-xs font-bold text-slate-200">Video playback issue</p>
            <p className="text-[10px] text-slate-400">This video could not be streamed smoothly on your current network.</p>
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                setIsReady(false);
                setIsBuffering(true);
                const video = videoRef.current;
                if (video) {
                  video.load();
                  video.play().catch(() => {});
                }
              }}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryReelPlayer;

