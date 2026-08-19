const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, optionalAuth } = require('../middleware/auth');
const Story = require('../models/Story');
const User = require('../models/User');

const getUserIdFromReq = async (req) => {
  if (req.user) return req.user._id;
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
  return guestUser._id;
};

// GET /api/stories - Get active non-expired stories (prioritizes followed users & self)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const now = new Date();
    let followingIds = [];
    const currentUserId = req.user ? req.user._id : await getUserIdFromReq(req);
    const currentUserIdStr = currentUserId ? currentUserId.toString() : '';

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
            handle: `@${story.user.username}`,
            avatar: story.user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
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
      const isLiked = currentUserIdStr && story.likes
        ? story.likes.some((id) => id.toString() === currentUserIdStr)
        : false;

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

    const allGroups = Array.from(groupedMap.values()).filter(
      (group) => group.isSelf || group.isFollowing
    );

    allGroups.sort((a, b) => {
      if (a.isSelf) return -1;
      if (b.isSelf) return 1;
      return 0;
    });

    res.json({ success: true, stories: allGroups });
  } catch (error) {
    console.error('Failed to fetch stories:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stories.' });
  }
});

// POST /api/stories - Create a new story (Saves directly to MongoDB)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { media, mediaType, caption, bgGradient } = req.body;
    const finalMedia = media || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
    const storyUserId = await getUserIdFromReq(req);

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
      viewsCount: 0,
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

    res.status(201).json({
      success: true,
      message: 'Story published and saved to MongoDB successfully!',
      story: formattedGroup,
      storyItem: formattedStoryItem,
    });
  } catch (error) { 
    console.error('Failed to create story:', error);
    res.status(500).json({ success: false, message: 'Server error creating story.' });
  } 
});

// DELETE /api/stories/:id - Delete story
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const rawId = req.params.id;
    const cleanId = rawId.replace('user_st_', '');

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      // First try deleting by story _id
      const deletedStory = await Story.findByIdAndDelete(cleanId);
      if (deletedStory) {
        return res.json({ success: true, message: 'Story deleted successfully.' });
      }

      // If not found by story _id, delete all stories for that user_id
      await Story.deleteMany({ user: cleanId });
      return res.json({ success: true, message: 'Stories for user deleted successfully.' });
    }

    res.status(400).json({ success: false, message: 'Invalid story ID.' });
  } catch (error) {
    console.error('Failed to delete story:', error);
    res.status(500).json({ success: false, message: 'Server error deleting story.' });
  }
});

const { createNotification } = require('../controllers/notificationsController');

// POST /api/stories/:id/like - Like a story item
router.post('/:id/like', optionalAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.json({ success: true, isLiked: false, likesCount: 0 });
    }

    const currentUserId = await getUserIdFromReq(req);
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.json({ success: true, isLiked: false, likesCount: 0 });
    }

    const alreadyLiked = story.likes.some((id) => id.toString() === currentUserId.toString());
    if (alreadyLiked) {
      story.likes.pull(currentUserId);
    } else {
      story.likes.push(currentUserId);
    }

    await story.save();

    if (!alreadyLiked && story.user) {
      await createNotification({
        recipient: story.user,
        sender: currentUserId,
        type: 'story_like',
        story: story._id,
      });
    }

    res.json({
      success: true,
      isLiked: !alreadyLiked,
      likesCount: story.likes.length,
    });
  } catch (error) {
    console.error('Failed to toggle story like:', error);
    res.json({ success: true, isLiked: false, likesCount: 0 });
  }
});

// POST /api/stories/:id/view - Record a story view (no self-view)
router.post('/:id/view', optionalAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.json({ success: true, viewsCount: 0 });
    }

    const currentUserId = await getUserIdFromReq(req);
    const story = await Story.findById(req.params.id);
    if (!story) return res.json({ success: true, viewsCount: 0 });

    // Don't record self-views
    if (story.user.toString() === currentUserId.toString()) {
      return res.json({ success: true, viewsCount: story.views.length });
    }

    const alreadyViewed = story.views.some((id) => id.toString() === currentUserId.toString());
    if (!alreadyViewed) {
      story.views.push(currentUserId);
      await story.save();

      await createNotification({
        recipient: story.user,
        sender: currentUserId,
        type: 'story_view',
        story: story._id,
      });
    }

    res.json({ success: true, viewsCount: story.views.length });
  } catch (error) {
    console.error('Failed to record story view:', error);
    res.json({ success: true, viewsCount: 0 });
  }
});

// GET /api/stories/:id/stats - Get likes and viewers for story
router.get('/:id/stats', optionalAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.json({ success: true, likesCount: 0, viewsCount: 0, likers: [], viewers: [] });
    }

    const story = await Story.findById(req.params.id)
      .populate('likes', 'fullName username profileImage verified')
      .populate('views', 'fullName username profileImage verified');

    if (!story) return res.json({ success: true, likesCount: 0, viewsCount: 0, likers: [], viewers: [] });

    const formatUser = (u) => {
      if (!u) return null;
      return {
        id: u._id.toString(),
        name: u.fullName || u.username,
        handle: `@${u.username}`,
        avatar: u.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        verified: u.verified || false,
      };
    };

    const likers = (story.likes || []).map(formatUser).filter(Boolean);
    const viewers = (story.views || []).map(formatUser).filter(Boolean);

    res.json({
      success: true,
      likesCount: likers.length,
      viewsCount: viewers.length,
      likers,
      viewers,
    });
  } catch (error) {
    console.error('Failed to get story stats:', error);
    res.json({ success: true, likesCount: 0, viewsCount: 0, likers: [], viewers: [] });
  }
});

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return '1d ago';
}

module.exports = router;
