const Notification = require('../models/Notification');
const User = require('../models/User');

const MAX_NOTIFICATIONS_PER_USER = 10;

const formatNotification = (n) => {
  const senderObj = n.sender ? {
    id: n.sender._id.toString(),
    name: n.sender.fullName || n.sender.username,
    handle: `@${n.sender.username}`,
    avatar: n.sender.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    verified: n.sender.verified || false,
  } : {
    id: 'unknown',
    name: 'Synora User',
    handle: '@user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    verified: false,
  };

  return {
    id: n._id.toString(),
    _id: n._id.toString(),
    type: n.type,
    sender: senderObj,
    post: n.post ? { id: n.post._id?.toString(), content: n.post.content, image: n.post.imageUrl } : null,
    story: n.story ? { id: n.story._id?.toString(), media: n.story.media } : null,
    messageId: n.message ? n.message.toString() : null,
    reportId: n.report ? n.report.toString() : null,
    text: n.text || '',
    read: n.read,
    createdAt: n.createdAt,
  };
};

// Helper function to create notification & enforce max 10 FIFO cap per user
exports.createNotification = async ({ recipient, sender, type, post, story, message, report, text }) => {
  try {
    if (!recipient || !sender) return null;
    
    // Don't notify if user is performing action on their own content
    if (recipient.toString() === sender.toString()) return null;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post: post || undefined,
      story: story || undefined,
      message: message || undefined,
      report: report || undefined,
      text: text ? String(text).substring(0, 200) : '',
    });

    // Enforce 10 notifications limit: keep 10 newest, delete any older ones
    const userNotifications = await Notification.find({ recipient }).sort({ createdAt: -1 });
    if (userNotifications.length > MAX_NOTIFICATIONS_PER_USER) {
      const excessNotifications = userNotifications.slice(MAX_NOTIFICATIONS_PER_USER);
      const idsToDelete = excessNotifications.map((n) => n._id);
      await Notification.deleteMany({ _id: { $in: idsToDelete } });
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

// GET /api/notifications - Get list of notifications for user (max 10)
exports.getNotifications = async (req, res) => {
  try {
    let currentUserId = req.user ? req.user._id : null;
    if (!currentUserId) {
      let guestUser = await User.findOne({ username: 'guest_creator' });
      if (guestUser) currentUserId = guestUser._id;
    }

    if (!currentUserId) {
      return res.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const notifications = await Notification.find({ recipient: currentUserId })
      .sort({ createdAt: -1 })
      .limit(MAX_NOTIFICATIONS_PER_USER)
      .populate('sender', 'fullName username profileImage verified title')
      .populate('post', 'content imageUrl videoUrl')
      .populate('story', 'media mediaType');

    const formatted = notifications.map((n) => formatNotification(n));

    const unreadCount = formatted.filter((n) => !n.read).length;

    res.json({
      success: true,
      notifications: formatted,
      unreadCount,
    });
  } catch (error) {
    console.error('Failed to get notifications:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications.' });
  }
};

// PUT /api/notifications/read-all - Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    let currentUserId = req.user ? req.user._id : null;
    if (!currentUserId) {
      let guestUser = await User.findOne({ username: 'guest_creator' });
      if (guestUser) currentUserId = guestUser._id;
    }

    if (currentUserId) {
      await Notification.updateMany({ recipient: currentUserId, read: false }, { $set: { read: true } });
    }

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Failed to mark notifications read:', error);
    res.status(500).json({ success: false, message: 'Server error marking notifications read.' });
  }
};

// PUT /api/notifications/:id/read - Mark single as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Failed to mark notification read:', error);
    res.status(500).json({ success: false, message: 'Server error marking notification read.' });
  }
};

// DELETE /api/notifications/:id - Delete single notification
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    res.status(500).json({ success: false, message: 'Server error deleting notification.' });
  }
};

// DELETE /api/notifications - Clear all notifications for recipient
exports.clearAllNotifications = async (req, res) => {
  try {
    let currentUserId = req.user ? req.user._id : null;
    if (!currentUserId) {
      let guestUser = await User.findOne({ username: 'guest_creator' });
      if (guestUser) currentUserId = guestUser._id;
    }

    if (currentUserId) {
      await Notification.deleteMany({ recipient: currentUserId });
    }

    res.json({ success: true, message: 'All notifications cleared.' });
  } catch (error) {
    console.error('Failed to clear notifications:', error);
    res.status(500).json({ success: false, message: 'Server error clearing notifications.' });
  }
};
