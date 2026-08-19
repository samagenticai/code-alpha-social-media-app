const isVideoFileUrl = (url) =>
  typeof url === 'string' &&
  (/\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url) || url.includes('/video/upload'));

const isImageUrl = (url) =>
  typeof url === 'string' &&
  (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || url.includes('/image/upload'));

const getCloudinaryThumbnailUrl = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com') || !videoUrl.includes('/upload/')) {
    return '';
  }
  if (isImageUrl(videoUrl) && !isVideoFileUrl(videoUrl)) return videoUrl;
  if (videoUrl.includes('/upload/so_')) {
    return videoUrl.replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg');
  }
  return videoUrl
    .replace('/upload/', '/upload/so_0/')
    .replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg');
};

const getOptimizedVideoUrl = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('cloudinary.com') || !videoUrl.includes('/upload/')) {
    return videoUrl || '';
  }
  if (/\/upload\/[^/]*(?:f_auto|q_auto)/.test(videoUrl)) return videoUrl;
  return videoUrl.replace('/upload/', '/upload/f_auto,q_auto:good,w_1080,c_limit/');
};

const resolveReelThumbnail = (reelObj) => {
  const videoUrl = reelObj.videoUrl || '';
  const candidates = [
    reelObj.thumbnailUrl,
    videoUrl ? getCloudinaryThumbnailUrl(videoUrl) : '',
  ];
  const thumb = candidates.find((url) => url && !isVideoFileUrl(url));
  return thumb || '';
};

module.exports = {
  isVideoFileUrl,
  getCloudinaryThumbnailUrl,
  getOptimizedVideoUrl,
  resolveReelThumbnail,
};
