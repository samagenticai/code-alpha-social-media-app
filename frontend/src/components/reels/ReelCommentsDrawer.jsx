import React from 'react';
import { CommentsDrawer } from '../comments/CommentsDrawer';
import { userService } from '../../services/userService';

export const ReelCommentsDrawer = ({
  isOpen,
  onClose,
  reel,
  currentUser,
  isGuest,
  onRequireAuth,
  onReelUpdate,
}) => {
  const reelId = reel?.id || reel?._id;
  const comments = reel?.comments || [];

  const handleSubmit = async (text) => {
    const res = await userService.addCommentToReel(reelId, { text });
    if (res.success && res.reel) onReelUpdate?.(res.reel);
  };

  const handleDelete = async (commentId) => {
    const res = await userService.deleteReelComment(reelId, commentId);
    if (res.success && res.reel) onReelUpdate?.(res.reel);
  };

  const handleLikeComment = async (commentId) => {
    const res = await userService.toggleReelCommentLike(reelId, commentId);
    if (res.success && res.reel) onReelUpdate?.(res.reel);
  };

  const authorId = reel?.user?.id || reel?.user?._id || reel?.userId;

  return (
    <CommentsDrawer
      isOpen={isOpen}
      onClose={onClose}
      comments={comments}
      currentUser={currentUser}
      isGuest={isGuest}
      onRequireAuth={onRequireAuth}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      onLikeComment={handleLikeComment}
      title="Comments"
      authorId={authorId}
    />
  );
};

export default ReelCommentsDrawer;
