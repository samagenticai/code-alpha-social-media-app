const Reel = require('../models/Reel');
const Post = require('../models/Post');
const User = require('../models/User');
const { formatReel } = require('../utils/reelFormatter');
const { getOptimizedVideoUrl, getCloudinaryThumbnailUrl } = require('../utils/cloudinaryDelivery');
const { deleteFromCloudinary } = require('../services/cloudinaryService');
const { createNotification } = require('./notificationsController');
const { canCommentOnUser, validateMentions } = require('../utils/privacy');
const { assertNotBlocked, getBlockedUserIds, getRestrictedMapForOwners } = require('../utils/moderation');
const { sortReelsForFeed } = require('../utils/assignDemoCloudinaryVideos');

const populateReel = (query) =>
  query
    .populate('author', 'fullName username profileImage title bio')
    .populate({
      path: 'comments.user',
      select: 'fullName username profileImage title',
    });

const getFollowingIds = async (userId) => {
  if (!userId) return [];
  const user = await User.findById(userId).select('following');
  return (user?.following || []).map((id) => id.toString());
};

const formatReelsWithFollowStatus = async (reels, currentUserId) => {
  const followingIds = await getFollowingIds(currentUserId);
  const ownerIds = reels.map((r) => r.author?._id || r.author).filter(Boolean);
  const restrictedMap = await getRestrictedMapForOwners(ownerIds);
  return reels.map((reel) => {
    const authorId = reel.author?._id?.toString() || reel.author?.toString();
    return formatReel(reel, currentUserId, {
      isFollowing: authorId ? followingIds.includes(authorId) : false,
      hiddenCommentUserIds: authorId ? restrictedMap.get(authorId) : null,
    });
  });
};

const canViewReel = (reel, currentUserId, followingIds) => {
  if (reel.isDemo) return true;
  const authorId = reel.author?._id?.toString() || reel.author?.toString();
  if (!currentUserId) return reel.visibility === 'public' || !reel.visibility;
  if (authorId === currentUserId.toString()) return true;
  const vis = reel.visibility || 'public';
  if (vis === 'public') return true;
  if (vis === 'private') return false;
  if (vis === 'followers') return followingIds.includes(authorId);
  return true;
};

exports.getReels = async (req, res) => {
  try {
    const followingIds = await getFollowingIds(req.user?._id);
    const blockedIds = req.user?._id ? await getBlockedUserIds(req.user._id) : new Set();
    const reels = await populateReel(
      Reel.find({ isRemoved: { $ne: true } })
    );

    // Also fetch all user video posts from Post model so every user's video appears in Reels
    const videoPosts = await Post.find({
      isRemoved: { $ne: true },
      $or: [
        { videoUrl: { $exists: true, $ne: '' } },
        { 'video.url': { $exists: true, $ne: '' } },
      ],
    }).populate('user', 'fullName username profileImage title bio');

    const existingVideoUrls = new Set(reels.map((r) => r.videoUrl));

    const convertedPostReels = videoPosts
      .filter((p) => {
        const vUrl = p.videoUrl || p.video?.url;
        return vUrl && !existingVideoUrls.has(vUrl);
      })
      .map((p) => {
        const vUrl = p.videoUrl || p.video?.url;
        return {
          _id: p._id,
          author: p.user,
          source: 'cloudinary',
          videoUrl: getOptimizedVideoUrl(vUrl),
          videoPublicId: p.videoPublicId || p.video?.publicId || '',
          thumbnailUrl: getCloudinaryThumbnailUrl(vUrl) || p.imageUrl || '',
          caption: p.content || '',
          likes: p.likes || [],
          comments: p.comments || [],
          shares: p.shares || [],
          createdAt: p.createdAt,
          isDemo: false,
          visibility: 'public',
        };
      });

    const combinedReels = sortReelsForFeed([...reels, ...convertedPostReels]);
    const visible = combinedReels.filter((r) => {
      const authorId = r.author?._id?.toString() || r.author?.toString();
      if (authorId && blockedIds.has(authorId)) return false;
      return canViewReel(r, req.user?._id, followingIds);
    });
    const formatted = await formatReelsWithFollowStatus(visible, req.user?._id);

    res.status(200).json({ success: true, reels: formatted });
  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to load reels.' });
  }
};

