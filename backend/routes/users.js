const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const { formatReel } = require('../utils/reelFormatter');
const Story = require('../models/Story');
const Message = require('../models/Message');
const { protect, optionalAuth } = require('../middleware/auth');
const { deleteFromCloudinary } = require('../services/cloudinaryService');
const { formatPost, formatUserSnippet, formatTimeAgo } = require('../utils/postFormatter');

const resolveUserId = async (idOrUsername) => {
  if (!idOrUsername) return null;
  if (mongoose.Types.ObjectId.isValid(idOrUsername)) {
    return idOrUsername;
  }
  const cleanUsername = String(idOrUsername).replace('usr_', '').replace('@', '').toLowerCase();
  let user = await User.findOne({
    $or: [{ username: cleanUsername }, { username: idOrUsername }],
  });
  if (!user) {
    user = await User.create({
      fullName: cleanUsername.toUpperCase(),
      username: cleanUsername,
      email: `${cleanUsername}_${Date.now()}@nexora.app`,
      password: 'UserCreatorSecret123!',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    });
  }
  return user._id;
};

const getTotalLikesForUser = async (userId) => {
  const posts = await Post.find({ user: userId }).select('likes');
  return posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
};

const mapUsersWithFollowStatus = async (users, currentUserId) => {
  let currentFollowing = [];
  if (currentUserId) {
    const currentUser = await User.findById(currentUserId).select('following');
    currentFollowing = (currentUser?.following || []).map((id) => id.toString());
  }

  return users.map((u) => ({
    ...formatUserSnippet(u),
    isFollowing: currentFollowing.includes(u._id.toString()),
  }));
};

const enrichUserProfile = async (user, currentUserId) => {
  const publicJson = user.toPublicJSON();
  const postsCount = await Post.countDocuments({ user: user._id, isReel: { $ne: true } });
  const totalLikes = await getTotalLikesForUser(user._id);

  let isFollowing = false;
  let followRequestPending = false;
  let followDisabled = false;
  let isBlockedByMe = false;
  let isBlockedByThem = false;
  let isRestrictedByMe = false;
  let profileUnavailable = false;

  if (currentUserId && user._id.toString() !== currentUserId.toString()) {
    const { getFollowStatus } = require('../services/followService');
    const status = await getFollowStatus(currentUserId, user._id);
    isFollowing = status.isFollowing;
    followRequestPending = status.followRequestPending;
    followDisabled = status.followDisabled;

    const blockStatus = await getBlockStatusBetween(currentUserId, user._id);
    isBlockedByMe = blockStatus.isBlockedByMe;
    isBlockedByThem = blockStatus.isBlockedByThem;
    profileUnavailable = blockStatus.isBlockedByThem;

    const UserRestrict = require('../models/UserRestrict');
    isRestrictedByMe = Boolean(
      await UserRestrict.exists({ restricter: currentUserId, restricted: user._id })
    );

    if (blockStatus.isBlocked) {
      followDisabled = true;
    }
  }

  return {
    ...publicJson,
    isPrivate: Boolean(user.isPrivate),
    postsCount,
    totalLikes,
    followers: user.followers?.length ?? publicJson.followers,
    followersCount: user.followers?.length ?? publicJson.followersCount,
    following: user.following?.length ?? publicJson.following,
    followingCount: user.following?.length ?? publicJson.followingCount,
    isFollowing,
    followRequestPending,
    followDisabled,
    isBlockedByMe,
    isBlockedByThem,
    isRestrictedByMe,
    profileUnavailable,
  };
};

