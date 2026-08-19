const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Report = require('../models/Report');
const ReportMessage = require('../models/ReportMessage');
const SupportTicket = require('../models/SupportTicket');
const AdminActivityLog = require('../models/AdminActivityLog');
const AdminNotification = require('../models/AdminNotification');
const UserBlock = require('../models/UserBlock');
const UserRestrict = require('../models/UserRestrict');
const { formatAdminReport } = require('../utils/reportTargetResolver');
const { formatAdminNotification, MAX_ACTIVE_ADMIN_NOTIFICATIONS } = require('../utils/adminNotifications');
const { formatReportMessage, notifyUserAboutReport } = require('./reportsController');
const mongoose = require('mongoose');
const { deleteFromCloudinary } = require('../services/cloudinaryService');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const { logAdminAction } = require('../utils/adminLogger');

const formatAdminUser = (user, postsCount = 0) => ({
  id: user._id.toString(),
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  title: user.title || '',
  profileImage: user.profileImage,
  avatar: user.profileImage,
  followersCount: user.followers?.length || 0,
  followingCount: user.following?.length || 0,
  postsCount,
  accountStatus: user.accountStatus || 'active',
  role: user.role || 'user',
  isDemo: Boolean(user.isDemo),
  blockReason: user.blockReason || '',
  blockedAt: user.blockedAt,
  createdAt: user.createdAt,
});

