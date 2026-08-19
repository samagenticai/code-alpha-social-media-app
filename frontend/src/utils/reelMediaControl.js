/** Pause all videos — do not force mute (that fights React muted state + autoplay). */
export function stopAllReelMedia() {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('video').forEach((video) => {
    try {
      video.pause();
    } catch {
      /* ignore */
    }
  });
}

export function teardownVideoElement(video) {
  if (!video) return;
  try {
    video.pause();
  } catch {
    /* ignore */
  }
}

