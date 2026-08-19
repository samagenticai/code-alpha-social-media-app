import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { IconClose, IconHeart, IconSend, IconTrash, IconComment, IconSparkles } from '../ui/Icons';
import {
  EmojiHeart,
  EmojiFlame,
  EmojiClap,
  EmojiHeartEyes,
  EmojiSparkles,
  EmojiCelebrate,
} from '../ui/EmojiIcons';

const QUICK_STARTERS = [
  { text: '🔥 Amazing post!', Icon: EmojiFlame, label: 'Amazing post!' },
  { text: '👏 Great work!', Icon: EmojiClap, label: 'Great work!' },
  { text: '✨ Very insightful', Icon: EmojiSparkles, label: 'Very insightful' },
  { text: '❤️ Love this!', Icon: EmojiHeart, label: 'Love this!' },
  { text: '🎉 Totally agree!', Icon: EmojiCelebrate, label: 'Totally agree!' },
];

const EMOJI_REACTIONS = [
  { char: '❤️', Icon: EmojiHeart, label: 'Heart' },
  { char: '🔥', Icon: EmojiFlame, label: 'Fire' },
  { char: '👏', Icon: EmojiClap, label: 'Clap' },
  { char: '😍', Icon: EmojiHeartEyes, label: 'Love' },
  { char: '✨', Icon: EmojiSparkles, label: 'Sparkles' },
  { char: '🎉', Icon: EmojiCelebrate, label: 'Party' },
];

/**
 * Professional, modern bottom-sheet (mobile) / slide-over panel (desktop) comments drawer.
 * Designed with rich empty states, quick-reaction chips, and glassmorphic styling.
 */
