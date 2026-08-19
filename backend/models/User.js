const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    },
    profileImagePublicId: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    },
    coverImagePublicId: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    job: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    maritalStatus: {
      type: String,
      default: '',
      trim: true,
    },
    dateOfBirth: {
      type: String,
      default: '',
      trim: true,
    },
    school: {
      type: String,
      default: '',
      trim: true,
    },
    college: {
      type: String,
      default: '',
      trim: true,
    },
    university: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    privacy: {
      whoCanFollow: {
        type: String,
        enum: ['everyone', 'approved', 'nobody'],
        default: 'everyone',
      },
      whoCanComment: {
        type: String,
        enum: ['everyone', 'following', 'followers', 'nobody'],
        default: 'everyone',
      },
      whoCanMessage: {
        type: String,
        enum: ['everyone', 'following', 'nobody'],
        default: 'everyone',
      },
      whoCanMention: {
        type: String,
        enum: ['everyone', 'following', 'nobody'],
        default: 'everyone',
      },
      hideLikedPosts: {
        type: Boolean,
        default: false,
      },
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
    demoSeedOrder: {
      type: Number,
      default: null,
    },
    assignedReel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'blocked'],
      default: 'active',
      index: true,
    },
    blockedAt: { type: Date, default: null },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    blockReason: { type: String, default: '' },
    suspendedAt: { type: Date, default: null },
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    suspendReason: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  const followersCount = Array.isArray(this.followers) ? this.followers.length : (this.followersCount || 0);
  const followingCount = Array.isArray(this.following) ? this.following.length : (this.followingCount || 0);

  const finalJob = this.job || this.title || '';
  const finalCity = this.city || this.location || '';

  return {
    id: this._id,
    fullName: this.fullName,
    name: this.fullName,
    username: this.username,
    handle: `@${this.username}`,
    email: this.email,
    phone: this.phone || '',
    isPrivate: Boolean(this.isPrivate),
    privacy: {
      whoCanFollow: this.privacy?.whoCanFollow || 'everyone',
      whoCanComment: this.privacy?.whoCanComment || 'everyone',
      whoCanMessage: this.privacy?.whoCanMessage || 'everyone',
      whoCanMention: this.privacy?.whoCanMention || 'everyone',
      hideLikedPosts: Boolean(this.privacy?.hideLikedPosts),
    },
    profileImage: this.profileImage,
    profileImagePublicId: this.profileImagePublicId || '',
    avatar: this.profileImage,
    coverImage: this.coverImage,
    coverImagePublicId: this.coverImagePublicId || '',
    job: finalJob,
    city: finalCity,
    maritalStatus: this.maritalStatus || '',
    dateOfBirth: this.dateOfBirth || '',
    school: this.school || '',
    college: this.college || '',
    university: this.university || '',
    education: {
      school: this.school || '',
      college: this.college || '',
      university: this.university || '',
    },
    title: finalJob,
    location: finalCity,
    website: this.website || '',
    bio: this.bio || '',
    followers: followersCount,
    followersCount: followersCount,
    following: followingCount,
    followingCount: followingCount,
    isDemo: Boolean(this.isDemo),
    demoSeedOrder: this.demoSeedOrder ?? null,
    assignedReel: this.assignedReel || null,
    role: this.role || 'user',
    accountStatus: this.accountStatus || 'active',
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
