/** Normalize API post shape for frontend components */
export const mapPost = (post) => {
  if (!post) return null;

  const id = post.id || post._id?.toString?.() || post._id;
  const user = post.user || {};

  const handle = user.handle || (user.username ? `@${user.username}` : '@user');
  const avatar = user.avatar || user.profileImage || '';

  return {
    ...post,
    id,
    _id: id,
    user: {
      ...user,
      id: user.id || user._id,
      name: user.name || user.fullName || 'User',
      fullName: user.fullName || user.name || 'User',
      handle,
      username: user.username || handle.replace('@', ''),
      avatar,
      profileImage: avatar,
      title: user.title || '',
      privacy: user.privacy || {},
    },
    whoCanComment: post.whoCanComment || user.privacy?.whoCanComment || 'everyone',
    canComment: post.canComment !== undefined ? post.canComment : (user.privacy?.whoCanComment !== 'nobody'),
    allowComments: post.allowComments !== undefined ? post.allowComments : (user.privacy?.whoCanComment !== 'nobody'),
    hideLikes: Boolean(post.hideLikes || user.privacy?.hideLikedPosts || user.privacy?.hideLikes),
    audience: post.audience || 'public',
    images: post.images?.length
      ? post.images
      : post.imageUrl
        ? [post.imageUrl]
        : [],
    likesCount: post.likesCount ?? post.likes?.length ?? 0,
    commentsCount: post.commentsCount ?? post.comments?.length ?? 0,
    savesCount: post.savesCount ?? post.saves?.length ?? 0,
    sharesCount: post.sharesCount ?? 0,
    isLiked: post.isLiked ?? false,
    isSaved: post.isSaved ?? false,
    isReel: Boolean(post.isReel),
    isDemo: Boolean(post.isDemo),
    source: post.source || '',
    reelOrder: post.reelOrder,
    comments: (post.comments || []).map((c) => ({
      ...c,
      id: c.id || c._id,
      likesCount: c.likesCount ?? c.likes ?? 0,
      isLiked: c.isLiked ?? false,
      user: {
        ...(c.user || {}),
        name: c.user?.name || c.name || 'User',
        avatar: c.user?.avatar || c.avatar || '',
        username: c.user?.username,
      },
    })),
  };
};

export const mapPosts = (posts) => (Array.isArray(posts) ? posts.map(mapPost).filter(Boolean) : []);

export const mapProfile = (profile) => {
  if (!profile) return null;
  return {
    ...profile,
    id: profile.id || profile._id,
    name: profile.name || profile.fullName || 'User',
    fullName: profile.fullName || profile.name || 'User',
    handle: profile.handle || (profile.username ? `@${profile.username}` : '@user'),
    email: profile.email || '',
    phone: profile.phone || '',
    avatar: profile.avatar || profile.profileImage,
    profileImage: profile.profileImage || profile.avatar,
    isPrivate: Boolean(profile.isPrivate),
    job: profile.job || profile.title || '',
    city: profile.city || profile.location || '',
    maritalStatus: profile.maritalStatus || '',
    dateOfBirth: profile.dateOfBirth || '',
    school: profile.school || profile.education?.school || '',
    college: profile.college || profile.education?.college || '',
    university: profile.university || profile.education?.university || '',
    education: {
      school: profile.school || profile.education?.school || '',
      college: profile.college || profile.education?.college || '',
      university: profile.university || profile.education?.university || '',
    },
    postsCount: profile.postsCount ?? 0,
    followers: profile.followers ?? profile.followersCount ?? 0,
    following: profile.following ?? profile.followingCount ?? 0,
    privacy: profile.privacy || {},
    whoCanMessage: profile.privacy?.whoCanMessage || profile.whoCanMessage || 'everyone',
  };
};
