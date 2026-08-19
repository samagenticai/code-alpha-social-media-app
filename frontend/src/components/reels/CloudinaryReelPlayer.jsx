import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getOptimizedCloudinaryVideoUrl, getCloudinaryThumbnailUrl, isVideoFileUrl } from '../../utils/reelMedia';

/**
 * Reels <video> player.
 * Avoid overflow:hidden + border-radius on ANY ancestor of this video (Chromium blank-frame bug).
 */
export const CloudinaryReelPlayer = ({
  videoUrl,
  thumbnailUrl,
  isActive,
  isMuted = true,
  volume = 0.8,
  isPlaying = true,
  videoRef: externalRef,
  onAutoplayBlocked,
}) => {
  const internalRef = useRef(null);
  const videoRef = externalRef || internalRef;
  const playTokenRef = useRef(0);

  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showPoster, setShowPoster] = useState(true);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const optimizedUrl = useMemo(
    () => getOptimizedCloudinaryVideoUrl(videoUrl, { mobile: isMobile }),
    [videoUrl, isMobile]
  );

  const safePoster = useMemo(() => {
    if (thumbnailUrl && !isVideoFileUrl(thumbnailUrl)) return thumbnailUrl;
    return getCloudinaryThumbnailUrl(videoUrl || optimizedUrl || '') || undefined;
  }, [thumbnailUrl, videoUrl, optimizedUrl]);

  useEffect(() => {
    return () => {
      playTokenRef.current += 1;
      try {
        videoRef.current?.pause();
      } catch {
        /* ignore */
      }
    };
  }, [videoRef]);

  useEffect(() => {
    setHasError(false);
    setIsBuffering(false);
    setShowPoster(true);
  }, [optimizedUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !optimizedUrl) return undefined;

    const hidePoster = () => {
      if (video.currentTime > 0.05 || video.readyState >= 3) {
        setShowPoster(false);
      }
      setIsBuffering(false);
    };
    const onWaiting = () => setIsBuffering(true);
    const onError = () => {
      setIsBuffering(false);
      setHasError(true);
    };

    video.addEventListener('playing', hidePoster);
    video.addEventListener('timeupdate', hidePoster);
    video.addEventListener('loadeddata', hidePoster);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('playing', hidePoster);
      video.removeEventListener('timeupdate', hidePoster);
      video.removeEventListener('loadeddata', hidePoster);
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

    if (!isActive || !isPlaying || hasError || document.hidden) {
      try {
        video.pause();
      } catch {
        /* ignore */
      }
      setIsBuffering(false);
      return undefined;
    }

    // Autoplay: start muted, then apply user's mute preference after playback begins
    video.muted = true;
    setIsBuffering(true);
    let cancelled = false;

    const tryPlay = async () => {
      try {
        await video.play();
        if (cancelled || token !== playTokenRef.current) {
          video.pause();
          return;
        }
        // Apply intended mute state after a successful play start
        video.muted = isMuted || vol === 0;
        video.volume = vol;
        setShowPoster(false);
        setIsBuffering(false);
      } catch {
        if (cancelled || token !== playTokenRef.current) return;
        video.muted = true;
        try {
          await video.play();
          if (cancelled || token !== playTokenRef.current) {
            video.pause();
            return;
          }
          onAutoplayBlocked?.();
          setShowPoster(false);
          setIsBuffering(false);
        } catch {
          setIsBuffering(false);
        }
      }
    };

    tryPlay();
    return () => {
      cancelled = true;
    };
  }, [isActive, isPlaying, hasError, optimizedUrl, isMuted, volume, videoRef, onAutoplayBlocked]);

  if (!videoUrl || !optimizedUrl) return null;

  const mediaStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center center',
    display: 'block',
    border: 'none',
    outline: 'none',
    transform: 'none',
    filter: 'none',
  };

  return (
    <div
      className="reel-player-root"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        background: '#070a12',
        overflow: 'visible',
      }}
    >
      {safePoster && (
        <img
          src={safePoster}
          alt=""
          style={{
            ...mediaStyle,
            zIndex: 1,
            opacity: showPoster ? 1 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
          }}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      )}

      <video
        ref={videoRef}
        src={optimizedUrl}
        poster={safePoster}
        loop
        playsInline
        webkit-playsinline="true"
        muted
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload no-remote-playback"
        style={{
          ...mediaStyle,
          zIndex: 2,
          background: 'transparent',
          opacity: 1,
          visibility: 'visible',
        }}
      />

      {isBuffering && !hasError && showPoster && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 z-[6] flex flex-col items-center justify-center bg-[#070a12]/95 text-white p-6 text-center">
          <p className="text-xs font-bold mb-2">Video playback issue</p>
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              setShowPoster(true);
              setIsBuffering(true);
              const video = videoRef.current;
              if (video) {
                video.muted = true;
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
