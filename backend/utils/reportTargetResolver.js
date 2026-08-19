const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Message = require('../models/Message');
const { REASON_LABELS } = require('../utils/reportConstants');

const formatUserSnippet = (user) => {
  if (!user) return null;
  return {
    id: user._id?.toString() || user.id,
    fullName: user.fullName || user.name || 'User',
    username: user.username,
    handle: user.username ? `@${user.username}` : '',
    avatar: user.profileImage || user.avatar || '',
    email: user.email || '',
  };
};

const findCommentInContent = async (commentId) => {
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) return null;
  const oid = new mongoose.Types.ObjectId(commentId);
  const [post, reel] = await Promise.all([
    Post.findOne({ 'comments._id': oid })
      .populate('user', 'fullName username profileImage email')
      .populate('comments.user', 'fullName username profileImage'),
    Reel.findOne({ 'comments._id': oid })
      .populate('author', 'fullName username profileImage email')
      .populate('comments.user', 'fullName username profileImage'),
  ]);

  if (post) {
    const comment = post.comments.find((c) => c._id?.toString() === commentId.toString());
    return {
      parentType: 'post',
      parent: post,
      comment,
      owner: post.user,
    };
  }
  if (reel) {
    const comment = reel.comments.find((c) => c._id?.toString() === commentId.toString());
    return {
      parentType: 'reel',
      parent: reel,
      comment,
      owner: reel.author,
    };
  }
  return null;
};

const buildPostPreview = (post) => {
  if (!post) return null;
  const images = post.images?.length ? post.images : post.imageUrl ? [post.imageUrl] : [];
  return {
    type: 'post',
    id: post._id.toString(),
    content: post.content || '',
    images,
    imageUrl: post.imageUrl || images[0] || '',
    videoUrl: post.videoUrl || post.video?.url || '',
    thumbnailUrl: post.video?.thumbnail || post.imageUrl || images[0] || '',
    likesCount: post.likes?.length || 0,
    commentsCount: post.comments?.length || 0,
    createdAt: post.createdAt,
    creator: formatUserSnippet(post.user),
  };
};

const buildReelPreview = (reel) => {
  if (!reel) return null;
  return {
    type: 'reel',
    id: reel._id.toString(),
    caption: reel.caption || '',
    videoUrl: reel.videoUrl || '',
    thumbnailUrl: reel.thumbnailUrl || '',
    source: reel.source || 'cloudinary',
    likesCount: reel.likes?.length || 0,
    commentsCount: reel.comments?.length || 0,
    createdAt: reel.createdAt,
    creator: formatUserSnippet(reel.author),
  };
};

exports.resolveReportTargetPreview = async (report) => {
  if (!report.targetId) return { reportedUser: null, targetPreview: null };

  switch (report.targetType) {
    case 'user': {
      const user = await User.findById(report.targetId).select('fullName username profileImage email accountStatus createdAt');
      return {
        reportedUser: formatUserSnippet(user),
        targetPreview: user
          ? {
              type: 'user',
              id: user._id.toString(),
              fullName: user.fullName,
              username: user.username,
              avatar: user.profileImage,
              accountStatus: user.accountStatus,
              createdAt: user.createdAt,
            }
          : null,
      };
    }
    case 'post': {
      const post = await Post.findById(report.targetId)
        .populate('user', 'fullName username profileImage email');
      return {
        reportedUser: formatUserSnippet(post?.user),
        targetPreview: buildPostPreview(post),
      };
    }
    case 'reel': {
      const reel = await Reel.findById(report.targetId)
        .populate('author', 'fullName username profileImage email');
      return {
        reportedUser: formatUserSnippet(reel?.author),
        targetPreview: buildReelPreview(reel),
      };
    }
    case 'message': {
      const msg = await Message.findById(report.targetId)
        .populate('sender', 'fullName username profileImage email')
        .populate('receiver', 'fullName username profileImage email');
      const reportedUser = formatUserSnippet(msg?.sender);
      return {
        reportedUser,
        targetPreview: msg
          ? {
              type: 'message',
              id: msg._id.toString(),
              text: msg.text || '',
              createdAt: msg.createdAt,
              sender: formatUserSnippet(msg.sender),
              receiver: formatUserSnippet(msg.receiver),
            }
          : null,
      };
    }
    case 'comment': {
      const found = await findCommentInContent(report.targetId);
      if (!found) return { reportedUser: null, targetPreview: null };
      const commentUser = found.comment?.user;
      const authorDoc = commentUser?._id ? commentUser : await User.findById(commentUser);
      const parentPreview =
        found.parentType === 'post' ? buildPostPreview(found.parent) : buildReelPreview(found.parent);
      return {
        reportedUser: formatUserSnippet(authorDoc),
        targetPreview: {
          type: 'comment',
          id: found.comment._id.toString(),
          text: found.comment.text,
          createdAt: found.comment.createdAt,
          author: formatUserSnippet(authorDoc),
          parentType: found.parentType,
          parentId: found.parent._id.toString(),
          parentPreview,
        },
      };
    }
    default:
      return { reportedUser: null, targetPreview: null };
  }
};

exports.formatAdminReport = async (report, reporterPopulated = null, includePreview = true) => {
  const reporter = reporterPopulated || (report.reporter?._id ? report.reporter : null);
  let reportedUser = null;
  let targetPreview = null;

  if (includePreview) {
    const resolved = await exports.resolveReportTargetPreview(report);
    reportedUser = resolved.reportedUser;
    targetPreview = resolved.targetPreview;
  } else if (report.targetType === 'user' && report.targetId) {
    reportedUser = { id: report.targetId.toString() };
  }

  return {
    id: report._id.toString(),
    reportNumber: report._id.toString().slice(-6).toUpperCase(),
    reporter: reporter
      ? {
          id: reporter._id.toString(),
          fullName: reporter.fullName,
          username: reporter.username,
          handle: `@${reporter.username}`,
          avatar: reporter.profileImage,
          email: reporter.email || '',
        }
      : null,
    reportedUser,
    targetType: report.targetType,
    targetId: report.targetId?.toString() || null,
    targetRef: report.targetRef || '',
    targetPreview,
    reason: report.reason,
    reasonLabel: REASON_LABELS[report.reason] || report.reason,
    description: report.description || '',
    status: report.status,
    priority: report.priority,
    adminNote: report.adminNote || '',
    resolvedAt: report.resolvedAt,
    resolvedBy: report.resolvedBy
      ? {
          fullName: report.resolvedBy.fullName,
          username: report.resolvedBy.username,
        }
      : null,
    createdAt: report.createdAt,
  };
};

exports.buildPostPreview = buildPostPreview;
exports.buildReelPreview = buildReelPreview;
exports.formatUserSnippet = formatUserSnippet;
