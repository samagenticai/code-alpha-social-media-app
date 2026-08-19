/** Immediately pause all playing videos in the document safely without destroying the buffer */
export function stopAllReelMedia() {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('video').forEach((video) => {
    try {
      video.pause();
      video.muted = true;
    } catch {
      /* ignore */
    }
  });
}

export function teardownVideoElement(video) {
  if (!video) return;
  try {
    video.pause();
    video.muted = true;
  } catch {
    /* ignore */
  }
}

