export const isVideoFileUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  // JPEG/PNG posters from /video/upload/so_0/...jpg are images, not videos
  if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)) return false;
  return /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url) || url.includes('/video/upload');
};

export const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (isVideoFileUrl(url) && !/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)) return false;
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || url.includes('/image/upload');
};

/**
 * Cloudinary JPEG poster from a video delivery URL.
 * CRITICAL: never keep f_mp4 / video format transforms — those make "thumbnails"
 * return video/mp4, which breaks <img>, poster=, and can blank video painting.
 */
export const getCloudinaryThumbnailUrl = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com') || !videoUrl.includes('/upload/')) {
    return '';
  }

  const frameUrl = videoUrl.replace(/\/upload\/([^/]*)\//, (_match, transforms) => {
    const parts = String(transforms || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      // Drop format/codec flags that force a video response for so_0 frames
      .filter((t) => !/^f_/.test(t) && !/^vc_/.test(t) && !/^ac_/.test(t));

    if (!parts.some((t) => /^so_/.test(t))) {
      parts.unshift('so_0');
    }
    parts.push('f_jpg');
    return `/upload/${parts.join(',')}/`;
  });

  return frameUrl.replace(/\.(mp4|mov|webm|mkv)(\?.*)?$/i, '.jpg$2');
};

/**
 * HTML5-safe Cloudinary delivery — progressive MP4 for <video src>.
 */
export const getOptimizedCloudinaryVideoUrl = (videoUrl, { mobile = false } = {}) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com') || !videoUrl.includes('/upload/')) {
    return videoUrl || '';
  }

  if (/\/upload\/[^/]*f_auto/.test(videoUrl)) {
    return videoUrl.replace(/f_auto/g, 'f_mp4');
  }
  if (/\/upload\/[^/]*f_mp4/.test(videoUrl)) return videoUrl;

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

  return (
    candidates.find(
      (url) => url && typeof url === 'string' && !isVideoFileUrl(url)
    ) ||
    (videoUrl ? getCloudinaryThumbnailUrl(videoUrl) : '') ||
    ''
  );
};

export const resolveReelPlaybackUrl = (reel, { mobile = false } = {}) => {
  const raw =
    reel?.videoUrl ||
    (typeof reel?.video === 'string' ? reel.video : reel?.video?.url || reel?.video?.secure_url) ||
    '';
  return getOptimizedCloudinaryVideoUrl(raw, { mobile });
};

export const hasReelVideo = (reel) => Boolean(resolveReelPlaybackUrl(reel));
