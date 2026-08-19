const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'post_like', 'post_comment', 'post_save', 'story_view', 'story_like',
        'message', 'follow', 'follow_request', 'follow_accepted',
        'report_reply', 'report_resolved', 'report_rejected', 'report_status',
      ],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    text: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
