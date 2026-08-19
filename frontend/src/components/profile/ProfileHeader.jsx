import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { IconEdit, IconMessage, IconLocation, IconCamera, IconLock } from '../ui/Icons';
import { FollowButton } from './FollowButton';
import { Modal } from '../ui/Modal';
import { ProfileUsersModal } from './ProfileUsersModal';
import { AvatarLightbox } from './AvatarLightbox';
import { ProfileMoreMenu } from '../moderation/ProfileMoreMenu';
import { userService } from '../../services/userService';
import { messageService } from '../../services/messageService';

export const ProfileHeader = ({
  profile,
  isOwner,
  onEditProfile,
  onEditPicture,
  onToggleFollow,
  onPostsClick,
  username,
  currentUserId,
  isGuest,
  onRequireAuth,
  onProfileUpdate,
}) => {
  const navigate = useNavigate();
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [statsModal, setStatsModal] = useState(null);
  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);

  const avatarSrc = profile?.avatar || profile?.profileImage;
  const displayName = profile?.name || profile?.fullName || 'User';
  const displayHandle = profile?.handle || (profile?.username ? `@${profile.username}` : '@user');
  const displayTitle = profile?.title || '';
  const profileUsername = username || profile?.username || displayHandle.replace('@', '');
  const isBlocked = Boolean(profile?.isBlockedByMe || profile?.isBlockedByThem);
  const interactionsDisabled = isBlocked || Boolean(profile?.profileUnavailable);

  const postsCount = profile?.postsCount ?? 0;
  const totalLikes = profile?.totalLikes ?? 0;
  const followersCount = profile?.followersCount ?? profile?.followers ?? 0;
  const followingCount = profile?.followingCount ?? profile?.following ?? 0;

  const handleOpenDirectMessage = () => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    const targetId = profile?.id || profile?._id || '';
    const cleanUsername = profileUsername || profile?.username || displayHandle.replace('@', '');
    navigate(`/feed?tab=messages&userId=${encodeURIComponent(targetId)}&username=${encodeURIComponent(cleanUsername)}`);
  };

  const handleSendMessageSubmit = async (e) => {
    e.preventDefault();
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    const targetId = profile?.id || profile?._id || '';
    const cleanUsername = profileUsername || profile?.username || displayHandle.replace('@', '');
    const text = messageText.trim();
    if (text && targetId) {
      try {
        await messageService.sendMessage({ receiverId: targetId, text });
      } catch (err) {
        console.warn('Failed sending message from modal:', err);
      }
    }
    setMessageText('');
    setMessageModalOpen(false);
    navigate(`/feed?tab=messages&userId=${encodeURIComponent(targetId)}&username=${encodeURIComponent(cleanUsername)}`);
  };

  const formatCount = (num) => {
    if (typeof num === 'string') return num;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return (num || 0).toLocaleString();
  };

  const loadFollowers = useCallback(() => userService.getFollowers(profileUsername), [profileUsername]);
  const loadFollowing = useCallback(() => userService.getFollowing(profileUsername), [profileUsername]);
  const loadLikers = useCallback(() => userService.getProfileLikers(profileUsername), [profileUsername]);

  const statsModalConfig = {
    followers: { title: 'Followers', subtitle: `${formatCount(followersCount)} followers`, load: loadFollowers },
    following: { title: 'Following', subtitle: `${formatCount(followingCount)} following`, load: loadFollowing },
    likes: { title: 'Post Likes', subtitle: `${formatCount(totalLikes)} total likes on posts`, load: loadLikers },
  };

  const handleStatClick = (type) => {
    if (type === 'posts') {
      onPostsClick?.();
      return;
    }
    setStatsModal(type);
  };

  const StatButton = ({ type, count, label }) => (
    <button type="button" onClick={() => handleStatClick(type)} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity group">
      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-cyan-400 transition-colors">{formatCount(count)}</span>
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
    </button>
  );

  const whoCanMessage = profile?.privacy?.whoCanMessage || profile?.whoCanMessage || 'everyone';
  const isFollowing = Boolean(profile?.isFollowing);
  const canSendMessage = whoCanMessage === 'everyone' || (whoCanMessage === 'following' && isFollowing) || (whoCanMessage === 'followers' && isFollowing);

  return (
    <div className="relative glass-panel rounded-3xl p-4 sm:p-8 mb-6 overflow-visible border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/40 dark:shadow-black/40">
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.8) 0%, rgba(6, 182, 212, 0.4) 50%, transparent 70%)',
        }}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative group cursor-pointer flex-shrink-0 self-start"
          onClick={isOwner ? (onEditPicture || onEditProfile) : () => setAvatarLightboxOpen(true)}
        >
          <Avatar
            src={avatarSrc}
            alt={displayName}
            size="2xl"
            className="!flex-shrink-0 ring-4 ring-white dark:ring-slate-900 shadow-2xl shadow-brand-500/20"
          />
          {isOwner && (
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]">
              <IconCamera className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          )}
        </motion.div>

        <div className="flex items-center gap-2 flex-wrap">
          {isOwner ? (
            <>
              <Button variant="primary" size="sm" onClick={onEditProfile} icon={IconEdit}>
                Edit Profile
              </Button>
              <Button variant="secondary" size="sm" onClick={onEditPicture || onEditProfile} icon={IconCamera}>
                Change Photo
              </Button>
            </>
          ) : (
            <>
              {!interactionsDisabled && (
                <>
                  <FollowButton
                    isFollowing={profile?.isFollowing}
                    followRequestPending={profile?.followRequestPending}
                    followDisabled={profile?.followDisabled}
                    onToggleFollow={onToggleFollow}
                    className="!px-5 !py-2.5 !text-xs"
                  />
                  {canSendMessage && (
                    <Button variant="secondary" size="sm" onClick={handleOpenDirectMessage} icon={IconMessage}>
                      Message
                    </Button>
                  )}
                </>
              )}
              <ProfileMoreMenu
                profile={profile}
                isGuest={isGuest}
                onRequireAuth={onRequireAuth}
                onBlockChange={() => onProfileUpdate?.()}
                onRestrictChange={() => onProfileUpdate?.()}
              />
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {displayName}
            </h1>
            {profile?.verified && <VerifiedBadge className="w-5 h-5" />}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              {displayHandle}
            </span>
            {profile?.isPrivate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                <IconLock className="w-3 h-3 text-brand-600 dark:text-cyan-400" /> Private
              </span>
            )}
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl font-medium">
          {profile?.bio ? (
            <p className="whitespace-pre-line">{profile.bio}</p>
          ) : isOwner ? (
            <button onClick={onEditProfile} className="text-brand-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer">
              <span>+ Add a bio to your profile</span>
            </button>
          ) : (
            <p className="italic text-slate-400 dark:text-slate-500">No bio specified.</p>
          )}
        </div>

        <div className="flex items-center gap-4 sm:gap-6 pt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <StatButton type="posts" count={postsCount} label="Posts" />
          <StatButton type="followers" count={followersCount} label="Followers" />
          <StatButton type="following" count={followingCount} label="Following" />
          <StatButton type="likes" count={totalLikes} label="Likes" />

          {profile?.location && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <IconLocation className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
              <span className="truncate max-w-[140px] sm:max-w-none">{profile.location}</span>
            </div>
          )}
        </div>
      </div>

      <AvatarLightbox
        isOpen={avatarLightboxOpen}
        onClose={() => setAvatarLightboxOpen(false)}
        src={avatarSrc}
        alt={displayName}
        name={displayName}
        handle={displayHandle}
      />

      <Modal isOpen={messageModalOpen} onClose={() => setMessageModalOpen(false)} title={`Message ${displayName}`}>
        <form onSubmit={handleSendMessageSubmit} className="space-y-3.5">
          <p className="text-xs text-slate-600 dark:text-slate-400">Send a direct message to @{profileUsername}.</p>
          <textarea rows={4} value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message..." required className="w-full p-3 bg-slate-100 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500 resize-none" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMessageModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Send Message</Button>
          </div>
        </form>
      </Modal>

      {statsModal && statsModalConfig[statsModal] && (
        <ProfileUsersModal
          isOpen={Boolean(statsModal)}
          onClose={() => setStatsModal(null)}
          title={statsModalConfig[statsModal].title}
          subtitle={statsModalConfig[statsModal].subtitle}
          loadUsers={statsModalConfig[statsModal].load}
          currentUserId={currentUserId}
          isGuest={isGuest}
          onRequireAuth={onRequireAuth}
        />
      )}
    </div>
  );
};
