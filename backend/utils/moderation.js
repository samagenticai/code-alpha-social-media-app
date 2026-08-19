const mongoose = require('mongoose');
const UserBlock = require('../models/UserBlock');
const UserRestrict = require('../models/UserRestrict');
const User = require('../models/User');

const formatModerationUser = (user) => {
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.fullName || user.username,
    username: user.username,
    avatar: user.profileImage || '',
    handle: `@${user.username}`,
  };
};

const resolveUserId = async (idOrUsername) => {
  if (!idOrUsername) return null;
  if (mongoose.Types.ObjectId.isValid(idOrUsername)) {
    const user = await User.findById(idOrUsername).select('_id');
    if (user) return user._id;
  }
  const cleanUsername = String(idOrUsername).replace('@', '').toLowerCase();
  const user = await User.findOne({ username: cleanUsername }).select('_id');
  return user?._id || null;
};

const hasBlock = async (blockerId, blockedId) => {
  if (!blockerId || !blockedId) return false;
  return Boolean(await UserBlock.exists({ blocker: blockerId, blocked: blockedId }));
};

const areUsersBlocked = async (userIdA, userIdB) => {
  if (!userIdA || !userIdB) return false;
  if (userIdA.toString() === userIdB.toString()) return false;
  return Boolean(
    await UserBlock.findOne({
      $or: [
        { blocker: userIdA, blocked: userIdB },
        { blocker: userIdB, blocked: userIdA },
      ],
    })
  );
};

const isRestrictedBy = async (restricterId, restrictedId) => {
  if (!restricterId || !restrictedId) return false;
  return Boolean(await UserRestrict.exists({ restricter: restricterId, restricted: restrictedId }));
};

const getBlockedUserIds = async (userId) => {
  if (!userId) return new Set();
  const blocks = await UserBlock.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  }).select('blocker blocked');
  const ids = new Set();
  blocks.forEach((b) => {
    if (b.blocker.toString() === userId.toString()) ids.add(b.blocked.toString());
    else ids.add(b.blocker.toString());
  });
  return ids;
};

const getUsersBlockedBy = async (blockerId) => {
  if (!blockerId) return new Set();
  const blocks = await UserBlock.find({ blocker: blockerId }).select('blocked');
  return new Set(blocks.map((b) => b.blocked.toString()));
};

const getRestrictedIdsByOwner = async (ownerId) => {
  if (!ownerId) return new Set();
  const rows = await UserRestrict.find({ restricter: ownerId }).select('restricted');
  return new Set(rows.map((r) => r.restricted.toString()));
};

const getRestrictedMapForOwners = async (ownerIds) => {
  const map = new Map();
  if (!ownerIds?.length) return map;
  const uniqueIds = [...new Set(ownerIds.map((id) => id.toString()))];
  const rows = await UserRestrict.find({ restricter: { $in: uniqueIds } }).select('restricter restricted');
  rows.forEach((row) => {
    const key = row.restricter.toString();
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(row.restricted.toString());
  });
  return map;
};

const filterCommentsForViewer = (comments, viewerId, restrictedIds) => {
  if (!restrictedIds?.size || !Array.isArray(comments)) return comments;
  const viewerStr = viewerId?.toString();
  return comments.filter((comment) => {
    const commentUserId = comment.user?._id?.toString() || comment.user?.toString();
    if (!commentUserId) return true;
    if (commentUserId === viewerStr) return true;
    return !restrictedIds.has(commentUserId);
  });
};

const assertNotBlocked = async (actorId, targetId, message = 'This action is not allowed due to a block.') => {
  if (await areUsersBlocked(actorId, targetId)) {
    const err = new Error(message);
    err.status = 403;
    throw err;
  }
};

const getBlockStatusBetween = async (viewerId, profileUserId) => {
  if (!viewerId || !profileUserId || viewerId.toString() === profileUserId.toString()) {
    return { isBlockedByMe: false, isBlockedByThem: false, isBlocked: false };
  }
  const [blockedByMe, blockedByThem] = await Promise.all([
    hasBlock(viewerId, profileUserId),
    hasBlock(profileUserId, viewerId),
  ]);
  return {
    isBlockedByMe: blockedByMe,
    isBlockedByThem: blockedByThem,
    isBlocked: blockedByMe || blockedByThem,
  };
};

module.exports = {
  formatModerationUser,
  resolveUserId,
  hasBlock,
  areUsersBlocked,
  isRestrictedBy,
  getBlockedUserIds,
  getUsersBlockedBy,
  getRestrictedIdsByOwner,
  getRestrictedMapForOwners,
  filterCommentsForViewer,
  assertNotBlocked,
  getBlockStatusBetween,
};