// GET /api/users/stories - Get active non-expired stories explicitly created by users
router.get('/stories', optionalAuth, async (req, res) => {
  try {
    const now = new Date();
    let followingIds = [];
    let currentUserIdStr = req.user ? req.user._id.toString() : '';

    if (req.user) {
      const currentUserDoc = await User.findById(req.user._id).select('following');
      followingIds = (currentUserDoc?.following || []).map((id) => id.toString());
    }

    const activeStories = await Story.find({ expiresAt: { $gt: now } })
      .populate('user', 'fullName username profileImage verified')
      .sort({ createdAt: 1 });

    const groupedMap = new Map();

    activeStories.forEach((story) => {
      if (!story.user) return;
      const userId = story.user._id.toString();
      const isSelf = currentUserIdStr ? currentUserIdStr === userId : false;
      const isFollowing = followingIds.includes(userId);

      if (!groupedMap.has(userId)) {
        groupedMap.set(userId, {
          id: `user_st_${userId}`,
          userId: userId,
          isSelf,
          isFollowing: isSelf ? false : isFollowing,
          user: {
            id: userId,
            name: story.user.fullName || story.user.username,
            fullName: story.user.fullName || story.user.username,
            username: story.user.username,
            handle: `@${story.user.username}`,
            avatar: story.user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            profileImage: story.user.profileImage || '',
            verified: story.user.verified || false,
          },
          media: story.media,
          type: story.mediaType || 'image',
          bgGradient: story.bgGradient || '',
          hasUnseen: true,
          items: [],
        });
      }

      const userGroup = groupedMap.get(userId);
      const isLiked = req.user ? story.likes?.includes(req.user._id) : false;

      userGroup.items.push({
        id: story._id.toString(),
        type: story.mediaType || 'image',
        url: story.media,
        caption: story.caption || '',
        bgGradient: story.bgGradient || '',
        timestamp: formatTimeAgo(story.createdAt),
        likesCount: story.likes ? story.likes.length : 0,
        viewsCount: story.views ? story.views.length : 0,
        isLiked,
      });

      userGroup.media = story.media;
      userGroup.type = story.mediaType || 'image';
      if (story.bgGradient) userGroup.bgGradient = story.bgGradient;
    });

    const allGroups = Array.from(groupedMap.values());
    let filteredStories = allGroups;

    if (req.user && followingIds.length > 0) {
      const followedOrSelf = allGroups.filter((g) => g.isSelf || g.isFollowing || followingIds.includes(g.userId));
      if (followedOrSelf.length > 0) {
        filteredStories = followedOrSelf;
      }
    }

    res.json({ success: true, stories: filteredStories });
  } catch (error) {
    console.error('Failed to fetch stories:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stories.' });
  }
});

// POST /api/users/stories - Create new story (Saves directly to MongoDB)
router.post('/stories', optionalAuth, async (req, res) => {
  try {
    const { media, mediaType, caption, bgGradient } = req.body;
    const finalMedia = media || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

    let storyUserId = req.user ? req.user._id : null;

    if (!storyUserId) {
      let guestUser = await User.findOne({ username: 'guest_creator' });
      if (!guestUser) {
        guestUser = await User.create({
          fullName: 'Guest Creator',
          username: 'guest_creator',
          email: 'guestcreator@nexora.app',
          password: 'GuestUserSecret123!',
          profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          title: 'Guest Creator',
        });
      }
      storyUserId = guestUser._id;
    }

    const newStory = await Story.create({
      user: storyUserId,
      media: finalMedia,
      mediaType: mediaType || 'image',
      caption: caption || '',
      bgGradient: bgGradient || '',
    });

    const populatedStory = await Story.findById(newStory._id).populate(
      'user',
      'fullName username profileImage verified'
    );

    const formattedStoryItem = {
      id: populatedStory._id.toString(),
      type: populatedStory.mediaType,
      url: populatedStory.media,
      caption: populatedStory.caption,
      bgGradient: populatedStory.bgGradient,
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
    };

    const formattedGroup = {
      id: `user_st_${populatedStory.user._id.toString()}`,
      userId: populatedStory.user._id.toString(),
      isSelf: true,
      isFollowing: false,
      user: {
        id: populatedStory.user._id.toString(),
        name: populatedStory.user.fullName || populatedStory.user.username,
        handle: `@${populatedStory.user.username}`,
        avatar: populatedStory.user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        verified: populatedStory.user.verified || false,
      },
      media: populatedStory.media,
      type: populatedStory.mediaType,
      bgGradient: populatedStory.bgGradient,
      hasUnseen: true,
      items: [formattedStoryItem],
    };

    return res.status(201).json({
      success: true,
      message: 'Story published successfully!',
      story: formattedGroup,
      storyItem: formattedStoryItem,
    });
  } catch (error) {
    console.error('Failed to create story:', error);
    return res.status(500).json({ success: false, message: 'Server error creating story.' });
  }
});

