const mongoose = require('mongoose');

const reportMessageSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

reportMessageSchema.index({ reportId: 1, createdAt: 1 });

module.exports = mongoose.model('ReportMessage', reportMessageSchema);
