import React, { useEffect, useRef, useState } from 'react';
import { IconVolume, IconVolumeOff, IconMaximize, IconPlay, IconPause } from '../ui/Icons';

/** Unified video controls — play/pause, mute, seek (desktop), fullscreen (desktop) */
export const ReelVideoControls = ({
  videoRef,
  containerRef,
  isActive,
  isMuted,
  onToggleMute,
  volume = 0.8,
  onVolumeChange,
  isPlaying = true,
  onTogglePlay,
  canManage = false,
  showCenterPlayPause = false,
  centerIsPlaying = true,
}) => {
  const [duration, setDuration] = useState(0);
  const [timeLabel, setTimeLabel] = useState('0:00 / 0:00');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressBarRef = useRef(null);
  const hideTimerRef = useRef(null);
  const rafRef = useRef(null);
  const lastLabelUpdateRef = useRef(0);

  useEffect(() => {
    const video = videoRef?.current;
    if (!video || !isActive) return;

    const updateProgress = () => {
      const v = videoRef.current;
      if (!v) return;
      const dur = v.duration || 0;
      if (dur > 0) {
        setDuration(dur);
        if (progressBarRef.current) {
          const pct = Math.max(0, Math.min(100, (v.currentTime / dur) * 100));
          progressBarRef.current.style.width = `${pct}%`;
        }
      }
    };

    const onMeta = () => updateProgress();
    const onTimeUpdate = () => updateProgress();

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('durationchange', onMeta);
    video.addEventListener('loadeddata', onMeta);
    video.addEventListener('canplay', onMeta);
    video.addEventListener('playing', onMeta);
    video.addEventListener('timeupdate', onTimeUpdate);

    if (video.duration) updateProgress();

    const tick = (timestamp) => {
      if (!videoRef?.current) return;
      const v = videoRef.current;
      const dur = v.duration || 0;
      if (dur > 0 && progressBarRef.current) {
        const pct = Math.max(0, Math.min(100, (v.currentTime / dur) * 100));
        progressBarRef.current.style.width = `${pct}%`;
      }
      if (timestamp - lastLabelUpdateRef.current > 500) {
        lastLabelUpdateRef.current = timestamp;
        setTimeLabel(`${formatTime(v.currentTime)} / ${formatTime(dur)}`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('durationchange', onMeta);
      video.removeEventListener('loadeddata', onMeta);
      video.removeEventListener('canplay', onMeta);
      video.removeEventListener('playing', onMeta);
      video.removeEventListener('timeupdate', onTimeUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef, isActive]);

  const triggerShowSlider = () => {
    setShowVolumeSlider(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowVolumeSlider(false), 2500);
  };

  const handleSeek = (e) => {
    const video = videoRef?.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * duration;
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${pct * 100}%`;
    }
  };

  const handleFullscreen = () => {
    const el = containerRef?.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  };

  const handleUnmute = (e) => {
    e.stopPropagation();
    onToggleMute?.();
    triggerShowSlider();
  };

  const currentVolumePercent = isMuted ? 0 : Math.round(volume * 100);

  if (!isActive) return null;

  return (
    <>
      {showCenterPlayPause && (
        <div className="absolute inset-0 z-[25] flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl animate-fadeIn">
            {centerIsPlaying ? (
              <IconPause className="w-7 h-7 sm:w-8 sm:h-8" />
            ) : (
              <IconPlay className="w-7 h-7 sm:w-8 sm:h-8 ml-1" />
            )}
          </div>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 top-0 z-30 pointer-events-none p-2 sm:p-3 flex items-center justify-between bg-gradient-to-b from-black/70 via-black/30 to-transparent"
      >
        <div className={`flex items-center gap-1.5 pointer-events-auto ${canManage ? 'ml-8 sm:ml-10' : ''}`}>
          {duration > 0 && (
            <span className="hidden sm:inline-block text-[10px] text-white/80 font-mono tabular-nums bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
              {timeLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {isMuted && isPlaying && (
            <button
              type="button"
              onClick={handleUnmute}
              className="sm:hidden px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 touch-manipulation animate-pulse"
            >
              Tap to unmute
            </button>
          )}

          <div
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
            onClick={(e) => e.stopPropagation()}
            className="relative flex items-center bg-black/60 backdrop-blur-md p-1 rounded-full text-white border border-white/10 group/vol"
          >
            <button
              type="button"
              onClick={handleUnmute}
              className={`w-8 h-8 rounded-full flex items-center justify-center touch-manipulation transition-colors ${
                isMuted || volume === 0 ? 'text-amber-300' : 'text-brand-400'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <IconVolumeOff className="w-4 h-4" /> : <IconVolume className="w-4 h-4" />}
            </button>

            <div
              className={`hidden sm:flex items-center gap-1.5 overflow-hidden transition-all duration-300 ${
                showVolumeSlider
                  ? 'max-w-[130px] opacity-100 pr-2 pl-0.5'
                  : 'max-w-0 opacity-0 p-0 pointer-events-none'
              } group-hover/vol:max-w-[130px] group-hover/vol:opacity-100 group-hover/vol:pr-2 group-hover/vol:pl-0.5 group-hover/vol:pointer-events-auto`}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  const val = parseFloat(e.target.value);
                  onVolumeChange?.(val);
                  triggerShowSlider();
                }}
                className="w-16 h-1 bg-white/40 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
                title={`Volume: ${currentVolumePercent}%`}
              />
              <span className="text-[10px] text-white/90 font-mono w-5 text-right select-none font-semibold">
                {currentVolumePercent}%
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreen();
            }}
            className="hidden sm:flex w-8 h-8 rounded-full bg-black/60 backdrop-blur-md items-center justify-center text-white hover:bg-black/80 touch-manipulation border border-white/10"
            aria-label="Fullscreen"
          >
            <IconMaximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="reel-progress-bar absolute inset-x-0 bottom-0 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={handleSeek}
          className="w-full h-1 bg-white/20 mx-0 group cursor-pointer block"
          aria-label="Seek"
        >
          <div ref={progressBarRef} className="h-full bg-brand-500 transition-none" style={{ width: '0%' }} />
        </button>
      </div>
    </>
  );
};

const formatTime = (s) => {
  if (!s || Number.isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default ReelVideoControls;
