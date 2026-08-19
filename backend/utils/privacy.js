const User = require('../models/User');

const DEFAULT_PRIVACY = {
  whoCanFollow: 'everyone',
  whoCanComment: 'everyone',
  whoCanMessage: 'everyone',
  whoCanMention: 'everyone',
  hideLikedPosts: false,
};

const PRIVACY_ENUMS = {
  whoCanFollow: ['everyone', 'approved', 'nobody'],
  whoCanComment: ['everyone', 'following', 'followers', 'nobody'],
  whoCanMessage: ['everyone', 'following', 'nobody'],
  whoCanMention: ['everyone', 'following', 'nobody'],
};

const getPrivacySettings = (user) => {
  const p = user?.privacy || {};
  return {
    whoCanFollow: p.whoCanFollow || DEFAULT_PRIVACY.whoCanFollow,
    whoCanComment: p.whoCanComment || DEFAULT_PRIVACY.whoCanComment,
    whoCanMessage: p.whoCanMessage || DEFAULT_PRIVACY.whoCanMessage,
    whoCanMention: p.whoCanMention || DEFAULT_PRIVACY.whoCanMention,
    hideLikedPosts: Boolean(p.hideLikedPosts),
  };
};

const toClientPrivacy = (user) => {
  const p = getPrivacySettings(user);
  return {
    isPrivateAccount: Boolean(user.isPrivate),
    whoCanFollow: p.whoCanFollow,
    whoCanComment: p.whoCanComment,
    whoCanMessage: p.whoCanMessage,
    whoCanTag: p.whoCanMention,
    hideLikedPosts: p.hideLikedPosts,
  };
};

const fromClientPrivacy = (body) => {
  const updates = {};
  if (body.isPrivateAccount !== undefined) updates.isPrivate = Boolean(body.isPrivateAccount);
  if (body.isPrivate !== undefined) updates.isPrivate = Boolean(body.isPrivate);

  const privacy = {};
  if (body.whoCanFollow !== undefined) {
    if (!PRIVACY_ENUMS.whoCanFollow.includes(body.whoCanFollow)) {
      throw new Error('Invalid whoCanFollow value.');
    }
    privacy.whoCanFollow = body.whoCanFollow;
  }
  if (body.whoCanComment !== undefined) {
    if (!PRIVACY_ENUMS.whoCanComment.includes(body.whoCanComment)) {
      throw new Error('Invalid whoCanComment value.');
    }
    privacy.whoCanComment = body.whoCanComment;
  }
  if (body.whoCanMessage !== undefined) {
    if (!PRIVACY_ENUMS.whoCanMessage.includes(body.whoCanMessage)) {
      throw new Error('Invalid whoCanMessage value.');
    }
    privacy.whoCanMessage = body.whoCanMessage;
  }
  const mentionVal = body.whoCanMention ?? body.whoCanTag;
  if (mentionVal !== undefined) {
    if (!PRIVACY_ENUMS.whoCanMention.includes(mentionVal)) {
      throw new Error('Invalid whoCanMention value.');
    }
    privacy.whoCanMention = mentionVal;
  }
  if (body.hideLikedPosts !== undefined) {
    privacy.hideLikedPosts = Boolean(body.hideLikedPosts);
  }

  if (Object.keys(privacy).length) updates.privacy = privacy;
  return updates;
};

const isFollowing = (userDoc, otherUserId) =>
  (userDoc?.following || []).some((id) => id.toString() === otherUserId.toString());

const isFollower = (userDoc, otherUserId) =>
  (userDoc?.followers || []).some((id) => id.toString() === otherUserId.toString());

const canFollowUser = (targetUser) => {
  const privacy = getPrivacySettings(targetUser);
  return privacy.whoCanFollow !== 'nobody';
};

const requiresFollowApproval = (targetUser) => {
  if (!targetUser) return false;
  const privacy = getPrivacySettings(targetUser);
  return Boolean(targetUser.isPrivate) || privacy.whoCanFollow === 'approved';
};

const canCommentOnUser = (ownerDoc, commenterId) => {
  const privacy = getPrivacySettings(ownerDoc);
  const ownerId = ownerDoc._id.toString();
  const commenterIdStr = commenterId.toString();

  if (ownerId === commenterIdStr) return true;
  if (privacy.whoCanComment === 'nobody') return false;
  if (privacy.whoCanComment === 'everyone') return true;
  if (privacy.whoCanComment === 'following') return isFollowing(ownerDoc, commenterId);
  if (privacy.whoCanComment === 'followers') return isFollower(ownerDoc, commenterId);
  return false;
};

const canMessageUser = (recipientDoc, senderId, hasExistingConversation) => {
  const privacy = getPrivacySettings(recipientDoc);
  const recipientId = recipientDoc._id.toString();
  const senderIdStr = senderId.toString();

  if (recipientId === senderIdStr) return true;
  if (hasExistingConversation) return true;
  if (privacy.whoCanMessage === 'nobody') return false;
  if (privacy.whoCanMessage === 'everyone') return true;
  if (privacy.whoCanMessage === 'following') return isFollowing(recipientDoc, senderId);
  return false;
};

const canMentionUser = (targetDoc, mentionerId) => {
  const privacy = getPrivacySettings(targetDoc);
  const targetId = targetDoc._id.toString();
  const mentionerIdStr = mentionerId.toString();

  if (targetId === mentionerIdStr) return true;
  if (privacy.whoCanMention === 'nobody') return false;
  if (privacy.whoCanMention === 'everyone') return true;
  if (privacy.whoCanMention === 'following') return isFollowing(targetDoc, mentionerId);
  return false;
};

const extractMentions = (text) => {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/@([a-z0-9_]{3,30})/gi) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
};

const validateMentions = async (text, mentionerId) => {
  const usernames = extractMentions(text);
  if (!usernames.length) return { ok: true };

  const users = await User.find({ username: { $in: usernames } }).select('username privacy following');
  const userMap = new Map(users.map((u) => [u.username, u]));
  const { areUsersBlocked } = require('./moderation');

  for (const username of usernames) {
    const target = userMap.get(username);
    if (!target) continue;
    if (await areUsersBlocked(mentionerId, target._id)) {
      return {
        ok: false,
        message: `@${username} cannot be mentioned due to block settings.`,
      };
    }
    if (!canMentionUser(target, mentionerId)) {
      return {
        ok: false,
        message: `@${username} does not allow mentions from you.`,
      };
    }
  }

  return { ok: true };
};

const shouldHideLikedActivity = (profileUser, viewerId) => {
  const privacy = getPrivacySettings(profileUser);
  if (!privacy.hideLikedPosts) return false;
  if (!viewerId) return true;
  if (profileUser._id.toString() === viewerId.toString()) return false;
  return true;
};

module.exports = {
  DEFAULT_PRIVACY,
  PRIVACY_ENUMS,
  getPrivacySettings,
  toClientPrivacy,
  fromClientPrivacy,
  canFollowUser,
  requiresFollowApproval,
  canCommentOnUser,
  canMessageUser,
  canMentionUser,
  extractMentions,
  validateMentions,
  shouldHideLikedActivity,
  isFollowing,
  isFollower,
};
