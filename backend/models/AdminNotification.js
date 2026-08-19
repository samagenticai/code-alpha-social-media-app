const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['report', 'support', 'system', 'moderation', 'user_reply'],
      default: 'system',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, default: '', trim: true },
    relatedType: {
      type: String,
      enum: ['report', 'support', 'user', 'post', 'reel', 'comment', 'message', 'system'],
      default: 'system',
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

adminNotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
