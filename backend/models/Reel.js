const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['cloudinary'],
      default: 'cloudinary',
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    videoPublicId: {
      type: String,
      default: '',
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String },
        avatar: { type: String },
        text: { type: String, required: true },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
    reelOrder: {
      type: Number,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: '',
      maxlength: [120, 'Location cannot exceed 120 characters'],
    },
    hashtags: [{
      type: String,
      trim: true,
    }],
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    isRemoved: { type: Boolean, default: false, index: true },
    removedAt: { type: Date, default: null },
    removedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    removedReason: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

reelSchema.index({ createdAt: -1 });
reelSchema.index({ isDemo: 1, reelOrder: 1 });

module.exports = mongoose.model('Reel', reelSchema);
