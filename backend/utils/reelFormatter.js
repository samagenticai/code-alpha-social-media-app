const formatTimeAgo = (date) => {
  if (!date) return 'Just now';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const formatUserSnippet = (user) => {
  if (!user) {
    return {
      id: 'creator',
      name: 'Creator',
      fullName: 'Creator',
      username: 'creator',
      handle: '@creator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      title: 'Creator',
      verified: false,
    };
  }
  const uname = user.username || (user.handle ? String(user.handle).replace('@', '') : 'creator');
  const fname = user.fullName || user.name || uname || 'Creator';
  const img = user.profileImage || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

  return {
    id: user._id?.toString() || user.id || 'creator',
    name: fname,
    fullName: fname,
    username: uname,
    handle: `@${uname}`,
    avatar: img,
    profileImage: img,
    title: user.title || 'Creator',
    verified: Boolean(user.verified),
  };
};

const formatComment = (comment, currentUserId) => {
  const commentLikes = comment.likes || [];
  const currentId = currentUserId?.toString();
  return {
    id: comment._id?.toString() || `comment_${Date.now()}`,
    user: {
      id: comment.user?._id?.toString() || comment.user?.toString(),
      name: comment.name || comment.user?.fullName || 'User',
      avatar: comment.avatar || comment.user?.profileImage || '',
      username: comment.user?.username,
      title: comment.user?.title || '',
    },
    text: comment.text,
    timeAgo: formatTimeAgo(comment.createdAt),
    createdAt: comment.createdAt,
    likesCount: commentLikes.length,
    likes: commentLikes.length,
    isLiked: currentId ? commentLikes.some((id) => id.toString() === currentId) : false,
  };
};

const { getOptimizedVideoUrl, resolveReelThumbnail } = require('../utils/cloudinaryDelivery');

const formatReel = (reel, currentUserId, extra = {}) => {
  const reelObj = reel.toObject ? reel.toObject() : reel;
  const author = reelObj.author;
  const likes = reelObj.likes || [];
  const shares = reelObj.shares || [];
  let comments = reelObj.comments || [];
  const currentId = currentUserId?.toString();
  const rawVideoUrl = reelObj.videoUrl || '';
  const videoUrl = getOptimizedVideoUrl(rawVideoUrl);
  const thumbnailUrl = resolveReelThumbnail(reelObj);

  if (extra.hiddenCommentUserIds?.size) {
    comments = comments.filter((comment) => {
      const commentUserId = comment.user?._id?.toString() || comment.user?.toString();
      if (!commentUserId) return true;
      if (commentUserId === currentId) return true;
      return !extra.hiddenCommentUserIds.has(commentUserId);
    });
  }

  return {
    id: reelObj._id?.toString() || reelObj.id,
    _id: reelObj._id?.toString() || reelObj.id,
    content: reelObj.caption || '',
    caption: reelObj.caption || '',
    source: 'cloudinary',
    isDemo: Boolean(reelObj.isDemo),
    isReel: true,
    reelOrder: reelObj.reelOrder ?? null,
    videoUrl,
    videoPublicId: reelObj.videoPublicId || '',
    thumbnailUrl,
    user: {
      ...formatUserSnippet(author),
      isFollowing: extra.isFollowing ?? false,
    },
    userId: author?._id?.toString() || author?.id,
    timeAgo: formatTimeAgo(reelObj.createdAt),
    createdAt: reelObj.createdAt,
    likesCount: likes.length,
    commentsCount: comments.length,
    sharesCount: shares.length,
    isLiked: currentId ? likes.some((id) => id.toString() === currentId) : false,
    location: reelObj.location || '',
    hashtags: reelObj.hashtags || [],
    visibility: reelObj.visibility || 'public',
    authorId: author?._id?.toString() || author?.id,
    comments: comments.map((c) => formatComment(c, currentUserId)),
    video: videoUrl
      ? {
        url: videoUrl,
        publicId: reelObj.videoPublicId,
        thumbnail: thumbnailUrl,
        title: reelObj.caption?.slice(0, 40) || 'Reel',
        duration: '0:30',
      }
      : undefined,
  };
};

module.exports = {
  formatReel,
  formatComment,
  formatTimeAgo,
  formatUserSnippet,
};
