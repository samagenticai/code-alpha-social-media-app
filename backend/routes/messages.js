const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, optionalAuth } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationsController');

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

const formatUserSnippet = (u) => {
  if (!u) return null;
  return {
    id: u._id.toString(),
    _id: u._id.toString(),
    name: u.fullName || u.username,
    fullName: u.fullName || u.username,
    username: u.username,
    handle: `@${u.username}`,
    avatar: u.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    profileImage: u.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    title: u.title || '',
    verified: u.verified || false,
  };
};

// GET /api/messages/conversations - Get list of active conversation threads
router.get('/conversations', optionalAuth, async (req, res) => {
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

// GET /api/messages/:userId - Get chat history with specific user
router.get('/:userId', optionalAuth, async (req, res) => {
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

    if (req.user) {
      const { areUsersBlocked } = require('../utils/moderation');
      if (await areUsersBlocked(req.user._id, targetUserId)) {
        return res.json({ success: true, messages: [] });
      }
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

// POST /api/messages - Send direct message or story reply
router.post('/', optionalAuth, async (req, res) => {
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
        });
      }
      senderId = guestUser._id;
    }

    const { receiverId, text, storyRef } = req.body;
    const targetUserId = await resolveUserId(receiverId);

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Invalid target receiver user.' });
    }

    // Enforce recipient privacy settings for new conversations
    const receiverDoc = await User.findById(targetUserId).select('privacy following');
    if (!receiverDoc) {
      return res.status(404).json({ success: false, message: 'Receiver not found.' });
    }

    const existingMessage = await Message.findOne({
      $or: [
        { sender: senderId, receiver: targetUserId },
        { sender: targetUserId, receiver: senderId },
      ],
    });

    const { canMessageUser } = require('../utils/privacy');
    const { assertNotBlocked, isRestrictedBy } = require('../utils/moderation');

    await assertNotBlocked(senderId, targetUserId, 'You cannot message this user.');

    if (await isRestrictedBy(targetUserId, senderId) && !existingMessage) {
      return res.status(403).json({
        success: false,
        message: 'This user is not accepting new messages from you.',
      });
    }

    if (!canMessageUser(receiverDoc, senderId, Boolean(existingMessage))) {
      return res.status(403).json({
        success: false,
        message: 'This user is not accepting new messages from you.',
      });
    }

    // Only attach storyRef if it has real content
    const hasStoryRef = storyRef && (storyRef.storyId || storyRef.media);

    const newMessage = await Message.create({
      sender: senderId,
      receiver: targetUserId,
      text: text || '',
      storyRef: hasStoryRef ? storyRef : undefined,
    });

    await createNotification({
      recipient: targetUserId,
      sender: senderId,
      type: 'message',
      message: newMessage._id,
      text: text || (hasStoryRef ? 'Replied to story' : 'Sent attachment'),
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

module.exports = router;