const formatAdminProfile = (user) => ({
  id: user._id.toString(),
  fullName: user.fullName,
  name: user.fullName,
  username: user.username,
  handle: `@${user.username}`,
  email: user.email,
  phone: user.phone || '',
  title: user.title || '',
  bio: user.bio || '',
  location: user.location || '',
  profileImage: user.profileImage,
  profileImagePublicId: user.profileImagePublicId || '',
  avatar: user.profileImage,
  coverImage: user.coverImage,
  coverImagePublicId: user.coverImagePublicId || '',
  role: 'admin',
  accountStatus: user.accountStatus || 'active',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const thirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const sevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      newUsers,
      blockedUsers,
      reportedUsersAgg,
      totalPosts,
      totalReels,
      postCommentsAgg,
      reelCommentsAgg,
      totalLikesPosts,
      totalLikesReels,
      openReports,
      pendingSupport,
      resolvedReports,
      highPriorityReports,
      recentUsers,
      recentPosts,
      recentReels,
      recentReports,
      recentTickets,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ accountStatus: 'active', updatedAt: { $gte: thirtyDaysAgo() } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo() } }),
      User.countDocuments({ accountStatus: { $in: ['blocked', 'suspended'] } }),
      Report.distinct('targetId', { targetType: 'user', status: { $in: ['pending', 'in_review'] } }),
      Post.countDocuments({ isRemoved: { $ne: true }, isReel: { $ne: true } }),
      Reel.countDocuments({ isRemoved: { $ne: true } }),
      Post.aggregate([{ $project: { count: { $size: { $ifNull: ['$comments', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Reel.aggregate([{ $project: { count: { $size: { $ifNull: ['$comments', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Post.aggregate([{ $project: { count: { $size: { $ifNull: ['$likes', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Reel.aggregate([{ $project: { count: { $size: { $ifNull: ['$likes', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Report.countDocuments({ status: { $in: ['pending', 'in_review'] } }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress', 'waiting_for_user'] } }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ priority: 'high', status: { $in: ['pending', 'in_review'] } }),
      User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(5).select('fullName username profileImage email accountStatus createdAt'),
      Post.find({ isRemoved: { $ne: true } }).sort({ createdAt: -1 }).limit(5).populate('user', 'fullName username profileImage'),
      Reel.find({ isRemoved: { $ne: true } }).sort({ createdAt: -1 }).limit(5).populate('author', 'fullName username profileImage'),
      Report.find().sort({ createdAt: -1 }).limit(5).populate('reporter', 'fullName username profileImage'),
      SupportTicket.find().sort({ createdAt: -1 }).limit(5).populate('user', 'fullName username profileImage email'),
    ]);

    const totalComments = (postCommentsAgg[0]?.total || 0) + (reelCommentsAgg[0]?.total || 0);
    const totalLikes = (totalLikesPosts[0]?.total || 0) + (totalLikesReels[0]?.total || 0);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, active: activeUsers, new: newUsers, blocked: blockedUsers, reported: reportedUsersAgg.length },
        content: { posts: totalPosts, reels: totalReels, comments: totalComments, likes: totalLikes },
        support: { openReports, pendingSupport, resolvedReports, highPriorityReports },
      },
      recent: {
        users: recentUsers.map((u) => formatAdminUser(u)),
        posts: recentPosts.map((p) => ({
          id: p._id.toString(),
          content: (p.content || '').slice(0, 120),
          author: p.user ? { fullName: p.user.fullName, username: p.user.username, avatar: p.user.profileImage } : null,
          likesCount: p.likes?.length || 0,
          commentsCount: p.comments?.length || 0,
          createdAt: p.createdAt,
        })),
        reels: recentReels.map((r) => ({
          id: r._id.toString(),
          caption: (r.caption || '').slice(0, 120),
          source: r.source,
          author: r.author ? { fullName: r.author.fullName, username: r.author.username, avatar: r.author.profileImage } : null,
          likesCount: r.likes?.length || 0,
          createdAt: r.createdAt,
        })),
        reports: recentReports.map((r) => ({
          id: r._id.toString(),
          targetType: r.targetType,
          reason: r.reason,
          status: r.status,
          priority: r.priority,
          reporter: r.reporter ? { fullName: r.reporter.fullName, username: r.reporter.username } : null,
          createdAt: r.createdAt,
        })),
        supportTickets: recentTickets.map((t) => ({
          id: t._id.toString(),
          ticketNumber: t.ticketNumber,
          subject: t.subject,
          category: t.category,
          status: t.status,
          user: t.user ? { fullName: t.user.fullName, username: t.user.username, email: t.user.email } : null,
          createdAt: t.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { role: { $ne: 'admin' } };
    if (req.query.status) filter.accountStatus = req.query.status;
    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    const userIds = users.map((u) => u._id);
    const postCounts = await Post.aggregate([
      { $match: { user: { $in: userIds }, isRemoved: { $ne: true } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(postCounts.map((p) => [p._id.toString(), p.count]));
    res.json({
      success: true,
      ...paginatedResponse(
        users.map((u) => formatAdminUser(u, countMap[u._id.toString()] || 0)),
        total,
        page,
        limit
      ),
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to load users.' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const [postsCount, reportsAgainst, userPosts, userReels] = await Promise.all([
      Post.countDocuments({ user: user._id, isRemoved: { $ne: true } }),
      Report.find({ targetType: 'user', targetId: user._id }).sort({ createdAt: -1 }).limit(20).populate('reporter', 'fullName username'),
      Post.find({ user: user._id, isRemoved: { $ne: true } }).sort({ createdAt: -1 }).limit(10),
      Reel.find({ author: user._id, isRemoved: { $ne: true } }).sort({ createdAt: -1 }).limit(10),
    ]);
    res.json({
      success: true,
      user: formatAdminUser(user, postsCount),
      reports: reportsAgainst,
      posts: userPosts,
      reels: userReels,
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to load user.' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') return res.status(404).json({ success: false, message: 'User not found.' });
    user.accountStatus = 'blocked';
    user.blockedAt = new Date();
    user.blockedBy = req.user._id;
    user.blockReason = req.body.reason || 'Blocked by admin';
    await user.save();
    await logAdminAction({ adminId: req.user._id, action: 'user_blocked', targetType: 'user', targetId: user._id, description: user.blockReason });
    res.json({ success: true, message: 'User blocked.', user: formatAdminUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to block user.' });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.accountStatus = 'active';
    user.blockedAt = null;
    user.blockedBy = null;
    user.blockReason = '';
    user.suspendedAt = null;
    user.suspendedBy = null;
    user.suspendReason = '';
    await user.save();
    await logAdminAction({ adminId: req.user._id, action: 'user_unblocked', targetType: 'user', targetId: user._id, description: 'User unblocked by admin' });
    res.json({ success: true, message: 'User unblocked.', user: formatAdminUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unblock user.' });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') return res.status(404).json({ success: false, message: 'User not found.' });
    user.accountStatus = 'suspended';
    user.suspendedAt = new Date();
    user.suspendedBy = req.user._id;
    user.suspendReason = req.body.reason || 'Suspended by admin';
    await user.save();
    await logAdminAction({ adminId: req.user._id, action: 'user_suspended', targetType: 'user', targetId: user._id, description: user.suspendReason });
    res.json({ success: true, message: 'User suspended.', user: formatAdminUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to suspend user.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') return res.status(404).json({ success: false, message: 'User not found.' });
    await User.findByIdAndDelete(user._id);
    await logAdminAction({ adminId: req.user._id, action: 'user_deleted', targetType: 'user', targetId: user._id, description: `Deleted user @${user.username}` });
    res.json({ success: true, message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { accountStatus: { $in: ['blocked', 'suspended'] } };
    const [users, total] = await Promise.all([
      User.find(filter).populate('blockedBy', 'fullName username').populate('suspendedBy', 'fullName username').sort({ updatedAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({
      success: true,
      ...paginatedResponse(
        users.map((u) => ({
          ...formatAdminUser(u),
          blockedBy: u.blockedBy ? { fullName: u.blockedBy.fullName, username: u.blockedBy.username } : null,
          suspendedBy: u.suspendedBy ? { fullName: u.suspendedBy.fullName, username: u.suspendedBy.username } : null,
        })),
        total,
        page,
        limit
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load blocked users.' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { isReel: { $ne: true } };
    if (req.query.removed === 'true') filter.isRemoved = true;
    else if (req.query.removed !== 'all') filter.isRemoved = { $ne: true };
    if (req.query.search) filter.content = { $regex: req.query.search.trim(), $options: 'i' };
    const [posts, total] = await Promise.all([
      Post.find(filter).populate('user', 'fullName username profileImage title').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);
    const postIds = posts.map((p) => p._id);
    const reportCounts = await Report.aggregate([
      { $match: { targetType: 'post', targetId: { $in: postIds } } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]);
    const reportMap = Object.fromEntries(reportCounts.map((r) => [r._id.toString(), r.count]));
    res.json({
      success: true,
      ...paginatedResponse(
        posts.map((p) => ({
          id: p._id.toString(),
          content: p.content,
          images: p.images,
          imageUrl: p.imageUrl,
          videoUrl: p.videoUrl,
          author: p.user ? { id: p.user._id.toString(), fullName: p.user.fullName, username: p.user.username, avatar: p.user.profileImage, title: p.user.title } : null,
          likesCount: p.likes?.length || 0,
          commentsCount: p.comments?.length || 0,
          sharesCount: p.shares?.length || 0,
          isRemoved: Boolean(p.isRemoved),
          reportsCount: reportMap[p._id.toString()] || 0,
          createdAt: p.createdAt,
        })),
        total,
        page,
        limit
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load posts.' });
  }
};

exports.removePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    post.isRemoved = true;
    post.removedAt = new Date();
    post.removedBy = req.user._id;
    post.removedReason = req.body.reason || 'Removed by admin';
    await post.save();
    await logAdminAction({ adminId: req.user._id, action: 'post_removed', targetType: 'post', targetId: post._id, description: post.removedReason });
    res.json({ success: true, message: 'Post removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove post.' });
  }
};

exports.restorePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    post.isRemoved = false;
    post.removedAt = null;
    post.removedBy = null;
    post.removedReason = '';
    await post.save();
    await logAdminAction({ adminId: req.user._id, action: 'post_restored', targetType: 'post', targetId: post._id, description: 'Post restored by admin' });
    res.json({ success: true, message: 'Post restored.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to restore post.' });
  }
};

exports.getReels = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.removed === 'true') filter.isRemoved = true;
    else if (req.query.removed !== 'all') filter.isRemoved = { $ne: true };
    if (req.query.search) filter.caption = { $regex: req.query.search.trim(), $options: 'i' };
    const [reels, total] = await Promise.all([
      Reel.find(filter).populate('author', 'fullName username profileImage title').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Reel.countDocuments(filter),
    ]);
    const reelIds = reels.map((r) => r._id);
    const reportCounts = await Report.aggregate([
      { $match: { targetType: 'reel', targetId: { $in: reelIds } } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]);
    const reportMap = Object.fromEntries(reportCounts.map((r) => [r._id.toString(), r.count]));
    res.json({
      success: true,
      ...paginatedResponse(
        reels.map((r) => ({
          id: r._id.toString(),
          caption: r.caption,
          source: r.source,
          videoUrl: r.videoUrl,
          thumbnailUrl: r.thumbnailUrl,
          author: r.author ? { id: r.author._id.toString(), fullName: r.author.fullName, username: r.author.username, avatar: r.author.profileImage, title: r.author.title } : null,
          likesCount: r.likes?.length || 0,
          commentsCount: r.comments?.length || 0,
          isDemo: Boolean(r.isDemo),
          isRemoved: Boolean(r.isRemoved),
          reportsCount: reportMap[r._id.toString()] || 0,
          createdAt: r.createdAt,
        })),
        total,
        page,
        limit
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load reels.' });
  }
};

exports.removeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found.' });
    reel.isRemoved = true;
    reel.removedAt = new Date();
    reel.removedBy = req.user._id;
    reel.removedReason = req.body.reason || 'Removed by admin';
    await reel.save();
    await logAdminAction({ adminId: req.user._id, action: 'reel_removed', targetType: 'reel', targetId: reel._id, description: reel.removedReason });
    res.json({ success: true, message: 'Reel removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove reel.' });
  }
};

exports.restoreReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found.' });
    reel.isRemoved = false;
    reel.removedAt = null;
    reel.removedBy = null;
    reel.removedReason = '';
    await reel.save();
    await logAdminAction({ adminId: req.user._id, action: 'reel_restored', targetType: 'reel', targetId: reel._id, description: 'Reel restored by admin' });
    res.json({ success: true, message: 'Reel restored.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to restore reel.' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const search = req.query.search?.trim();
    const [posts, reels] = await Promise.all([
      Post.find({ 'comments.0': { $exists: true } }).select('user content comments createdAt').populate('user', 'fullName username profileImage'),
      Reel.find({ 'comments.0': { $exists: true } }).select('author caption comments createdAt').populate('author', 'fullName username profileImage'),
    ]);
    let allComments = [];
    posts.forEach((post) => {
      (post.comments || []).forEach((c, idx) => {
        allComments.push({
          id: `${post._id}_${idx}`,
          commentId: c._id?.toString() || `${post._id}_${idx}`,
          text: c.text,
          author: { name: c.name, avatar: c.avatar, userId: c.user?.toString() },
          parentType: 'post',
          parentId: post._id.toString(),
          parentPreview: (post.content || '').slice(0, 80),
          likesCount: c.likes?.length || 0,
          createdAt: c.createdAt,
        });
      });
    });
    reels.forEach((reel) => {
      (reel.comments || []).forEach((c, idx) => {
        allComments.push({
          id: `${reel._id}_${idx}`,
          commentId: c._id?.toString() || `${reel._id}_${idx}`,
          text: c.text,
          author: { name: c.name, avatar: c.avatar, userId: c.user?.toString() },
          parentType: 'reel',
          parentId: reel._id.toString(),
          parentPreview: (reel.caption || '').slice(0, 80),
          likesCount: c.likes?.length || 0,
          createdAt: c.createdAt,
        });
      });
    });
    if (search) {
      allComments = allComments.filter((c) => c.text?.toLowerCase().includes(search.toLowerCase()));
    }
    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = allComments.length;
    const paged = allComments.slice(skip, skip + limit);
    res.json({ success: true, ...paginatedResponse(paged, total, page, limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load comments.' });
  }
};

exports.removeComment = async (req, res) => {
  try {
    const { parentType, parentId, commentId } = req.body;
    const Model = parentType === 'reel' ? Reel : Post;
    const doc = await Model.findById(parentId);
    if (!doc) return res.status(404).json({ success: false, message: 'Parent content not found.' });
    doc.comments = (doc.comments || []).filter((c) => c._id?.toString() !== commentId);
    await doc.save();
    await logAdminAction({ adminId: req.user._id, action: 'comment_removed', targetType: 'comment', targetId: commentId, description: `Removed comment from ${parentType} ${parentId}` });
    res.json({ success: true, message: 'Comment removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove comment.' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.targetType) filter.targetType = req.query.targetType;

    const search = (req.query.search || '').trim();
    if (search) {
      const searchFilters = [{ description: { $regex: search, $options: 'i' } }, { reason: { $regex: search, $options: 'i' } }];
      const cleanSearch = search.startsWith('@') ? search.slice(1) : search;
      if (mongoose.Types.ObjectId.isValid(search)) {
        const oid = new mongoose.Types.ObjectId(search);
        searchFilters.push({ _id: oid }, { targetId: oid }, { reporter: oid });
      } else if (/^[a-f0-9]{6,}$/i.test(cleanSearch)) {
        const users = await User.find({
          $or: [
            { username: { $regex: cleanSearch, $options: 'i' } },
            { fullName: { $regex: cleanSearch, $options: 'i' } },
            { email: { $regex: cleanSearch, $options: 'i' } },
          ],
        }).select('_id').limit(20);
        const userIds = users.map((u) => u._id);
        if (userIds.length) searchFilters.push({ reporter: { $in: userIds } }, { targetId: { $in: userIds } });
      }
      filter.$or = searchFilters;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'fullName username profileImage email')
        .populate('resolvedBy', 'fullName username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    const formatted = await Promise.all(reports.map((r) => formatAdminReport(r, r.reporter, false)));

    res.json({
      success: true,
      ...paginatedResponse(formatted, total, page, limit),
    });
  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to load reports.' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'fullName username profileImage email')
      .populate('resolvedBy', 'fullName username');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    const formatted = await formatAdminReport(report, report.reporter, true);
    res.json({ success: true, report: formatted });
  } catch (error) {
    console.error('Admin get report error:', error);
    res.status(500).json({ success: false, message: 'Failed to load report.' });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    const previousStatus = report.status;

    if (req.body.status) report.status = req.body.status;
    if (req.body.priority) report.priority = req.body.priority;
    if (req.body.adminNote !== undefined) report.adminNote = req.body.adminNote;
    if (['resolved', 'rejected'].includes(report.status)) {
      report.resolvedAt = new Date();
      report.resolvedBy = req.user._id;
    }
    await report.save();

    if (req.body.message?.trim()) {
      await ReportMessage.create({
        reportId: report._id,
        senderId: req.user._id,
        senderRole: 'admin',
        message: req.body.message.trim(),
        isRead: false,
      });
      await notifyUserAboutReport({
        report,
        adminUser: req.user,
        type: 'report_reply',
        text: 'Admin replied to your report.',
      }).catch(console.error);
    }

    if (req.body.status && req.body.status !== previousStatus) {
      const statusType = req.body.status === 'resolved'
        ? 'report_resolved'
        : req.body.status === 'rejected'
          ? 'report_rejected'
          : 'report_status';
      const statusText = req.body.status === 'resolved'
        ? 'Your report has been resolved.'
        : req.body.status === 'rejected'
          ? 'Your report has been reviewed.'
          : `Your report status is now ${req.body.status.replace(/_/g, ' ')}.`;
      await notifyUserAboutReport({
        report,
        adminUser: req.user,
        type: statusType,
        text: statusText,
      }).catch(console.error);
    }

    await logAdminAction({ adminId: req.user._id, action: `report_${report.status}`, targetType: 'report', targetId: report._id, description: `Admin ${report.status} report` });
    const formatted = await formatAdminReport(report, null, true);
    res.json({ success: true, message: 'Report updated.', report: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update report.' });
  }
};

exports.getAdminReportMessages = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    const messages = await ReportMessage.find({ reportId: report._id })
      .populate('senderId', 'fullName username profileImage role')
      .sort({ createdAt: 1 });

    await ReportMessage.updateMany(
      { reportId: report._id, senderRole: 'user', isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      messages: messages.map(formatReportMessage),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load report messages.' });
  }
};

exports.postAdminReportMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    const msg = await ReportMessage.create({
      reportId: report._id,
      senderId: req.user._id,
      senderRole: 'admin',
      message: message.trim(),
      isRead: false,
    });

    await notifyUserAboutReport({
      report,
      adminUser: req.user,
      type: 'report_reply',
      text: 'Admin replied to your report.',
    }).catch(console.error);

    const populated = await ReportMessage.findById(msg._id).populate('senderId', 'fullName username profileImage role');
    res.status(201).json({ success: true, message: formatReportMessage(populated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

exports.getUserModeration = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const [
      postsCount,
      reelsCount,
      reportsAgainst,
      reportsSubmitted,
      blocksInitiated,
      blocksReceived,
      restrictionsInitiated,
      restrictionsReceived,
      userPosts,
      userReels,
    ] = await Promise.all([
      Post.countDocuments({ user: user._id, isRemoved: { $ne: true } }),
      Reel.countDocuments({ author: user._id, isRemoved: { $ne: true } }),
      Report.find({ targetType: 'user', targetId: user._id }).sort({ createdAt: -1 }).limit(50).populate('reporter', 'fullName username'),
      Report.find({ reporter: user._id }).sort({ createdAt: -1 }).limit(50),
      UserBlock.find({ blocker: user._id }).populate('blocked', 'fullName username profileImage'),
      UserBlock.find({ blocked: user._id }).populate('blocker', 'fullName username profileImage'),
      UserRestrict.find({ restricter: user._id }).populate('restricted', 'fullName username profileImage'),
      UserRestrict.find({ restricted: user._id }).populate('restricter', 'fullName username profileImage'),
      Post.find({ user: user._id, isRemoved: { $ne: true } }).sort({ createdAt: -1 }).limit(10),
      Reel.find({ author: user._id, isRemoved: { $ne: true } }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      success: true,
      user: formatAdminUser(user, postsCount),
      stats: {
        postsCount,
        reelsCount,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
      },
      accountStatus: user.accountStatus || 'active',
      reportsAgainst: reportsAgainst.map((r) => ({
        id: r._id.toString(),
        reason: r.reason,
        status: r.status,
        reporter: r.reporter ? { username: r.reporter.username, fullName: r.reporter.fullName } : null,
        createdAt: r.createdAt,
      })),
      reportsSubmitted: reportsSubmitted.map((r) => ({
        id: r._id.toString(),
        targetType: r.targetType,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
      })),
      blocks: {
        blockedUsers: blocksInitiated.map((b) => ({
          id: b.blocked._id.toString(),
          fullName: b.blocked.fullName,
          username: b.blocked.username,
          avatar: b.blocked.profileImage,
          createdAt: b.createdAt,
        })),
        blockedBy: blocksReceived.map((b) => ({
          id: b.blocker._id.toString(),
          fullName: b.blocker.fullName,
          username: b.blocker.username,
          avatar: b.blocker.profileImage,
          createdAt: b.createdAt,
        })),
      },
      restrictions: {
        restrictedUsers: restrictionsInitiated.map((r) => ({
          id: r.restricted._id.toString(),
          fullName: r.restricted.fullName,
          username: r.restricted.username,
          avatar: r.restricted.profileImage,
          createdAt: r.createdAt,
        })),
        restrictedBy: restrictionsReceived.map((r) => ({
          id: r.restricter._id.toString(),
          fullName: r.restricter.fullName,
          username: r.restricter.username,
          avatar: r.restricter.profileImage,
          createdAt: r.createdAt,
        })),
      },
      posts: userPosts,
      reels: userReels,
    });
  } catch (error) {
    console.error('Admin user moderation error:', error);
    res.status(500).json({ success: false, message: 'Failed to load user moderation data.' });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).populate('user', 'fullName username profileImage email').sort({ updatedAt: -1 }).skip(skip).limit(limit),
      SupportTicket.countDocuments(filter),
    ]);
    res.json({
      success: true,
      ...paginatedResponse(
        tickets.map((t) => ({
          id: t._id.toString(),
          ticketNumber: t.ticketNumber,
          subject: t.subject,
          category: t.category,
          description: t.description,
          priority: t.priority,
          status: t.status,
          messagesCount: t.messages?.length || 0,
          user: t.user ? { id: t.user._id.toString(), fullName: t.user.fullName, username: t.user.username, email: t.user.email, avatar: t.user.profileImage } : null,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
        total,
        page,
        limit
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load support tickets.' });
  }
};

exports.getSupportTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate('user', 'fullName username profileImage email').populate('messages.sender', 'fullName username profileImage role');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load ticket.' });
  }
};

exports.updateSupportTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    if (req.body.status) ticket.status = req.body.status;
    if (req.body.priority) ticket.priority = req.body.priority;
    if (req.body.message?.trim()) {
      ticket.messages.push({
        sender: req.user._id,
        senderRole: 'admin',
        message: req.body.message.trim(),
      });
    }
    ticket.lastUpdatedBy = req.user._id;
    await ticket.save();
    await logAdminAction({ adminId: req.user._id, action: 'support_updated', targetType: 'support', targetId: ticket._id, description: `Ticket #${ticket.ticketNumber} updated to ${ticket.status}` });
    res.json({ success: true, message: 'Ticket updated.', ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update ticket.' });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [logs, total] = await Promise.all([
      AdminActivityLog.find().populate('adminId', 'fullName username').sort({ createdAt: -1 }).skip(skip).limit(limit),
      AdminActivityLog.countDocuments(),
    ]);
    res.json({
      success: true,
      ...paginatedResponse(
        logs.map((l) => ({
          id: l._id.toString(),
          admin: l.adminId ? { fullName: l.adminId.fullName, username: l.adminId.username } : null,
          action: l.action,
          targetType: l.targetType,
          targetId: l.targetId?.toString() || null,
          description: l.description,
          createdAt: l.createdAt,
        })),
        total,
        page,
        limit
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load activity logs.' });
  }
};

exports.globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const empty = { users: [], posts: [], reels: [], reports: [], tickets: [], comments: [] };
    if (!q || q.length < 2) return res.json({ success: true, results: empty });

    const cleanQ = q.startsWith('@') ? q.slice(1) : q;
    const regex = { $regex: cleanQ, $options: 'i' };
    const results = { ...empty };

    if (mongoose.Types.ObjectId.isValid(q)) {
      const oid = new mongoose.Types.ObjectId(q);
      const [userById, postById, reelById, reportById, ticketById] = await Promise.all([
        User.findById(oid).select('fullName username profileImage email accountStatus'),
        Post.findById(oid).populate('user', 'fullName username'),
        Reel.findById(oid).populate('author', 'fullName username'),
        Report.findById(oid).populate('reporter', 'fullName username'),
        SupportTicket.findById(oid),
      ]);
      if (userById && userById.role !== 'admin') results.users.push(formatAdminUser(userById));
      if (postById && !postById.isRemoved) {
        results.posts.push({ id: postById._id.toString(), content: postById.content?.slice(0, 100), author: postById.user?.username, authorId: postById.user?._id?.toString() });
      }
      if (reelById && !reelById.isRemoved) {
        results.reels.push({ id: reelById._id.toString(), caption: reelById.caption?.slice(0, 100), author: reelById.author?.username, authorId: reelById.author?._id?.toString() });
      }
      if (reportById) {
        results.reports.push({
          id: reportById._id.toString(),
          reason: reportById.reason,
          status: reportById.status,
          targetType: reportById.targetType,
          targetId: reportById.targetId?.toString(),
          reporter: reportById.reporter?.username,
        });
      }
      if (ticketById) {
        results.tickets.push({ id: ticketById._id.toString(), ticketNumber: ticketById.ticketNumber, subject: ticketById.subject, status: ticketById.status });
      }

      const commentHit = await (async () => {
        const [post, reel] = await Promise.all([
          Post.findOne({ 'comments._id': oid }).select('_id content user').populate('user', 'username'),
          Reel.findOne({ 'comments._id': oid }).select('_id caption author').populate('author', 'username'),
        ]);
        if (post) {
          const c = post.comments.find((x) => x._id?.toString() === q);
          return { id: q, text: c?.text?.slice(0, 80), parentType: 'post', parentId: post._id.toString(), author: post.user?.username };
        }
        if (reel) {
          const c = reel.comments.find((x) => x._id?.toString() === q);
          return { id: q, text: c?.text?.slice(0, 80), parentType: 'reel', parentId: reel._id.toString(), author: reel.author?.username };
        }
        return null;
      })();
      if (commentHit) results.comments.push(commentHit);
    }

    const [users, posts, reels, reports, tickets] = await Promise.all([
      User.find({ $or: [{ fullName: regex }, { username: regex }, { email: regex }], role: { $ne: 'admin' } }).limit(8).select('fullName username profileImage email accountStatus'),
      Post.find({ content: regex, isRemoved: { $ne: true } }).limit(8).populate('user', 'fullName username'),
      Reel.find({ caption: regex, isRemoved: { $ne: true } }).limit(8).populate('author', 'fullName username'),
      Report.find({ $or: [{ description: regex }, { reason: regex }] }).limit(8).populate('reporter', 'fullName username'),
      SupportTicket.find({ $or: [{ subject: regex }, { description: regex }, { ticketNumber: regex }] }).limit(8).populate('user', 'fullName username'),
    ]);

    const mergeUnique = (arr, items, key = 'id') => {
      const ids = new Set(arr.map((x) => x[key]));
      items.forEach((item) => {
        if (!ids.has(item[key])) arr.push(item);
      });
    };

    mergeUnique(results.users, users.map((u) => formatAdminUser(u)));
    mergeUnique(results.posts, posts.map((p) => ({ id: p._id.toString(), content: p.content?.slice(0, 100), author: p.user?.username, authorId: p.user?._id?.toString() })));
    mergeUnique(results.reels, reels.map((r) => ({ id: r._id.toString(), caption: r.caption?.slice(0, 100), author: r.author?.username, authorId: r.author?._id?.toString() })));
    mergeUnique(results.reports, reports.map((r) => ({
      id: r._id.toString(),
      reason: r.reason,
      status: r.status,
      targetType: r.targetType,
      targetId: r.targetId?.toString(),
      reporter: r.reporter?.username,
    })));
    mergeUnique(results.tickets, tickets.map((t) => ({ id: t._id.toString(), ticketNumber: t.ticketNumber, subject: t.subject, status: t.status })));

    res.json({ success: true, results });
  } catch (error) {
    console.error('Admin search error:', error);
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      newUsers,
      totalPosts,
      totalReels,
      postCommentsAgg,
      reelCommentsAgg,
      totalLikesPosts,
      totalLikesReels,
      openReports,
      resolvedReports,
      pendingSupport,
      closedSupport,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo() } }),
      Post.countDocuments({ isRemoved: { $ne: true }, isReel: { $ne: true } }),
      Reel.countDocuments({ isRemoved: { $ne: true } }),
      Post.aggregate([{ $project: { count: { $size: { $ifNull: ['$comments', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Reel.aggregate([{ $project: { count: { $size: { $ifNull: ['$comments', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Post.aggregate([{ $project: { count: { $size: { $ifNull: ['$likes', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Reel.aggregate([{ $project: { count: { $size: { $ifNull: ['$likes', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Report.countDocuments({ status: { $in: ['pending', 'in_review'] } }),
      Report.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress', 'waiting_for_user'] } }),
      SupportTicket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
    ]);

    const totalComments = (postCommentsAgg[0]?.total || 0) + (reelCommentsAgg[0]?.total || 0);
    const totalLikes = (totalLikesPosts[0]?.total || 0) + (totalLikesReels[0]?.total || 0);

    res.json({
      success: true,
      analytics: {
        userGrowth: { total: totalUsers, newLast7Days: newUsers },
        content: { posts: totalPosts, reels: totalReels, comments: totalComments, likes: totalLikes },
        moderation: { openReports, resolvedReports },
        support: { open: pendingSupport, closed: closedSupport },
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to load analytics.' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { recipient: req.user._id };
    if (req.query.unread === 'true') filter.isRead = false;

    const listLimit = req.query.recent === 'true' ? MAX_ACTIVE_ADMIN_NOTIFICATIONS : limit;

    const [notifications, total] = await Promise.all([
      AdminNotification.find(filter).sort({ createdAt: -1 }).skip(req.query.recent === 'true' ? 0 : skip).limit(listLimit),
      AdminNotification.countDocuments(filter),
    ]);

    res.json({
      success: true,
      ...paginatedResponse(notifications.map(formatAdminNotification), total, page, listLimit),
    });
  } catch (error) {
    console.error('Admin notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
};

exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await AdminNotification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load unread count.' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await AdminNotification.findOne({ _id: req.params.id, recipient: req.user._id });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    notification.isRead = true;
    await notification.save();
    res.json({ success: true, notification: formatAdminNotification(notification) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await AdminNotification.updateMany({ recipient: req.user._id, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json({ success: true, profile: formatAdminProfile(req.user) });
  } catch (error) {
    console.error('Admin get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to load admin profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      fullName,
      username,
      email,
      role,
      bio,
      avatar,
      profileImage,
      profileImagePublicId,
      coverImage,
      coverImagePublicId,
      title,
      location,
      phone,
    } = req.body;

    if (email !== undefined && email.trim().toLowerCase() !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Admin email is managed by server configuration and cannot be changed here.',
      });
    }

    if (role !== undefined && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin role cannot be changed.',
      });
    }

    const updateData = { role: 'admin' };

    if (name || fullName) updateData.fullName = (name || fullName).trim();

    if (username) {
      const cleanUsername = username.replace('@', '').trim().toLowerCase();
      if (cleanUsername !== req.user.username) {
        const existingUsername = await User.findOne({ username: cleanUsername, _id: { $ne: req.user._id } });
        if (existingUsername) {
          return res.status(409).json({ success: false, message: 'This username is already taken.' });
        }
        updateData.username = cleanUsername;
      }
    }

    if (bio !== undefined) updateData.bio = bio;
    if (title !== undefined) updateData.title = title;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phone = phone.trim();

    const newProfileImg = avatar || profileImage;
    if (newProfileImg) {
      updateData.profileImage = newProfileImg;
      if (profileImagePublicId) {
        if (req.user.profileImagePublicId && req.user.profileImagePublicId !== profileImagePublicId) {
          deleteFromCloudinary(req.user.profileImagePublicId, 'image').catch(() => {});
        }
        updateData.profileImagePublicId = profileImagePublicId;
      }
    }

    if (coverImage) {
      updateData.coverImage = coverImage;
      if (coverImagePublicId) {
        if (req.user.coverImagePublicId && req.user.coverImagePublicId !== coverImagePublicId) {
          deleteFromCloudinary(req.user.coverImagePublicId, 'image').catch(() => {});
        }
        updateData.coverImagePublicId = coverImagePublicId;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { returnDocument: 'after', runValidators: true });
    await logAdminAction({
      adminId: req.user._id,
      action: 'admin_profile_updated',
      targetType: 'user',
      targetId: req.user._id,
      description: 'Admin updated their profile',
    });

    res.json({
      success: true,
      message: 'Admin profile updated successfully.',
      profile: formatAdminProfile(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This username is already taken.' });
    }
    console.error('Admin update profile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update admin profile.' });
  }
};