// GET /api/users/conversations - Get list of active conversations
router.get('/conversations', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.json({ success: true, conversations: [] });
    const currentUserId = req.user._id;

    const rawMessages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'fullName username profileImage title verified')
      .populate('receiver', 'fullName username profileImage title verified');

    const conversationMap = new Map();

    rawMessages.forEach((msg) => {
      if (!msg.sender || !msg.receiver) return;

      const isSenderMe = msg.sender._id.toString() === currentUserId.toString();
      const partner = isSenderMe ? msg.receiver : msg.sender;
      const partnerId = partner._id.toString();

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          user: formatUserSnippet(partner),
          lastMessage: {
            id: msg._id.toString(),
            text: msg.text || (msg.storyRef?.media ? 'Replied to a story' : 'Sent media'),
            senderId: msg.sender._id.toString(),
            createdAt: msg.createdAt,
            read: msg.read,
          },
          unreadCount: 0,
        });
      }

      if (!isSenderMe && !msg.read) {
        const entry = conversationMap.get(partnerId);
        entry.unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationMap.values());
    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Failed to get conversations:', error);
    res.status(500).json({ success: false, message: 'Server error fetching conversations.' });
  }
});

// GET /api/users/messages/:userId - Get chat history with user
router.get('/messages/:userId', optionalAuth, async (req, res) => {
  try {
    let currentUserId = req.user ? req.user._id : null;
    if (!currentUserId) {
      let guestUser = await User.findOne({ username: 'guest_creator' });
      if (!guestUser) {
        guestUser = await User.create({
          fullName: 'Guest Creator',
          username: 'guest_creator',
          email: 'guestcreator@nexora.app',
          password: 'GuestUserSecret123!',
          profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        });
      }
      currentUserId = guestUser._id;
    }

    const targetUserId = await resolveUserId(req.params.userId);
    if (!targetUserId) {
      return res.json({ success: true, messages: [] });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'fullName username profileImage')
      .populate('receiver', 'fullName username profileImage');

    await Message.updateMany(
      { sender: targetUserId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );

    const formattedMessages = messages.map((m) => ({
      id: m._id.toString(),
      _id: m._id.toString(),
      senderId: m.sender._id.toString(),
      receiverId: m.receiver._id.toString(),
      text: m.text,
      storyRef: m.storyRef || null,
      read: m.read,
      createdAt: m.createdAt,
      isSelf: m.sender._id.toString() === currentUserId.toString(),
    }));

    res.json({ success: true, messages: formattedMessages });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    res.status(500).json({ success: false, message: 'Server error fetching chat history.' });
  }
});

// POST /api/users/messages - Send message or story reply
router.post('/messages', optionalAuth, async (req, res) => {
  try {
    let senderId = req.user ? req.user._id : null;
    if (!senderId) {
      let guestUser = await User.findOne({ username: 'guest_creator' });
      if (!guestUser) {
        guestUser = await User.create({
          fullName: 'Guest Creator',
          username: 'guest_creator',
          email: 'guestcreator@nexora.app',
          password: 'GuestUserSecret123!',
          profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          title: 'Guest Creator',
        });
      }
      senderId = guestUser._id;
    }

    const { receiverId, text, storyRef } = req.body;
    const targetUserId = await resolveUserId(receiverId);

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Receiver user not found.' });
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: targetUserId,
      text: text || '',
      storyRef: storyRef || undefined,
    });

    const populated = await Message.findById(newMessage._id)
      .populate('sender', 'fullName username profileImage')
      .populate('receiver', 'fullName username profileImage');

    const formatted = {
      id: populated._id.toString(),
      _id: populated._id.toString(),
      senderId: populated.sender._id.toString(),
      receiverId: populated.receiver._id.toString(),
      text: populated.text,
      storyRef: populated.storyRef || null,
      read: populated.read,
      createdAt: populated.createdAt,
      isSelf: true,
    };

    res.status(201).json({ success: true, message: formatted });
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ success: false, message: 'Server error sending message.' });
  }
});

