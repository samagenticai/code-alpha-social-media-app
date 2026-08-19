import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { IconHeart, IconSend, IconTrash, IconSparkles } from '../ui/Icons';
import {
  EmojiHeart,
  EmojiFlame,
  EmojiClap,
  EmojiHeartEyes,
  EmojiSparkles,
  EmojiCelebrate,
} from '../ui/EmojiIcons';
import { userService } from '../../services/userService';

const QUICK_REACTIONS = [
  { text: '❤️ Love it!', Icon: EmojiHeart, label: 'Love' },
  { text: '🔥 Amazing!', Icon: EmojiFlame, label: 'Fire' },
  { text: '👏 Great work!', Icon: EmojiClap, label: 'Applause' },
  { text: '💡 Super insightful', Icon: EmojiSparkles, label: 'Insightful' },
  { text: '🙌 Totally agree!', Icon: EmojiCelebrate, label: 'Agree' },
];

export const PostCommentsSection = ({
  isOpen,
  onClose,
  postId,
  postAuthorId,
  comments = [],
  currentUser,
  isGuest,
  canComment = true,
  onRequireAuth,
  onPostUpdate,
}) => {
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const myId = currentUser?.id?.toString?.() || currentUser?._id?.toString?.() || '';

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!newText.trim() || submitting || !canComment) return;
    if (isGuest) {
      onRequireAuth?.();
      return;
    }

    setSubmitting(true);
    try {
      const res = await userService.addCommentToPost(postId, { text: newText.trim() });
      if (res.success && res.post) {
        onPostUpdate?.(postId, res.post);
        setNewText('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickReaction = (reactionText) => {
    if (!canComment) return;
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    setNewText(reactionText);
    inputRef.current?.focus();
  };

  const handleDelete = async (commentId) => {
    try {
      const res = await userService.deleteComment(postId, commentId);
      if (res.success && res.post) {
        onPostUpdate?.(postId, res.post);
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleLike = async (commentId) => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    try {
      const res = await userService.toggleCommentLike(postId, commentId);
      if (res.success && res.post) {
        onPostUpdate?.(postId, res.post);
      }
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const handleUserClick = (commentUser) => {
    const handleClean =
      commentUser?.username ||
      (commentUser?.handle ? commentUser.handle.replace('@', '') : '') ||
      commentUser?.id ||
      commentUser?._id;
    if (handleClean) {
      navigate(`/profile/${String(handleClean).toLowerCase()}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, maxHeight: 0 }}
          animate={{ opacity: 1, maxHeight: 480 }}
          exit={{ opacity: 0, maxHeight: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="overflow-hidden border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-3 space-y-3"
        >
          {/* Header with Title and Close Button */}
          <div className="flex items-center justify-between text-xs px-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Comments
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {comments.length}
              </span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span>Hide</span>
                <span className="text-[10px]">✕</span>
              </button>
            )}
          </div>

          {/* Clean Input Bar or Disabled Notice */}
          {canComment ? (
            <>
              <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
                <Avatar
                  src={currentUser?.avatar || currentUser?.profileImage}
                  size="sm"
                  className="!w-8 !h-8 flex-shrink-0 ring-1 ring-slate-200 dark:ring-slate-800 rounded-full"
                />

                <div className="flex-1 flex items-center gap-2 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-3.5 py-1.5 focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:bg-white dark:focus-within:bg-slate-950 transition-all shadow-2xs">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder={isGuest ? 'Sign in to comment…' : 'Write a comment…'}
                    onFocus={() => isGuest && onRequireAuth?.()}
                    maxLength={2200}
                    className="flex-1 min-w-0 bg-transparent border-0 text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none py-1"
                  />

                  <button
                    type="submit"
                    disabled={!newText.trim() || submitting}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                      newText.trim()
                        ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-sm shadow-brand-500/30 active:scale-95'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                    aria-label="Send comment"
                  >
                    {submitting ? (
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Post</span>
                        <IconSend className="w-3 h-3 -ml-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick Reaction Pills Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0 hidden sm:inline">
                  Quick React:
                </span>
                {QUICK_REACTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickReaction(item.text)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100/80 dark:bg-slate-900/80 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-cyan-300 border border-slate-200/60 dark:border-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer text-slate-700 dark:text-slate-300 flex-shrink-0"
                  >
                    <item.Icon className="w-3.5 h-3.5 pointer-events-none drop-shadow-2xs" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="py-2.5 px-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              Comments are turned off for this post.
            </div>
          )}

          {/* Comments List or Empty State */}
          {comments.length === 0 ? (
            <div className="py-6 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="flex flex-col items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <IconSparkles className="w-5 h-5 text-brand-500 mb-1" />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">No comments yet</span>
                <span>Be the first to share your thoughts or send a quick reaction!</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto no-scrollbar pr-1 pt-1">
              {comments.map((comment) => {
                const commentUserId =
                  comment.user?.id?.toString?.() ||
                  comment.user?._id?.toString?.() ||
                  comment.userId?.toString?.() ||
                  '';
                const isOwn = myId && commentUserId === myId;
                const isAuthor = postAuthorId && commentUserId && postAuthorId.toString() === commentUserId;
                const name = comment.user?.name || comment.user?.fullName || 'User';
                const username = comment.user?.username;

                return (
                  <div key={comment.id || comment._id} className="flex gap-2.5 group">
                    <button
                      type="button"
                      onClick={() => handleUserClick(comment.user)}
                      className="flex-shrink-0 self-start mt-0.5"
                    >
                      <Avatar
                        src={comment.user?.avatar || comment.user?.profileImage}
                        size="xs"
                        className="!w-7 !h-7 rounded-full ring-1 ring-slate-200 dark:ring-slate-800"
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="inline-block max-w-full rounded-2xl rounded-tl-xs bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800/80 px-3.5 py-2 shadow-2xs">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <button
                            type="button"
                            onClick={() => handleUserClick(comment.user)}
                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-cyan-400 transition-colors truncate"
                          >
                            {name}
                          </button>
                          {username && (
                            <span className="text-[10px] text-slate-400">@{username}</span>
                          )}
                          {isAuthor && (
                            <span className="px-1.5 py-0.2 bg-brand-500/15 text-brand-600 dark:text-cyan-400 text-[9px] font-bold rounded uppercase">
                              Author
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-[13px] leading-snug text-slate-800 dark:text-slate-200 break-words whitespace-pre-wrap font-normal">
                          {comment.text}
                        </p>
                      </div>

                      {/* Action buttons under comment */}
                      <div className="flex items-center gap-3 mt-1 px-2 text-[10px] sm:text-[11px] text-slate-400">
                        <span>{comment.timeAgo || 'Just now'}</span>
                        <button
                          type="button"
                          onClick={() => handleLike(comment.id || comment._id)}
                          className={`font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                            comment.isLiked
                              ? 'text-rose-500'
                              : 'hover:text-rose-500 dark:hover:text-rose-400'
                          }`}
                        >
                          <IconHeart className="w-3 h-3" filled={comment.isLiked} />
                          <span>{comment.likesCount > 0 ? comment.likesCount : 'Like'}</span>
                        </button>

                        {isOwn && (
                          <button
                            type="button"
                            onClick={() => handleDelete(comment.id || comment._id)}
                            className="hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-0.5"
                          >
                            <IconTrash className="w-2.5 h-2.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostCommentsSection;
