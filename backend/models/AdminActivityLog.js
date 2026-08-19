const mongoose = require('mongoose');

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: {
      type: String,
      enum: ['user', 'post', 'reel', 'comment', 'report', 'support', 'system'],
      default: 'system',
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    description: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

adminActivityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema);
