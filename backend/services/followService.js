const User = require('../models/User');
const FollowRequest = require('../models/FollowRequest');
const { canFollowUser, requiresFollowApproval } = require('../utils/privacy');
const { assertNotBlocked } = require('../utils/moderation');
const { createNotification } = require('../controllers/notificationsController');

const mongoose = require('mongoose');

const resolveUser = async (idOrUsername) => {
  if (!idOrUsername) return null;
  if (mongoose.Types.ObjectId.isValid(idOrUsername)) {
    const user = await User.findById(idOrUsername);
    if (user) return user;
  }
  const cleanUsername = String(idOrUsername).replace('@', '').toLowerCase();
  return User.findOne({ username: cleanUsername });
};

const followPair = async (followerId, targetId) => {
  const follower = await resolveUser(followerId);
  const target = await resolveUser(targetId);
  if (!follower || !target) throw Object.assign(new Error('User not found.'), { status: 404 });

  const wasAlreadyFollowing = follower.following.some((id) => id.toString() === target._id.toString());

  if (!wasAlreadyFollowing) {
    follower.following.push(target._id);
    target.followers.push(follower._id);
    await follower.save();
    await target.save();

    await createNotification({
      recipient: target._id,
      sender: follower._id,
      type: 'follow',
      text: 'started following you',
    });
  }

  await FollowRequest.deleteMany({
    requester: follower._id,
    recipient: target._id,
  });

  return {
    isFollowing: true,
    followRequestPending: false,
    followersCount: target.followers.length,
    followingCount: follower.following.length,
  };
};

const unfollowPair = async (followerId, targetId) => {
  const follower = await resolveUser(followerId);
  const target = await resolveUser(targetId);
  if (!follower || !target) throw Object.assign(new Error('User not found.'), { status: 404 });

  follower.following.pull(target._id);
  target.followers.pull(follower._id);
  await follower.save();
  await target.save();

  await FollowRequest.deleteMany({
    requester: follower._id,
    recipient: target._id,
    status: 'pending',
  });

  return {
    isFollowing: false,
    followRequestPending: false,
    followersCount: target.followers.length,
    followingCount: follower.following.length,
  };
};

exports.handleFollowToggle = async (currentUserId, targetUserId) => {
  const currentUser = await resolveUser(currentUserId);
  const targetUser = await resolveUser(targetUserId);

  if (!currentUser || !targetUser) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  const currentId = currentUser._id;
  const targetId = targetUser._id;

  if (currentId.toString() === targetId.toString()) {
    throw Object.assign(new Error('You cannot follow yourself.'), { status: 400 });
  }

  await assertNotBlocked(currentId, targetId, 'You cannot follow this user.');

  const alreadyFollowing = currentUser.following.some(
    (id) => id.toString() === targetId.toString()
  );

  if (alreadyFollowing) {
    return unfollowPair(currentId, targetId);
  }

  if (!canFollowUser(targetUser)) {
    throw Object.assign(new Error('This user is not accepting followers.'), { status: 403 });
  }

  const pending = await FollowRequest.findOne({
    requester: currentId,
    recipient: targetId,
    status: 'pending',
  });

  if (pending) {
    await FollowRequest.findByIdAndDelete(pending._id);
    return {
      isFollowing: false,
      followRequestPending: false,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
      message: 'Follow request cancelled.',
    };
  }

  if (requiresFollowApproval(targetUser)) {
    const existing = await FollowRequest.findOne({
      requester: currentId,
      recipient: targetId,
    });

    if (existing) {
      existing.status = 'pending';
      existing.createdAt = new Date();
      await existing.save();
    } else {
      await FollowRequest.create({
        requester: currentId,
        recipient: targetId,
        status: 'pending',
      });
    }

    await createNotification({
      recipient: targetId,
      sender: currentId,
      type: 'follow_request',
      text: 'sent you a follow request',
    });

    return {
      isFollowing: false,
      followRequestPending: true,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
      message: 'Follow request sent.',
    };
  }

  return followPair(currentId, targetId);
};

exports.getFollowStatus = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId) {
    return { isFollowing: false, followRequestPending: false, followDisabled: false };
  }

  const currentUser = await resolveUser(currentUserId);
  const targetUser = await resolveUser(targetUserId);

  if (!currentUser || !targetUser) {
    return { isFollowing: false, followRequestPending: false, followDisabled: false };
  }

  const isFollowing = currentUser.following.some(
    (id) => id.toString() === targetUser._id.toString()
  );

  const pending = await FollowRequest.findOne({
    requester: currentUser._id,
    recipient: targetUser._id,
    status: 'pending',
  });

  return {
    isFollowing,
    followRequestPending: Boolean(pending),
    followDisabled: !canFollowUser(targetUser) && !isFollowing && !pending,
  };
};

exports.followPair = followPair;
exports.unfollowPair = unfollowPair;
