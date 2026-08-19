const User = require('../models/User');
const UserBlock = require('../models/UserBlock');
const UserRestrict = require('../models/UserRestrict');
const {
  formatModerationUser,
  resolveUserId,
  hasBlock,
  getBlockStatusBetween,
} = require('../utils/moderation');
const { unfollowPair } = require('../services/followService');

const loadTargetUser = async (userId) => {
  const targetId = await resolveUserId(userId);
  if (!targetId) return null;
  return User.findById(targetId);
};

exports.blockUser = async (req, res) => {
  try {
    const targetUser = await loadTargetUser(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself.' });
    }
    if (targetUser.role === 'admin') {
      return res.status(403).json({ success: false, message: 'This user cannot be blocked.' });
    }

    const existing = await UserBlock.findOne({ blocker: req.user._id, blocked: targetUser._id });
    if (!existing) {
      await UserBlock.create({ blocker: req.user._id, blocked: targetUser._id });
    }

    await unfollowPair(req.user._id, targetUser._id).catch(() => {});
    await unfollowPair(targetUser._id, req.user._id).catch(() => {});

    await UserRestrict.deleteMany({
      $or: [
        { restricter: req.user._id, restricted: targetUser._id },
        { restricter: targetUser._id, restricted: req.user._id },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'User blocked.',
      user: formatModerationUser(targetUser),
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ success: false, message: 'Failed to block user.' });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const targetUser = await loadTargetUser(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await UserBlock.deleteOne({ blocker: req.user._id, blocked: targetUser._id });

    res.status(200).json({
      success: true,
      message: 'User unblocked.',
      user: formatModerationUser(targetUser),
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ success: false, message: 'Failed to unblock user.' });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const blocks = await UserBlock.find({ blocker: req.user._id })
      .populate('blocked', 'fullName username profileImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: blocks.map((block) => ({
        ...formatModerationUser(block.blocked),
        blockedAt: block.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ success: false, message: 'Failed to load blocked users.' });
  }
};

exports.restrictUser = async (req, res) => {
  try {
    const targetUser = await loadTargetUser(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot restrict yourself.' });
    }

    const blocked = await hasBlock(req.user._id, targetUser._id);
    if (blocked) {
      return res.status(400).json({ success: false, message: 'Unblock this user before restricting them.' });
    }

    const existing = await UserRestrict.findOne({ restricter: req.user._id, restricted: targetUser._id });
    if (!existing) {
      await UserRestrict.create({ restricter: req.user._id, restricted: targetUser._id });
    }

    res.status(200).json({
      success: true,
      message: 'User restricted.',
      user: formatModerationUser(targetUser),
    });
  } catch (error) {
    console.error('Restrict user error:', error);
    res.status(500).json({ success: false, message: 'Failed to restrict user.' });
  }
};

exports.unrestrictUser = async (req, res) => {
  try {
    const targetUser = await loadTargetUser(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await UserRestrict.deleteOne({ restricter: req.user._id, restricted: targetUser._id });

    res.status(200).json({
      success: true,
      message: 'User unrestricted.',
      user: formatModerationUser(targetUser),
    });
  } catch (error) {
    console.error('Unrestrict user error:', error);
    res.status(500).json({ success: false, message: 'Failed to unrestrict user.' });
  }
};

exports.getRestrictedUsers = async (req, res) => {
  try {
    const restrictions = await UserRestrict.find({ restricter: req.user._id })
      .populate('restricted', 'fullName username profileImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: restrictions.map((row) => ({
        ...formatModerationUser(row.restricted),
        restrictedAt: row.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get restricted users error:', error);
    res.status(500).json({ success: false, message: 'Failed to load restricted users.' });
  }
};

exports.getRelationshipStatus = async (req, res) => {
  try {
    const targetUser = await loadTargetUser(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const blockStatus = await getBlockStatusBetween(req.user._id, targetUser._id);
    const isRestrictedByMe = Boolean(
      await UserRestrict.exists({ restricter: req.user._id, restricted: targetUser._id })
    );

    res.json({
      success: true,
      ...blockStatus,
      isRestrictedByMe,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load relationship status.' });
  }
};