exports.createReel = async (req, res) => {
  try {
    const { caption, videoUrl, videoPublicId, thumbnailUrl, location, hashtags, visibility } = req.body;

    if (!videoUrl?.trim() || !videoPublicId?.trim()) {
      return res.status(400).json({ success: false, message: 'Video URL and public ID are required.' });
    }

    const mentionCheck = await validateMentions(caption, req.user._id);
    if (!mentionCheck.ok) {
      return res.status(403).json({ success: false, message: mentionCheck.message });
    }

    const parsedHashtags = Array.isArray(hashtags)
      ? hashtags.map((t) => String(t).replace(/^#/, '').trim()).filter(Boolean).slice(0, 30)
      : typeof hashtags === 'string'
        ? hashtags.split(/[\s,]+/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean).slice(0, 30)
        : [];

    const reel = await Reel.create({
      author: req.user._id,
      source: 'cloudinary',
      videoUrl: videoUrl.trim(),
      videoPublicId: videoPublicId.trim(),
      thumbnailUrl: thumbnailUrl?.trim() || videoUrl.trim(),
      caption: caption?.trim() || '',
      location: location?.trim() || '',
      hashtags: parsedHashtags,
      visibility: ['public', 'followers', 'private'].includes(visibility) ? visibility : 'public',
      isDemo: false,
    });

    const populated = await populateReel(Reel.findById(reel._id));
    const followingIds = await getFollowingIds(req.user._id);
    const formatted = formatReel(populated, req.user._id, { isFollowing: false });

    res.status(201).json({ success: true, reel: formatted });
  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to publish reel.' });
  }
};

exports.deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found.' });
    }

    if (reel.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this reel.' });
    }

    if (reel.source === 'cloudinary' && reel.videoPublicId) {
      await deleteFromCloudinary(reel.videoPublicId, 'video').catch(() => { });
    }

    await reel.deleteOne();
    res.status(200).json({ success: true, message: 'Reel deleted.', id: req.params.id });
  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete reel.' });
  }
};

exports.updateReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found.' });
    }

    if (reel.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this reel.' });
    }

    if (reel.isDemo) {
      return res.status(403).json({ success: false, message: 'Demo reels cannot be edited.' });
    }

    const { caption, location, hashtags, visibility } = req.body;
    if (caption !== undefined) reel.caption = caption.trim();
    if (location !== undefined) reel.location = location.trim();
    if (visibility !== undefined && ['public', 'followers', 'private'].includes(visibility)) {
      reel.visibility = visibility;
    }
    if (hashtags !== undefined) {
      reel.hashtags = Array.isArray(hashtags)
        ? hashtags.map((t) => String(t).replace(/^#/, '').trim()).filter(Boolean).slice(0, 30)
        : String(hashtags).split(/[\s,]+/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean).slice(0, 30);
    }

    await reel.save();
    const populated = await populateReel(Reel.findById(reel._id));
    const followingIds = await getFollowingIds(req.user._id);
    const authorId = populated.author?._id?.toString();
    const formatted = formatReel(populated, req.user._id, {
      isFollowing: authorId ? followingIds.includes(authorId) : false,
    });

    res.status(200).json({ success: true, reel: formatted });
  } catch (error) {
    console.error('Update reel error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update reel.' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id).populate('author', '_id');
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found.' });
    }

    const ownerId = reel.author?._id || reel.author;
    if (ownerId) {
      await assertNotBlocked(req.user._id, ownerId, 'You cannot like this reel.');
    }

    const userId = req.user._id;
    const index = reel.likes.findIndex((id) => id.toString() === userId.toString());
    let isLiked;

    if (index > -1) {
      reel.likes.splice(index, 1);
      isLiked = false;
    } else {
      reel.likes.push(userId);
      isLiked = true;
    }

    await reel.save();
    const populated = await populateReel(Reel.findById(reel._id));
    const followingIds = await getFollowingIds(req.user._id);
    const authorId = populated.author?._id?.toString();
    const formatted = formatReel(populated, req.user._id, {
      isFollowing: authorId ? followingIds.includes(authorId) : false,
    });

    if (isLiked && reel.author) {
      await createNotification({
        recipient: reel.author._id || reel.author,
        sender: userId,
        type: 'post_like',
        post: reel._id,
      });
    }

    res.status(200).json({
      success: true,
      isLiked,
      likesCount: reel.likes.length,
      reel: formatted,
    });
  } catch (error) {
    console.error('Toggle reel like error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update like.' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const reel = await Reel.findById(req.params.id).populate('author', 'privacy following followers');
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found.' });
    }

    const owner = reel.author;
    if (owner) {
      await assertNotBlocked(req.user._id, owner._id || owner, 'You cannot comment on this reel.');
    }
    if (owner && !canCommentOnUser(owner, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to comment on this user\'s reels.',
      });
    }

    const mentionCheck = await validateMentions(text, req.user._id);
    if (!mentionCheck.ok) {
      return res.status(403).json({ success: false, message: mentionCheck.message });
    }

    reel.comments.push({
      user: req.user._id,
      name: req.user.fullName,
      avatar: req.user.profileImage,
      text: text.trim(),
    });

    await reel.save();
    const populated = await populateReel(Reel.findById(reel._id));
    const followingIds = await getFollowingIds(req.user._id);
    const authorId = populated.author?._id?.toString();
    const formatted = formatReel(populated, req.user._id, {
      isFollowing: authorId ? followingIds.includes(authorId) : false,
    });

    if (reel.author) {
      await createNotification({
        recipient: reel.author._id || reel.author,
        sender: req.user._id,
        type: 'post_comment',
        post: reel._id,
        text: text.trim(),
      });
    }

    res.status(201).json({ success: true, reel: formatted });
  } catch (error) {
    console.error('Add reel comment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to add comment.' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found.' });
    }

    const comment = reel.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    if (comment.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
    }

    comment.deleteOne();
    await reel.save();
    const populated = await populateReel(Reel.findById(reel._id));
    const followingIds = await getFollowingIds(req.user._id);
    const authorId = populated.author?._id?.toString();
    const formatted = formatReel(populated, req.user._id, {
      isFollowing: authorId ? followingIds.includes(authorId) : false,
    });

    res.status(200).json({ success: true, reel: formatted });
  } catch (error) {
    console.error('Delete reel comment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete comment.' });
  }
};