// GET /api/users/suggested
router.get('/suggested', optionalAuth, async (req, res) => {
  try {
    const filter = req.user ? { _id: { $ne: req.user._id } } : {};
    const users = await User.find(filter)
      .limit(6)
      .select('fullName username profileImage title job city location bio followers isPrivate');

    const mapped = await mapUsersWithFollowStatus(users, req.user?._id);
    res.json({
      success: true,
      users: mapped,
      data: mapped,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/users/search
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.json({ success: true, users: [] });
    }

    const regex = new RegExp(query.trim(), 'i');
    const users = await User.find({
      $or: [{ fullName: regex }, { username: regex }],
    })
      .limit(20)
      .select('fullName username profileImage title bio followers');

    const mapped = await mapUsersWithFollowStatus(users, req.user?._id);
    return res.json({ success: true, users: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

const moderationController = require('../controllers/moderationController');
const {
  areUsersBlocked,
  getBlockStatusBetween,
  getRestrictedMapForOwners,
  filterCommentsForViewer,
  getBlockedUserIds,
} = require('../utils/moderation');

// GET /api/users/blocked
router.get('/blocked', protect, moderationController.getBlockedUsers);

// GET /api/users/restricted
router.get('/restricted', protect, moderationController.getRestrictedUsers);

// POST /api/users/:userId/block
router.post('/:userId/block', protect, moderationController.blockUser);

// DELETE /api/users/:userId/block
router.delete('/:userId/block', protect, moderationController.unblockUser);

// POST /api/users/:userId/restrict
router.post('/:userId/restrict', protect, moderationController.restrictUser);

// DELETE /api/users/:userId/restrict
router.delete('/:userId/restrict', protect, moderationController.unrestrictUser);

// POST /api/users/follow/:id
router.post('/follow/:id', protect, async (req, res) => {
  try {
    const { handleFollowToggle } = require('../services/followService');
    const result = await handleFollowToggle(req.user._id, req.params.id);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update follow status.',
    });
  }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const {
      name,
      fullName,
      username,
      email,
      phone,
      currentPassword,
      newPassword,
      confirmPassword,
      bio,
      avatar,
      profileImage,
      profileImagePublicId,
      coverImage,
      coverImagePublicId,
      title,
      job,
      city,
      maritalStatus,
      dateOfBirth,
      school,
      college,
      university,
      education,
      location,
      website,
      isPrivate,
    } = req.body;

    const updateData = {};
    if (isPrivate !== undefined) updateData.isPrivate = Boolean(isPrivate);
    if (name || fullName) updateData.fullName = name || fullName;

    // Update Username with duplicate check
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

    // Update Email with format + duplicate check
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      }
      if (cleanEmail !== req.user.email) {
        const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: req.user._id } });
        if (existingEmail) {
          return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }
        updateData.email = cleanEmail;
      }
    }

    // Update Phone Number securely
    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }

    // Password Update (privacy settings use PUT /api/settings/privacy)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
      }
      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
      }
      const userWithPassword = await User.findById(req.user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password.' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
      }
      userWithPassword.password = newPassword;
      await userWithPassword.save();
    }

    if (bio !== undefined) updateData.bio = bio;
    if (isPrivate !== undefined) updateData.isPrivate = Boolean(isPrivate);

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

    if (job !== undefined) {
      updateData.job = job.trim();
      updateData.title = job.trim();
    } else if (title !== undefined) {
      updateData.title = title.trim();
      updateData.job = title.trim();
    }

    if (city !== undefined) {
      updateData.city = city.trim();
      updateData.location = city.trim();
    } else if (location !== undefined) {
      updateData.location = location.trim();
      updateData.city = location.trim();
    }

    if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus.trim();
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth.trim();
    if (school !== undefined) updateData.school = school.trim();
    if (college !== undefined) updateData.college = college.trim();
    if (university !== undefined) updateData.university = university.trim();

    if (education && typeof education === 'object') {
      if (education.school !== undefined) updateData.school = education.school.trim();
      if (education.college !== undefined) updateData.college = education.college.trim();
      if (education.university !== undefined) updateData.university = education.university.trim();
    }

    if (website !== undefined) updateData.website = website;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updateData }, { returnDocument: 'after', runValidators: true });
    const enriched = await enrichUserProfile(user, req.user._id);

    return res.json({ success: true, data: enriched, message: 'Profile updated successfully' });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: field === 'email' ? 'An account with this email already exists.' : 'This username is already taken.',
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/users/:username/posts
router.get('/:username/posts', optionalAuth, async (req, res) => {
  try {
    const cleanUsername = req.params.username.replace('@', '').toLowerCase();
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      return res.json({ success: true, posts: [], data: [] });
    }

    const currentUserIdStr = req.user ? req.user._id.toString() : null;
    const isOwner = currentUserIdStr ? user._id.toString() === currentUserIdStr : false;

    if (currentUserIdStr && !isOwner) {
      const blocked = await areUsersBlocked(req.user._id, user._id);
      if (blocked) {
        return res.json({
          success: true,
          isBlocked: true,
          posts: [],
          data: [],
          message: 'Content unavailable.',
        });
      }
    }

    let isFollowing = false;
    if (currentUserIdStr && !isOwner) {
      const currentUser = await User.findById(req.user._id).select('following');
      isFollowing = currentUser?.following?.some((id) => id.toString() === user._id.toString()) || false;
    }

    // Lock posts if user account is private and viewer is not owner or follower
    if (user.isPrivate && !isOwner && !isFollowing) {
      return res.json({
        success: true,
        isPrivate: true,
        isLocked: true,
        posts: [],
        data: [],
        message: 'This account is private. Follow this account to see their photos and posts.',
      });
    }

    const posts = await Post.find({ user: user._id, isReel: { $ne: true } })
      .sort({ createdAt: -1 })
      .populate('user', 'fullName username profileImage title')
      .populate({ path: 'comments.user', select: 'fullName username profileImage title' });

    const { getRestrictedIdsByOwner } = require('../utils/moderation');
    const hiddenCommentUserIds = await getRestrictedIdsByOwner(user._id);
    const formatted = posts.map((p) => formatPost(p, req.user?._id, { hiddenCommentUserIds }));
    return res.json({ success: true, posts: formatted, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/users/:username/reels
router.get('/:username/reels', optionalAuth, async (req, res) => {
  try {
    const cleanUsername = req.params.username.replace('@', '').toLowerCase();
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      return res.json({ success: true, reels: [] });
    }

    const currentUserIdStr = req.user ? req.user._id.toString() : null;
    const isOwner = currentUserIdStr ? user._id.toString() === currentUserIdStr : false;

    if (currentUserIdStr && !isOwner) {
      const blocked = await areUsersBlocked(req.user._id, user._id);
      if (blocked) {
        return res.json({
          success: true,
          isBlocked: true,
          posts: [],
          data: [],
          message: 'Content unavailable.',
        });
      }
    }

    let isFollowing = false;
    if (currentUserIdStr && !isOwner) {
      const currentUser = await User.findById(req.user._id).select('following');
      isFollowing = currentUser?.following?.some((id) => id.toString() === user._id.toString()) || false;
    }

    if (user.isPrivate && !isOwner && !isFollowing) {
      return res.json({ success: true, isLocked: true, reels: [] });
    }

    const reels = await Reel.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'fullName username profileImage title bio')
      .populate({ path: 'comments.user', select: 'fullName username profileImage title' });

    let currentFollowing = [];
    if (req.user) {
      const currentUser = await User.findById(req.user._id).select('following');
      currentFollowing = (currentUser?.following || []).map((id) => id.toString());
    }

    const formatted = reels.map((r) =>
      formatReel(r, req.user?._id, {
        isFollowing: currentFollowing.includes(user._id.toString()),
      })
    );
    return res.json({ success: true, reels: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/users/:username/likers
router.get('/:username/likers', optionalAuth, async (req, res) => {
  try {
    const cleanUsername = req.params.username.replace('@', '').toLowerCase();
    const user = await User.findOne({ username: cleanUsername }).select('privacy followers following');
    if (!user) {
      return res.json({ success: true, users: [], count: 0, totalLikes: 0, isHidden: false });
    }

    const { shouldHideLikedActivity } = require('../utils/privacy');
    const viewerId = req.user?._id;
    if (shouldHideLikedActivity(user, viewerId)) {
      return res.json({
        success: true,
        users: [],
        count: 0,
        totalLikes: 0,
        isHidden: true,
        message: 'This user has hidden their liked activity.',
      });
    }

    const posts = await Post.find({ likes: user._id }).select('likes user');
    const reels = await Reel.find({ likes: user._id }).select('likes author');
    const totalLikes = posts.length + reels.length;

    const likerIds = new Set();
    posts.forEach((p) => {
      if (p.user) likerIds.add(p.user.toString());
    });
    reels.forEach((r) => {
      if (r.author) likerIds.add(r.author.toString());
    });

    const users = await User.find({ _id: { $in: [...likerIds] } }).select(
      'fullName username profileImage title followers'
    );

    const mapped = await mapUsersWithFollowStatus(users, req.user?._id);
    return res.json({
      success: true,
      users: mapped,
      count: mapped.length,
      totalLikes,
      isHidden: false,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/users/:username/followers
router.get('/:username/followers', optionalAuth, async (req, res) => {
  try {
    const cleanUsername = req.params.username.replace('@', '').toLowerCase();
    const user = await User.findOne({ username: cleanUsername }).populate({
      path: 'followers',
      select: 'fullName username profileImage title bio followers',
    });

    if (!user) {
      return res.json({ success: true, users: [], count: 0 });
    }

    const followers = user.followers || [];
    const mapped = await mapUsersWithFollowStatus(followers, req.user?._id);

    return res.json({
      success: true,
      users: mapped,
      count: mapped.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/users/:username/following
router.get('/:username/following', optionalAuth, async (req, res) => {
  try {
    const cleanUsername = req.params.username.replace('@', '').toLowerCase();
    const user = await User.findOne({ username: cleanUsername }).populate({
      path: 'following',
      select: 'fullName username profileImage title bio followers',
    });

    if (!user) {
      return res.json({ success: true, users: [], count: 0 });
    }

    const following = user.following || [];
    const mapped = await mapUsersWithFollowStatus(following, req.user?._id);

    return res.json({
      success: true,
      users: mapped,
      count: mapped.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/users/:username
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const cleanUsername = req.params.username.replace('@', '').toLowerCase();
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user) {
      const blockStatus = await getBlockStatusBetween(req.user._id, user._id);
      if (blockStatus.isBlockedByThem) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    }

    const enriched = await enrichUserProfile(user, req.user?._id);
    return res.json({ success: true, data: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
