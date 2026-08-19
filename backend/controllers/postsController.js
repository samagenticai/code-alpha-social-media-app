const Post = require('../models/Post');
const Reel = require('../models/Reel');
const User = require('../models/User');
const { formatPost, formatUserSnippet } = require('../utils/postFormatter');
const { deleteFromCloudinary } = require('../services/cloudinaryService');
const { createNotification } = require('./notificationsController');
const { canCommentOnUser, validateMentions, canMessageUser } = require('../utils/privacy');
const { assertNotBlocked, isRestrictedBy, getBlockedUserIds, getRestrictedMapForOwners } = require('../utils/moderation');
const { getPagination } = require('../utils/pagination');

const populatePost = (query) =>
  query.populate('user', 'fullName username profileImage title verified isPrivate followers following privacy').populate({
    path: 'comments.user',
    select: 'fullName username profileImage title',
  });

exports.getFeed = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query, 10);

    const baseFilter = { isReel: { $ne: true }, isRemoved: { $ne: true } };
    const total = await Post.countDocuments(baseFilter);

    const posts = await populatePost(
      Post.find(baseFilter).sort({ createdAt: -1 }).skip(skip).limit(limit)
    );

    const currentUserIdStr = req.user ? req.user._id.toString() : null;
    const blockedIds = currentUserIdStr ? await getBlockedUserIds(req.user._id) : new Set();
    const ownerIds = posts.map((p) => p.user?._id).filter(Boolean);
    const restrictedMap = await getRestrictedMapForOwners(ownerIds);

    const visiblePosts = posts.filter((p) => {
      if (!p.user) return false;
      const authorId = p.user._id?.toString() || p.user.id?.toString();
      if (blockedIds.has(authorId)) return false;

      const isOwner = Boolean(currentUserIdStr && authorId === currentUserIdStr);
      const isFollower = Boolean(
        currentUserIdStr &&
        Array.isArray(p.user.followers) &&
        p.user.followers.some((fId) => (fId._id?.toString() || fId.toString()) === currentUserIdStr)
      );

      const postAudience = p.audience || 'public';

      // 1. Private post ("Only Me"): ONLY the author can see it
      if (postAudience === 'private') {
        return isOwner;
      }

      // 2. Followers-only post: ONLY author and followers can see it
      if (postAudience === 'followers') {
        return isOwner || isFollower;
      }

      // 3. Public post:
      if (!p.user.isPrivate) return true;
      if (!currentUserIdStr) return false;
      return isOwner || isFollower;
    });

    res.status(200).json({
      success: true,
      posts: visiblePosts.map((p) => {
        const ownerId = p.user?._id?.toString();
        const hiddenCommentUserIds = ownerId ? restrictedMap.get(ownerId) : null;
        return formatPost(p, req.user?._id, { hiddenCommentUserIds });
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: skip + posts.length < total,
      },
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to load feed.' });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const posts = await populatePost(
      Post.find({ saves: req.user._id, isRemoved: { $ne: true } }).sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      posts: posts.map((p) => formatPost(p, req.user._id)),
    });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to load saved posts.' });
  }
};