exports.toggleCommentLike = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found.' });
    }

    const comment = reel.comments.id(req.params.commentId);
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

    await reel.save();
    const populated = await populateReel(Reel.findById(reel._id));
    const followingIds = await getFollowingIds(req.user._id);
    const authorId = populated.author?._id?.toString();
    const formatted = formatReel(populated, req.user._id, {
      isFollowing: authorId ? followingIds.includes(authorId) : false,
    });

    res.status(200).json({
      success: true,
      isLiked,
      likesCount: comment.likes.length,
      reel: formatted,
    });
  } catch (error) {
    console.error('Toggle reel comment like error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update comment like.' });
  }
};

exports.shareReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found.' });
    }

    const userId = req.user._id;
    if (!reel.shares) reel.shares = [];

    const alreadyShared = reel.shares.some((id) => id.toString() === userId.toString());
    if (!alreadyShared) {
      reel.shares.push(userId);
      await reel.save();
    }

    const populated = await populateReel(Reel.findById(reel._id));
    const followingIds = await getFollowingIds(req.user._id);
    const authorId = populated.author?._id?.toString();
    const formatted = formatReel(populated, req.user._id, {
      isFollowing: authorId ? followingIds.includes(authorId) : false,
    });

    res.status(200).json({
      success: true,
      sharesCount: reel.shares.length,
      reel: formatted,
    });
  } catch (error) {
    console.error('Share reel error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to share reel.' });
  }
};

exports.getUserReels = async (req, res) => {
  try {
    const cleanUsername = req.params.username.replace('@', '').toLowerCase();
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      return res.json({ success: true, reels: [] });
    }

    const currentUserIdStr = req.user ? req.user._id.toString() : null;
    const isOwner = currentUserIdStr ? user._id.toString() === currentUserIdStr : false;

    let isFollowing = false;
    if (currentUserIdStr && !isOwner) {
      const currentUser = await User.findById(req.user._id).select('following');
      isFollowing = currentUser?.following?.some((id) => id.toString() === user._id.toString()) || false;
    }

    if (user.isPrivate && !isOwner && !isFollowing) {
      return res.json({ success: true, isLocked: true, reels: [] });
    }

    const reels = await populateReel(
      Reel.find({ author: user._id, isRemoved: { $ne: true } }).sort({ createdAt: -1 })
    );

    const followingIds = await getFollowingIds(req.user?._id);
    const formatted = reels.map((reel) =>
      formatReel(reel, req.user?._id, {
        isFollowing: followingIds.includes(user._id.toString()),
      })
    );

    res.json({ success: true, reels: formatted });
  } catch (error) {
    console.error('Get user reels error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to load reels.' });
  }
};