export const CommentsDrawer = ({
  isOpen,
  onClose,
  comments = [],
  currentUser,
  isGuest,
  onRequireAuth,
  onSubmit,
  onDelete,
  onLikeComment,
  title = 'Comments',
  authorId = null,
}) => {
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  const dragControls = useDragControls();
  const navigate = useNavigate();

  const myId = currentUser?.id?.toString?.() || currentUser?._id?.toString?.() || '';
  const count = comments.length;

  useEffect(() => {
    if (!isOpen) {
      setNewText('');
      return undefined;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!newText.trim() || submitting) return;
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit?.(newText.trim());
      setNewText('');
    } catch (err) {
      console.error('Comment submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddQuickText = (text) => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    setNewText((prev) => (prev ? `${prev} ${text}` : text));
    inputRef.current?.focus();
  };

  const handleUserClick = (commentUser) => {
    const handleClean =
      commentUser?.username ||
      (commentUser?.handle ? commentUser.handle.replace('@', '') : '') ||
      commentUser?.id ||
      commentUser?._id;
    if (handleClean) {
      onClose?.();
      navigate(`/profile/${String(handleClean).toLowerCase()}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Frosted Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
            aria-hidden
          />

          {/* Slide-in Panel / Bottom Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={
              typeof window !== 'undefined' && window.innerWidth >= 768
                ? { x: '100%', opacity: 0.8 }
                : { y: '100%' }
            }
            animate={
              typeof window !== 'undefined' && window.innerWidth >= 768
                ? { x: 0, opacity: 1 }
                : { y: 0 }
            }
            exit={
              typeof window !== 'undefined' && window.innerWidth >= 768
                ? { x: '100%', opacity: 0.8 }
                : { y: '100%' }
            }
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag={typeof window !== 'undefined' && window.innerWidth < 768 ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose?.();
            }}
            className="fixed z-[100] inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[420px] lg:w-[460px] md:max-w-full flex flex-col bg-white dark:bg-slate-950 border-t md:border-t-0 md:border-l border-slate-200/90 dark:border-slate-800/90 rounded-t-[2rem] md:rounded-t-none md:rounded-l-3xl shadow-2xl md:shadow-[-16px_0_50px_rgba(0,0,0,0.3)] max-h-[90vh] md:max-h-none md:h-full overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Mobile Drag Handle */}
            <div
              className="md:hidden flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <span className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 transition-colors" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 flex-shrink-0">
                  <IconComment className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      {title}
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-cyan-400 border border-brand-200/60 dark:border-cyan-500/30">
                      {count}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {count === 0 ? 'Be the first to comment' : `${count} discussion${count === 1 ? '' : 's'}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all hover:rotate-90 cursor-pointer"
                aria-label="Close comments"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List / Rich Empty State */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4 min-h-0">
              {count === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-2 text-center h-full min-h-[300px]">
                  {/* Glowing Conversation Icon */}
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600/15 via-indigo-500/15 to-cyan-500/15 dark:from-brand-600/25 dark:to-cyan-500/25 border border-brand-500/20 flex items-center justify-center shadow-lg shadow-brand-500/10">
                      <IconSparkles className="w-8 h-8 text-brand-600 dark:text-cyan-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md">
                      <IconComment className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    No comments yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                    Be the first to share your thoughts, ask questions, or send a quick reaction!
                  </p>

                  {/* One-Tap Quick Starters */}
                  <div className="mt-6 w-full max-w-[320px]">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                      Quick Responses
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {QUICK_STARTERS.map((starter, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddQuickText(starter.text)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 dark:bg-slate-900/90 dark:hover:bg-brand-950/60 dark:text-slate-300 dark:hover:text-cyan-300 border border-slate-200/80 dark:border-slate-800 transition-all active:scale-95 shadow-sm cursor-pointer"
                        >
                          <starter.Icon className="w-3.5 h-3.5" />
                          <span>{starter.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                comments.map((comment) => {
                  const commentUserId =
                    comment.user?.id?.toString?.() ||
                    comment.user?._id?.toString?.() ||
                    comment.userId?.toString?.() ||
                    '';
                  const isOwn = myId && commentUserId === myId;
                  const isAuthor = authorId && commentUserId && authorId.toString() === commentUserId;
                  const name = comment.user?.name || comment.user?.fullName || 'User';
                  const username = comment.user?.username;

                  return (
                    <motion.div
                      key={comment.id || comment._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 group"
                    >
                      <button
                        type="button"
                        onClick={() => handleUserClick(comment.user)}
                        className="flex-shrink-0 self-start transition-transform hover:scale-105"
                      >
                        <Avatar
                          src={comment.user?.avatar || comment.user?.profileImage}
                          size="sm"
                          className="!w-8 !h-8 rounded-full ring-2 ring-transparent group-hover:ring-brand-500/40 transition-all"
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="rounded-2xl rounded-tl-sm bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800/80 px-3.5 py-2.5 shadow-sm">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <button
                                type="button"
                                onClick={() => handleUserClick(comment.user)}
                                className="text-xs font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-cyan-400 transition-colors truncate"
                              >
                                {name}
                              </button>
                              {username && (
                                <span className="text-[11px] text-slate-400 font-normal truncate">
                                  @{username}
                                </span>
                              )}
                              {isAuthor && (
                                <span className="px-1.5 py-0.2 bg-brand-500/15 text-brand-600 dark:text-cyan-400 text-[9px] font-bold rounded-md uppercase tracking-wider">
                                  Author
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {comment.timeAgo || 'Just now'}
                            </span>
                          </div>

                          <p className="text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 break-words whitespace-pre-wrap font-normal">
                            {comment.text}
                          </p>
                        </div>

                        {/* Comment Actions: Like & Delete */}
                        <div className="flex items-center gap-3 mt-1 px-1.5">
                          {onLikeComment && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isGuest) onRequireAuth?.();
                                else onLikeComment(comment.id || comment._id);
                              }}
                              className={`flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                                comment.isLiked
                                  ? 'text-rose-500'
                                  : 'text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400'
                              }`}
                            >
                              <IconHeart className="w-3.5 h-3.5" filled={comment.isLiked} />
                              <span>{comment.likesCount > 0 ? comment.likesCount : 'Like'}</span>
                            </button>
                          )}

                          {isOwn && onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(comment.id || comment._id)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 transition-all cursor-pointer opacity-70 hover:opacity-100"
                            >
                              <IconTrash className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Quick Emoji Bar & Input Footer */}
            <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-3 sm:p-4 space-y-2.5">
              {/* Quick Emojis */}
              <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {EMOJI_REACTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddQuickText(item.char)}
                      className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center transition-all hover:scale-125 active:scale-95 cursor-pointer"
                      title={item.label}
                    >
                      <item.Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
                <Avatar
                  src={currentUser?.avatar || currentUser?.profileImage}
                  size="sm"
                  className="!w-9 !h-9 flex-shrink-0 ring-1 ring-slate-200 dark:ring-slate-800"
                />

                <div className="flex-1 flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 px-3.5 py-1.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder={isGuest ? 'Sign in to comment…' : 'Share your thoughts…'}
                    onFocus={() => isGuest && onRequireAuth?.()}
                    maxLength={2200}
                    className="flex-1 min-w-0 bg-transparent border-0 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none py-1"
                  />

                  <button
                    type="submit"
                    disabled={!newText.trim() || submitting}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all active:scale-95 shadow-md ${
                      newText.trim()
                        ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-500/25'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                    aria-label="Send comment"
                  >
                    {submitting ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <IconSend className="w-3.5 h-3.5 -ml-0.5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommentsDrawer;