exports.getPostLikers = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'likes',
      'fullName username profileImage title'
    );

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    res.status(200).json({
      success: true,
      likers: post.likes.map(formatUserSnippet),
    });
  } catch (error) {
    console.error('Get likers error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to load likers.' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const {
      content,
      imageUrl,
      imagePublicId,
      videoUrl,
      videoPublicId,
      images,
      media,
      video,
      audience,
    } = req.body;

    if (!content?.trim() && !imageUrl && !videoUrl && !images?.length) {
      return res.status(400).json({ success: false, message: 'Post must have content or media.' });
    }

    const mentionCheck = await validateMentions(content, req.user._id);
    if (!mentionCheck.ok) {
      return res.status(403).json({ success: false, message: mentionCheck.message });
    }

    const validAudience = ['public', 'followers', 'private'].includes(audience) ? audience : 'public';

    const post = await Post.create({
      user: req.user._id,
      content: content?.trim() || '',
      imageUrl: imageUrl || images?.[0] || '',
      imagePublicId: imagePublicId || '',
      videoUrl: videoUrl || video?.url || '',
      videoPublicId: videoPublicId || video?.publicId || '',
      images: images?.length ? images : imageUrl ? [imageUrl] : [],
      media: media || [],
      video: video || undefined,
      audience: validAudience,
    });

    // If post contains a video, automatically publish it to Reels as well with user's ID
    const vUrl = videoUrl || video?.url || (media && media.find((m) => m.resourceType === 'video' || m.type === 'video')?.url);
    const vPublicId = videoPublicId || video?.publicId || (media && media.find((m) => m.resourceType === 'video' || m.type === 'video')?.publicId);

    if (vUrl) {
      try {
        await Reel.create({
          author: req.user._id,
          source: 'cloudinary',
          videoUrl: vUrl.trim(),
          videoPublicId: vPublicId?.trim() || 'post_video_' + Date.now(),
          thumbnailUrl: video?.thumbnail || vUrl.trim(),
          caption: content?.trim() || '',
          location: '',
          hashtags: [],
          visibility: 'public',
          isDemo: false,
        });
      } catch (reelErr) {
        console.warn('Auto-create Reel error:', reelErr);
      }
    }

    const populated = await populatePost(Post.findById(post._id));

    res.status(201).json({
      success: true,
      post: formatPost(populated, req.user._id),
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create post.' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post.' });
    }

    const { content } = req.body;
    if (content !== undefined) post.content = content.trim();

    await post.save();
    const populated = await populatePost(Post.findById(post._id));

    res.status(200).json({
      success: true,
      post: formatPost(populated, req.user._id),
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update post.' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post.' });
    }

    if (post.imagePublicId) await deleteFromCloudinary(post.imagePublicId).catch(() => {});
    if (post.videoPublicId) await deleteFromCloudinary(post.videoPublicId, 'video').catch(() => {});

    await post.deleteOne();

    res.status(200).json({ success: true, message: 'Post deleted.' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete post.' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user', '_id');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const ownerId = post.user?._id || post.user;
    if (ownerId) {
      await assertNotBlocked(req.user._id, ownerId, 'You cannot like this post.');
    }

    const userId = req.user._id;
    const index = post.likes.findIndex((id) => id.toString() === userId.toString());
    let isLiked;

    if (index > -1) {
      post.likes.splice(index, 1);
      isLiked = false;
    } else {
      post.likes.push(userId);
      isLiked = true;
    }

    await post.save();
    const populated = await populatePost(Post.findById(post._id));

    if (isLiked && post.user) {
      await createNotification({
        recipient: post.user._id || post.user,
        sender: userId,
        type: 'post_like',
        post: post._id,
      });
    }

    res.status(200).json({
      success: true,
      isLiked,
      likesCount: post.likes.length,
      post: formatPost(populated, req.user._id),
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update like.' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const post = await Post.findById(req.params.id).populate('user', 'privacy following followers');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const owner = post.user;
    if (owner) {
      await assertNotBlocked(req.user._id, owner._id || owner, 'You cannot comment on this post.');
    }
    if (owner && !canCommentOnUser(owner, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to comment on this user\'s posts.',
      });
    }

    const mentionCheck = await validateMentions(text, req.user._id);
    if (!mentionCheck.ok) {
      return res.status(403).json({ success: false, message: mentionCheck.message });
    }

    post.comments.push({
      user: req.user._id,
      name: req.user.fullName,
      avatar: req.user.profileImage,
      text: text.trim(),
    });

    await post.save();
    const populated = await populatePost(Post.findById(post._id));

    if (post.user) {
      await createNotification({
        recipient: post.user._id || post.user,
        sender: req.user._id,
        type: 'post_comment',
        post: post._id,
        text: text.trim(),
      });
    }

    res.status(201).json({
      success: true,
      post: formatPost(populated, req.user._id),
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to add comment.' });
  }
};

exports.getReels = async (req, res) => {
  try {
    const posts = await populatePost(
      Post.find({ isReel: true, isRemoved: { $ne: true } }).sort({ reelOrder: 1, createdAt: 1 })
    );

    let currentFollowing = [];
    if (req.user) {
      const currentUser = await User.findById(req.user._id).select('following');
      currentFollowing = (currentUser?.following || []).map((id) => id.toString());
    }

    const reels = posts.map((p) => {
      const formatted = formatPost(p, req.user?._id);
      if (formatted.user?.id) {
        formatted.user.isFollowing = currentFollowing.includes(formatted.user.id);
      }
      return formatted;
    });

    res.status(200).json({
      success: true,
      reels,
    });
  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to load reels.' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const commentUserId = comment.user?.toString();
    if (commentUserId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
    }

    comment.deleteOne();
    await post.save();
    const populated = await populatePost(Post.findById(post._id));

    res.status(200).json({
      success: true,
      post: formatPost(populated, req.user._id),
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete comment.' });
  }
};

exports.toggleCommentLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    if (!comment.likes) comment.likes = [];
    const userId = req.user._id;
    const index = comment.likes.findIndex((id) => id.toString() === userId.toString());
    let isLiked;

    if (index > -1) {
      comment.likes.splice(index, 1);
      isLiked = false;
    } else {
      comment.likes.push(userId);
      isLiked = true;
    }

    await post.save();
    const populated = await populatePost(Post.findById(post._id));

    res.status(200).json({
      success: true,
      isLiked,
      likesCount: comment.likes.length,
      post: formatPost(populated, req.user._id),
    });
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update comment like.' });
  }
};

exports.toggleSave = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const userId = req.user._id;
    const index = post.saves.findIndex((id) => id.toString() === userId.toString());
    let isSaved;

    if (index > -1) {
      post.saves.splice(index, 1);
      isSaved = false;
    } else {
      post.saves.push(userId);
      isSaved = true;
    }

    await post.save();
    const populated = await populatePost(Post.findById(post._id));

    if (isSaved && post.user) {
      await createNotification({
        recipient: post.user._id || post.user,
        sender: userId,
        type: 'post_save',
        post: post._id,
      });
    }

    res.status(200).json({
      success: true,
      isSaved,
      savesCount: post.saves.length,
      post: formatPost(populated, req.user._id),
    });
  } catch (error) {
    console.error('Toggle save error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save post.' });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const userId = req.user._id;
    if (!post.shares) post.shares = [];

    const alreadyShared = post.shares.some((id) => id.toString() === userId.toString());
    if (!alreadyShared) {
      post.shares.push(userId);
      await post.save();
    }

    const populated = await populatePost(Post.findById(post._id));

    res.status(200).json({
      success: true,
      sharesCount: post.shares.length,
      post: formatPost(populated, req.user._id),
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to share post.' });
  }
};

exports.getPostLikers = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('likes', 'fullName username profileImage title verified');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const currentUserId = req.user ? req.user._id : null;
    let currentFollowing = [];
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select('following');
      currentFollowing = (currentUser?.following || []).map((id) => id.toString());
    }

    const likers = (post.likes || []).map((u) => ({
      id: u._id?.toString() || u.id,
      name: u.fullName || u.name || 'User',
      username: u.username,
      handle: u.username ? `@${u.username}` : '@user',
      avatar: u.profileImage,
      profileImage: u.profileImage,
      title: u.title || '',
      verified: Boolean(u.verified),
      isFollowing: currentFollowing.includes(u._id?.toString()),
    }));

    res.status(200).json({
      success: true,
      likers,
    });
  } catch (error) {
    console.error('Get post likers error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to load likers.' });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const posts = await populatePost(
      Post.find({ user: user._id, isReel: { $ne: true }, isRemoved: { $ne: true } }).sort({ createdAt: -1 })
    );

    const currentUserIdStr = req.user ? req.user._id.toString() : null;
    const isOwner = Boolean(currentUserIdStr && user._id.toString() === currentUserIdStr);
    const isFollower = Boolean(
      currentUserIdStr &&
      Array.isArray(user.followers) &&
      user.followers.some((fId) => (fId._id?.toString() || fId.toString()) === currentUserIdStr)
    );

    const visiblePosts = posts.filter((p) => {
      const postAudience = p.audience || 'public';
      if (postAudience === 'private') {
        return isOwner;
      }
      if (postAudience === 'followers') {
        return isOwner || isFollower;
      }
      return true;
    });

    res.status(200).json({
      success: true,
      posts: visiblePosts.map((p) => formatPost(p, req.user?._id)),
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to load posts.' });
  }
};
