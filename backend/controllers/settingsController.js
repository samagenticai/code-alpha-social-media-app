const User = require('../models/User');
const { toClientPrivacy, fromClientPrivacy } = require('../utils/privacy');

exports.getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      privacy: toClientPrivacy(user),
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to load privacy settings.' });
  }
};

exports.updatePrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updates = fromClientPrivacy(req.body);

    if (updates.isPrivate !== undefined) user.isPrivate = updates.isPrivate;

    if (updates.privacy) {
      user.privacy = user.privacy || {};
      Object.assign(user.privacy, updates.privacy);
      user.markModified('privacy');
    }

    await user.save();

    res.json({
      success: true,
      privacy: toClientPrivacy(user),
      data: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    const status = error.message?.includes('Invalid') ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to update privacy settings.',
    });
  }
};
