import React from 'react';
import { CommentsDrawer } from './CommentsDrawer';
import { userService } from '../../services/userService';

export const PostCommentsDrawer = ({
  isOpen,
  onClose,
  post,
  currentUser,
  isGuest,
  onRequireAuth,
  onPostUpdate,
}) => {
  const postId = post?.id || post?._id;
  const comments = post?.comments || [];

  const handleSubmit = async (text) => {
    const res = await userService.addCommentToPost(postId, { text });
    if (res.success && res.post) onPostUpdate?.(postId, res.post);
  };

  const handleDelete = async (commentId) => {
    const res = await userService.deleteComment(postId, commentId);
    if (res.success && res.post) onPostUpdate?.(postId, res.post);
  };

  const handleLikeComment = async (commentId) => {
    const res = await userService.toggleCommentLike(postId, commentId);
    if (res.success && res.post) onPostUpdate?.(postId, res.post);
  };

  const authorId = post?.user?.id || post?.user?._id || post?.userId;

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

export default PostCommentsDrawer;
