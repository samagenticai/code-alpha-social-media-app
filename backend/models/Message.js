const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      default: '',
      trim: true,
    },
    storyRef: {
      storyId: { type: String, default: '' },
      media: { type: String, default: '' },
      caption: { type: String, default: '' },
      bgGradient: { type: String, default: '' },
      creatorName: { type: String, default: '' },
    },
    read: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from creation
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL: auto-delete after expiresAt

module.exports = mongoose.model('Message', messageSchema);
