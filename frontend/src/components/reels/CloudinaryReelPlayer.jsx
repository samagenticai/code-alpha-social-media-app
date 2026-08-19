import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getOptimizedCloudinaryVideoUrl, isVideoFileUrl } from '../../utils/reelMedia';

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
  const playGenRef = useRef(0);
  const wantPlayRef = useRef(false);
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

  wantPlayRef.current = Boolean(isActive && isPlaying && optimizedUrl && !hasError);

  useEffect(() => {
    return () => {
      playGenRef.current += 1;
      wantPlayRef.current = false;
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
  }, [videoUrl, optimizedUrl]);

  useEffect(() => {
    userMutedRef.current = isMuted;
    if (!isMuted) setAutoplayBlocked(false);
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    playGenRef.current += 1;
    const gen = playGenRef.current;

    const markFrame = () => {
      if (gen !== playGenRef.current) return;
      setHasFrame(true);
      setIsBuffering(false);
    };

    const onWaiting = () => {
      if (gen !== playGenRef.current) return;
      setIsBuffering(true);
    };

    const onPlaying = () => {
      if (gen !== playGenRef.current) return;
      if (!wantPlayRef.current) {
        try {
          video.pause();
        } catch {
          /* ignore */
        }
        return;
      }
      markFrame();
    };

    const onError = () => {
      if (gen !== playGenRef.current) return;
      setIsBuffering(false);
      setHasError(true);
    };

    video.addEventListener('loadedmetadata', markFrame);
    video.addEventListener('loadeddata', markFrame);
    video.addEventListener('canplay', markFrame);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', markFrame);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);

    if (video.readyState >= 2) markFrame();

    return () => {
      video.removeEventListener('loadedmetadata', markFrame);
      video.removeEventListener('loadeddata', markFrame);
      video.removeEventListener('canplay', markFrame);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', markFrame);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
    };
  }, [optimizedUrl, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !optimizedUrl) return;

    const vol = Math.max(0, Math.min(1, volume));
    video.volume = vol;
    video.muted = isMuted || vol === 0;

    playGenRef.current += 1;
    const gen = playGenRef.current;

    if (!isActive || !isPlaying || hasError || document.hidden) {
      wantPlayRef.current = false;
      try {
        video.pause();
      } catch {
        /* ignore */
      }
      setIsBuffering(false);
      return;
    }

    wantPlayRef.current = true;
    setIsBuffering(true);

    const tryPlay = async () => {
      if (gen !== playGenRef.current || !wantPlayRef.current) return;
      try {
        await video.play();
        if (gen !== playGenRef.current || !wantPlayRef.current) {
          video.pause();
          return;
        }
        setAutoplayBlocked(false);
        setHasFrame(true);
        setIsBuffering(false);
      } catch {
        if (gen !== playGenRef.current || !wantPlayRef.current) return;
        if (!userMutedRef.current) {
          setAutoplayBlocked(true);
          onAutoplayBlocked?.();
        }
        video.muted = true;
        try {
          await video.play();
          if (gen !== playGenRef.current || !wantPlayRef.current) {
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
  }, [isActive, isPlaying, hasError, optimizedUrl, isMuted, volume, videoRef, onAutoplayBlocked]);

  useEffect(() => {
    const handleVisibility = () => {
      const video = videoRef.current;
      if (!video || !isActive) return;
      if (document.hidden) {
        wantPlayRef.current = false;
        video.muted = true;
        video.pause();
      } else if (isPlaying) {
        wantPlayRef.current = true;
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
  }, [isActive, isPlaying, isMuted, volume, videoRef]);

  if (!videoUrl || !optimizedUrl) return null;

  return (
    <div className="reel-player-root relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {safePoster && !hasFrame && (
        <img
          src={safePoster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-[1]"
          loading="eager"
          decoding="async"
        />
      )}

      <video
        ref={videoRef}
        src={optimizedUrl}
        poster={safePoster}
        className="reel-video-layer absolute inset-0 w-full h-full z-[2] bg-black"
        loop
        playsInline
        webkit-playsinline="true"
        muted={isMuted}
        preload={isActive ? 'auto' : 'metadata'}
        disablePictureInPicture
        controlsList="nodownload no-remote-playback"
      />

      {isBuffering && !hasError && !hasFrame && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[4]">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-brand-400 animate-spin" />
        </div>
      )}

      {autoplayBlocked && isMuted && isPlaying && (
        <div className="absolute bottom-24 inset-x-0 z-[5] flex justify-center pointer-events-none px-4">
          <span className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-semibold text-white border border-white/15 shadow-lg">
            Tap sound icon to unmute
          </span>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white p-6 text-center z-[6]">
          {safePoster && (
            <img
              src={safePoster}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm pointer-events-none"
            />
          )}
          <div className="relative z-10 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs shadow-2xl space-y-2.5">
            <p className="text-xs font-bold text-slate-200">Video playback issue</p>
            <p className="text-[10px] text-slate-400">
              This video could not be streamed smoothly on your current network.
            </p>
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                setHasFrame(false);
                setIsBuffering(true);
                const video = videoRef.current;
                if (video) {
                  video.load();
                  wantPlayRef.current = true;
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
