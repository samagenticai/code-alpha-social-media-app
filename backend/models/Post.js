const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    images: [
      {
        type: String,
      },
    ],
    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    videoPublicId: { type: String, default: '' },
    media: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
        resourceType: { type: String, default: 'image' },
        format: { type: String, default: '' },
      },
    ],
    video: {
      thumbnail: { type: String },
      title: { type: String },
      duration: { type: String, default: '0:30' },
      url: { type: String },
      publicId: { type: String },
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
    isReel: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
    source: {
      type: String,
      enum: ['cloudinary', 'upload', ''],
      default: '',
    },
    reelOrder: {
      type: Number,
      default: null,
    },
    isRemoved: { type: Boolean, default: false, index: true },
    removedAt: { type: Date, default: null },
    removedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    removedReason: { type: String, default: '' },
    audience: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Post', postSchema);
