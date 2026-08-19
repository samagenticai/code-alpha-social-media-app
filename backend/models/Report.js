const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'post', 'reel', 'comment', 'message', 'other'],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    targetRef: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      enum: [
        'harassment',
        'abusive_behavior',
        'spam',
        'fake_account',
        'hate_inappropriate',
        'nudity_sexual',
        'threats',
        'copyright',
        'scam_fraud',
        'inappropriate_content',
        'abusive_content',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'resolved', 'rejected'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'high'],
      default: 'normal',
      index: true,
    },
    adminNote: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, priority: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, targetType: 1, targetId: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);
