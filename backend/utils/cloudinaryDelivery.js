const isVideoFileUrl = (url) => {
  if (typeof url !== 'string' || !url) return false;
  if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)) return false;
  return /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url) || url.includes('/video/upload');
};

const isImageUrl = (url) =>
  typeof url === 'string' &&
  (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || url.includes('/image/upload'));

/**
 * JPEG frame poster. Must strip f_mp4 / f_auto or Cloudinary returns video/mp4
 * for "so_0" requests — which breaks <img> and <video poster>.
 */
const getCloudinaryThumbnailUrl = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com') || !videoUrl.includes('/upload/')) {
    return '';
  }
  if (isImageUrl(videoUrl) && !isVideoFileUrl(videoUrl)) return videoUrl;

  const frameUrl = videoUrl.replace(/\/upload\/([^/]*)\//, (_match, transforms) => {
    const parts = String(transforms || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => !/^f_/.test(t) && !/^vc_/.test(t) && !/^ac_/.test(t));

    if (!parts.some((t) => /^so_/.test(t))) {
      parts.unshift('so_0');
    }
    parts.push('f_jpg');
    return `/upload/${parts.join(',')}/`;
  });

  return frameUrl.replace(/\.(mp4|mov|webm|mkv)(\?.*)?$/i, '.jpg$2');
};

const getOptimizedVideoUrl = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com') || !videoUrl.includes('/upload/')) {
    return videoUrl || '';
  }
  if (/\/upload\/[^/]*f_auto/.test(videoUrl)) {
    return videoUrl.replace(/f_auto/g, 'f_mp4');
  }
  if (/\/upload\/[^/]*f_mp4/.test(videoUrl)) return videoUrl;
  return videoUrl.replace('/upload/', '/upload/f_mp4,q_auto:good,w_1080,c_limit/');
};

const resolveReelThumbnail = (reelObj) => {
  const videoUrl = reelObj.videoUrl || '';
  const candidates = [
    reelObj.thumbnailUrl,
    videoUrl ? getCloudinaryThumbnailUrl(videoUrl) : '',
  ];
  const thumb = candidates.find((url) => url && !isVideoFileUrl(url));
  return thumb || getCloudinaryThumbnailUrl(videoUrl) || '';
};

module.exports = {
  isVideoFileUrl,
  getCloudinaryThumbnailUrl,
  getOptimizedVideoUrl,
  resolveReelThumbnail,
};
