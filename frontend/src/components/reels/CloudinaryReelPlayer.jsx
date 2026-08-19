import React, { useEffect, useRef, useMemo } from 'react';
import { getOptimizedCloudinaryVideoUrl, getCloudinaryThumbnailUrl, isVideoFileUrl } from '../../utils/reelMedia';

/**
 * Reels video — in-flow <video>, no absolute/transform/overflow clipping.
 * Chrome blanks frames when <video> is position:absolute inside a rounded/overflow parent,
 * even while currentTime keeps advancing.
 */
export const CloudinaryReelPlayer = ({
  videoUrl,
  thumbnailUrl,
  isActive,
  isMuted = true,
  volume = 0.8,
  isPlaying = true,
  videoRef: externalRef,
}) => {
  const internalRef = useRef(null);
  const videoRef = externalRef || internalRef;

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
    const video = videoRef.current;
    if (!video || !optimizedUrl) return undefined;

    const vol = Math.max(0, Math.min(1, volume));
    video.volume = vol;
    video.muted = isMuted || vol === 0;

    if (!isActive || !isPlaying || document.hidden) {
      video.pause();
      return undefined;
    }

    video.muted = true;
    const playPromise = video.play();
    if (playPromise?.then) {
      playPromise
        .then(() => {
          video.muted = isMuted || vol === 0;
          video.volume = vol;
        })
        .catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
    }

    return undefined;
  }, [isActive, isPlaying, optimizedUrl, isMuted, volume, videoRef]);

  useEffect(() => {
    return () => {
      try {
        videoRef.current?.pause();
      } catch {
        /* ignore */
      }
    };
  }, [videoRef]);

  if (!videoUrl || !optimizedUrl) return null;

  return (
    <div className="reel-player-root">
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
        autoPlay={isActive && isPlaying}
        loop
        muted
        playsInline
        webkit-playsinline="true"
        preload={isActive ? 'auto' : 'metadata'}
        disablePictureInPicture
        controlsList="nodownload no-remote-playback"
        className="reel-video-layer"
      />
    </div>
  );
};

export default CloudinaryReelPlayer;
