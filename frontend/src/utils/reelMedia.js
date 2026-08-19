export const isVideoFileUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url) || url.includes('/video/upload');
};

export const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || url.includes('/image/upload');
};

/** Cloudinary frame-at-0 JPEG poster from a video delivery URL */
export const getCloudinaryThumbnailUrl = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com')) return '';
  if (isImageUrl(videoUrl) && !isVideoFileUrl(videoUrl)) return videoUrl;
  if (!videoUrl.includes('/upload/')) return '';
  if (videoUrl.includes('/upload/so_')) return videoUrl.replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg');
  return videoUrl
    .replace('/upload/', '/upload/so_0/')
    .replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg');
};

/**
 * HTML5-safe Cloudinary delivery.
 * Prefer f_mp4 (not f_auto) so <video src> always gets a progressive MP4
 * instead of browser-negotiated formats that can play audio with blank frames.
 */
export const getOptimizedCloudinaryVideoUrl = (videoUrl, { mobile = false } = {}) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com') || !videoUrl.includes('/upload/')) {
    return videoUrl || '';
  }

  // Normalize any existing f_auto delivery to progressive MP4 for <video>
  if (/\/upload\/[^/]*f_auto/.test(videoUrl)) {
    return videoUrl.replace(/f_auto/g, 'f_mp4');
  }
  if (/\/upload\/[^/]*(?:f_mp4|q_auto)/.test(videoUrl)) return videoUrl;

  const transforms = mobile ? 'f_mp4,q_auto:eco,w_720,c_limit' : 'f_mp4,q_auto:good,w_1080,c_limit';
  return videoUrl.replace('/upload/', `/upload/${transforms}/`);
};

export const resolveReelThumbnail = (reel) => {
  const videoUrl = reel?.videoUrl || reel?.video?.url || '';

  const candidates = [
    reel?.thumbnailUrl,
    reel?.video?.thumbnail,
    videoUrl ? getCloudinaryThumbnailUrl(videoUrl) : '',
    Array.isArray(reel?.images) ? reel.images[0] : '',
  ];

  return candidates.find((url) => url && !isVideoFileUrl(url)) || '';
};

export const resolveReelPlaybackUrl = (reel, { mobile = false } = {}) => {
  const raw =
    reel?.videoUrl ||
    (typeof reel?.video === 'string' ? reel.video : reel?.video?.url || reel?.video?.secure_url) ||
    '';
  return getOptimizedCloudinaryVideoUrl(raw, { mobile });
};

export const hasReelVideo = (reel) => Boolean(resolveReelPlaybackUrl(reel));
