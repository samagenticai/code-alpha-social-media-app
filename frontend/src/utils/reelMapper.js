/** Normalize API reel shape for frontend components */
import {
  getCloudinaryThumbnailUrl,
  getOptimizedCloudinaryVideoUrl,
  isVideoFileUrl,
} from './reelMedia';

export const mapReel = (reel) => {
  if (!reel) return null;

  const id = reel.id || reel._id?.toString?.() || reel._id;
  const user = reel.user || reel.author || {};
  const uname = user.username || (user.handle ? String(user.handle).replace('@', '') : 'user');
  const handle = `@${uname}`;
  const avatar = user.avatar || user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
  const fname = user.name || user.fullName || uname || 'User';

  const rawVideoUrl =
    reel.videoUrl ||
    (typeof reel.video === 'string' ? reel.video : reel.video?.url || reel.video?.secure_url) ||
    reel.mediaUrl ||
    reel.url ||
    (Array.isArray(reel.media) ? (typeof reel.media[0] === 'string' ? reel.media[0] : reel.media[0]?.url) : '') ||
    '';

  const optimizedVideoUrl = getOptimizedCloudinaryVideoUrl(rawVideoUrl);
  const thumbnailCandidates = [
    reel.thumbnailUrl,
    reel.video?.thumbnail,
    reel.poster,
    rawVideoUrl ? getCloudinaryThumbnailUrl(rawVideoUrl) : '',
    Array.isArray(reel.images) ? reel.images[0] : '',
  ];
  const thumbnailUrl = thumbnailCandidates.find((url) => url && !isVideoFileUrl(url)) || '';

  return {
    ...reel,
    id,
    _id: id,
    content: reel.content || reel.caption || '',
    caption: reel.caption || reel.content || '',
    user: {
      ...user,
      id: user.id || user._id || 'user',
      name: fname,
      fullName: fname,
      handle,
      username: uname,
      avatar,
      profileImage: avatar,
      title: user.title || '',
    },
    likesCount: reel.likesCount ?? reel.likes?.length ?? 0,
    commentsCount: reel.commentsCount ?? reel.comments?.length ?? 0,
    isLiked: reel.isLiked ?? false,
    visibility: reel.visibility || 'public',
    location: reel.location || '',
    hashtags: reel.hashtags || [],
    authorId: reel.authorId || reel.user?.id || reel.user?._id,
    source: 'cloudinary',
    videoUrl: optimizedVideoUrl || rawVideoUrl,
    thumbnailUrl,
    comments: (reel.comments || []).map((c) => ({
      ...c,
      id: c.id || c._id,
      likesCount: c.likesCount ?? c.likes ?? 0,
      isLiked: c.isLiked ?? false,
      user: {
        ...(c.user || {}),
        name: c.user?.name || c.name || 'User',
        avatar: c.user?.avatar || c.avatar || '',
        username: c.user?.username,
      },
    })),
  };
};

export const mapReels = (reels) => (Array.isArray(reels) ? reels.map(mapReel).filter(Boolean) : []);
