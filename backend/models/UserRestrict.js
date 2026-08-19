const mongoose = require('mongoose');

const userRestrictSchema = new mongoose.Schema(
  {
    restricter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    restricted: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

userRestrictSchema.index({ restricter: 1, restricted: 1 }, { unique: true });

module.exports = mongoose.model('UserRestrict', userRestrictSchema);
