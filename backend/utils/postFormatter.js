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

const { canCommentOnUser } = require('./privacy');

const formatUserSnippet = (user) => {
  if (!user) return null;
  return {
    id: user._id?.toString() || user.id,
    name: user.fullName || user.name,
    fullName: user.fullName || user.name,
    username: user.username,
    handle: `@${user.username}`,
    avatar: user.profileImage,
    profileImage: user.profileImage,
    title: user.title || '',
    verified: false,
    privacy: user.privacy || {},
  };
};

const formatPost = (post, currentUserId, options = {}) => {
  const postObj = post.toObject ? post.toObject() : post;
  const user = postObj.user;
  const likes = postObj.likes || [];
  const shares = postObj.shares || [];
  const saves = postObj.saves || [];
  let comments = postObj.comments || [];
  const currentId = currentUserId?.toString();

  const whoCanComment = user?.privacy?.whoCanComment || 'everyone';
  const canComment = user && currentUserId ? canCommentOnUser(user, currentUserId) : whoCanComment !== 'nobody';
  const allowComments = whoCanComment !== 'nobody';

  if (options.hiddenCommentUserIds?.size) {
    comments = comments.filter((comment) => {
      const commentUserId = comment.user?._id?.toString() || comment.user?.toString();
      if (!commentUserId) return true;
      if (commentUserId === currentId) return true;
      return !options.hiddenCommentUserIds.has(commentUserId);
    });
  }

  const images = postObj.images?.length
    ? postObj.images
    : postObj.imageUrl
      ? [postObj.imageUrl]
      : [];

  return {
    id: postObj._id?.toString() || postObj.id,
    _id: postObj._id?.toString() || postObj.id,
    content: postObj.content || '',
    images,
    imageUrl: postObj.imageUrl || images[0] || '',
    imagePublicId: postObj.imagePublicId || '',
    videoUrl: postObj.videoUrl || postObj.video?.url || '',
    videoPublicId: postObj.videoPublicId || postObj.video?.publicId || '',
    media: postObj.media || [],
    video: (postObj.videoUrl || postObj.video?.url) && (postObj.video?.url || postObj.videoUrl)
      ? {
          url: postObj.video?.url || postObj.videoUrl,
          publicId: postObj.video?.publicId || postObj.videoPublicId,
          thumbnail: postObj.video?.thumbnail || '',
          duration: postObj.video?.duration || '0:30',
          title: postObj.video?.title || 'Video',
        }
      : undefined,
    user: formatUserSnippet(user),
    userId: user?._id?.toString() || user?.id,
    timeAgo: formatTimeAgo(postObj.createdAt),
    createdAt: postObj.createdAt,
    likesCount: likes.length,
    commentsCount: comments.length,
    savesCount: saves.length,
    sharesCount: shares.length,
    isLiked: currentId ? likes.some((id) => id.toString() === currentId) : false,
    isSaved: currentId ? saves.some((id) => id.toString() === currentId) : false,
    comments: comments.map((c) => formatComment(c, currentUserId)),
    isReel: Boolean(postObj.isReel),
    isDemo: Boolean(postObj.isDemo),
    source: postObj.source || '',
    reelOrder: postObj.reelOrder ?? null,
    whoCanComment,
    canComment,
    allowComments,
    hideLikes: Boolean(user?.privacy?.hideLikedPosts || user?.privacy?.hideLikes || postObj.hideLikes),
    audience: postObj.audience || 'public',
  };
};

module.exports = { formatPost, formatComment, formatTimeAgo, formatUserSnippet };
