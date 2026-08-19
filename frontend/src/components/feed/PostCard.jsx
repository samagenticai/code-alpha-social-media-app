import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  IconHeart,
  IconComment,
  IconShare,
  IconBookmark,
  IconBookmarkFill,
  IconDots,
  IconUsers,
  IconLock,
  IconGlobe,
} from '../ui/Icons';
import { Modal } from '../ui/Modal';
import { LikersModal } from './LikersModal';
import { PostMediaViewer } from '../media/PostMediaViewer';
import { ReportModal } from '../moderation/ReportModal';
import { PostCommentsSection } from '../comments/PostCommentsSection';
import { FeedVideoPlayer, resolvePostVideoUrl, resolvePostVideoThumb } from './FeedVideoPlayer';
import { userService } from '../../services/userService';
import { BRAND, getShareUrl } from '../../config/brand';


export const PostCard = React.memo(({ post, user, isGuest, onRequireAuth, onEditPost, onDeletePost, onPostUpdate }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [savesCount, setSavesCount] = useState(post.savesCount || 0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);

  const [showLikersModal, setShowLikersModal] = useState(false);
  const [likers, setLikers] = useState([]);
  const [loadingLikers, setLoadingLikers] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState({ type: 'post', id: null, label: '' });
  const [copiedLink, setCopiedLink] = useState(false);

  const [editContent, setEditContent] = useState(post.content || '');
  const [editImageUrl, setEditImageUrl] = useState((post.images && post.images[0]) || '');
  const [editVideoUrl, setEditVideoUrl] = useState((post.video && post.video.thumbnail) || '');


  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);

  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  const [mediaViewerType, setMediaViewerType] = useState('image');

  const [actionLoading, setActionLoading] = useState(false);
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const [loadedImages, setLoadedImages] = useState(() => new Set());

  const postId = post.id || post._id;

  useEffect(() => {
    setBrokenImages(new Set());
    setLoadedImages(new Set());
  }, [postId]);

  const feedVideoUrl = useMemo(() => {
    if (post.images?.length && !post.videoUrl && !post.video?.url) return '';
    return resolvePostVideoUrl(post);
  }, [
    post.videoUrl,
    post.video?.url,
    post.thumbnailUrl,
    post.media,
    post.images,
  ]);
  const feedVideoThumb = useMemo(
    () => resolvePostVideoThumb(post, feedVideoUrl),
    [post.video?.thumbnail, post.thumbnailUrl, feedVideoUrl]
  );
  const cardRef = useRef(null);

  useEffect(() => {
    if (!showComments) return;
    const handleDocumentClick = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setShowComments(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowComments(false);
      }
    };
    document.addEventListener('pointerdown', handleDocumentClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleDocumentClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showComments]);

  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikesCount(post.likesCount || 0);
    setIsSaved(post.isSaved || false);
    setSavesCount(post.savesCount || 0);
    setSharesCount(post.sharesCount || 0);
    setComments(post.comments || []);
    setEditContent(post.content || '');
  }, [post]);

  const myHandle = user?.handle ? user.handle.replace('@', '').toLowerCase() : '';
  const myId = user?.id?.toString?.() || user?._id?.toString?.() || '';
  const postOwnerHandle = post.user?.handle ? post.user.handle.replace('@', '').toLowerCase() : (post.user?.username || '').toLowerCase();
  const postOwnerId = post.user?.id?.toString?.() || post.userId?.toString?.() || '';
  const isOwner = (myId && postOwnerId && myId === postOwnerId) || (myHandle && postOwnerHandle && myHandle === postOwnerHandle);
  const postOwnerPrivacy = post.user?.privacy || {};
  const isLikesHidden = !isOwner && Boolean(post.hideLikes || postOwnerPrivacy.hideLikedPosts || postOwnerPrivacy.hideLikes);
  const whoCanComment = post.whoCanComment || postOwnerPrivacy.whoCanComment || (isOwner ? (user?.privacy?.whoCanComment || 'everyone') : 'everyone');
  const isCommentsDisabled = whoCanComment === 'nobody' || post.allowComments === false;
  const canUserComment = !isCommentsDisabled && (isOwner || post.canComment !== false);
  const showCommentButton = !isCommentsDisabled && canUserComment;

  const openImageViewer = (idx) => {
    setMediaViewerIndex(idx);
    setMediaViewerType('image');
    setMediaViewerOpen(true);
  };

  const handleUserClick = (e) => {
    e.stopPropagation();
    const targetUser = post.user || {};
    const handleClean = targetUser.username || (targetUser.handle ? targetUser.handle.replace('@', '') : '') || targetUser.id || targetUser._id;
    if (handleClean) {
      navigate(`/profile/${String(handleClean).toLowerCase()}`);
    }
  };

  const guardAction = (callback) => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    callback();
  };

  const handleLikeToggle = () => {
    guardAction(async () => {
      if (actionLoading) return;
      const prevLiked = isLiked;
      const prevCount = likesCount;
      setIsLiked(!prevLiked);
      setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
      setActionLoading(true);
      try {
        const res = await userService.toggleLikePost(postId);
        setIsLiked(res.isLiked);
        setLikesCount(res.likesCount);
        if (res.post) onPostUpdate?.(postId, res.post);
      } catch (err) {
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
        console.error('Like failed:', err);
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleSaveToggle = () => {
    guardAction(async () => {
      if (actionLoading) return;
      const prevSaved = isSaved;
      const prevCount = savesCount;
      setIsSaved(!prevSaved);
      setSavesCount(prevSaved ? Math.max(0, prevCount - 1) : prevCount + 1);
      setActionLoading(true);
      try {
        const res = await userService.toggleSavePost(postId);
        setIsSaved(res.isSaved);
        setSavesCount(res.savesCount);
        if (res.post) onPostUpdate?.(postId, res.post);
      } catch (err) {
        setIsSaved(prevSaved);
        setSavesCount(prevCount);
        console.error('Save failed:', err);
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleOpenComments = () => {
    setShowComments((prev) => !prev);
  };

  const handleOpenLikers = useCallback(async () => {
    if (likesCount === 0 || isLikesHidden) return;
    setShowLikersModal(true);
    setLoadingLikers(true);
    try {
      const res = await userService.getPostLikers(postId);
      setLikers(res.likers || []);
    } catch (err) {
      console.error('Failed to load likers:', err);
      setLikers([]);
    } finally {
      setLoadingLikers(false);
    }
  }, [isLikesHidden, likesCount, postId]);

  const handleCopyLink = () => {
    const shareUrl = getShareUrl(`post/${postId}`);
    navigator.clipboard?.writeText?.(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);

    if (!isGuest) {
      userService.sharePost(postId).then((res) => {
        if (res.sharesCount !== undefined) {
          setSharesCount(res.sharesCount);
          if (res.post) onPostUpdate?.(postId, res.post);
        }
      }).catch(() => { });
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const updatedPostData = {
      content: editContent,
      images: editImageUrl ? [editImageUrl] : undefined,
      video: editVideoUrl ? {
        thumbnail: editVideoUrl,
        duration: post.video?.duration || '0:45',
        title: post.video?.title || 'Updated Video Clip.mp4',
      } : undefined,
    };
    onEditPost?.(postId, updatedPostData);
    setShowEditModal(false);
  };

  const handleConfirmDelete = () => {
    onDeletePost?.(postId);
    setShowDeleteModal(false);
  };

  const renderFormattedContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return (
          <span key={idx} className="text-brand-600 dark:text-cyan-400 font-semibold cursor-pointer hover:underline">
            {part}{' '}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <article ref={cardRef} className="post-card glass-panel rounded-xl sm:rounded-2xl p-3.5 sm:p-5 mb-3.5 sm:mb-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm sm:shadow-md dark:shadow-xl shadow-slate-200/50 dark:shadow-black/30 hover:border-slate-300 dark:hover:border-slate-700">
      {/* Post Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 cursor-pointer group" onClick={handleUserClick}>
          <Avatar src={post.user?.avatar || post.user?.profileImage} alt={post.user?.name} size="md" className="!w-8 !h-8 sm:!w-10 sm:!h-10 group-hover:scale-105 transition-transform" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                {post.user?.name || post.user?.fullName || 'User'}
              </h3>
              {post.user?.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
              <span
                className="inline-flex items-center text-slate-400 dark:text-slate-500 ml-0.5"
                title={
                  post.audience === 'private'
                    ? 'Only Me (Private)'
                    : post.audience === 'followers'
                      ? 'Followers Only'
                      : 'Public'
                }
              >
                {post.audience === 'private' ? (
                  <IconLock className="w-3.5 h-3.5" />
                ) : post.audience === 'followers' ? (
                  <IconUsers className="w-3.5 h-3.5" />
                ) : (
                  <IconGlobe className="w-3.5 h-3.5" />
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
              <p className="text-slate-400 dark:text-slate-500 flex-shrink-0">{post.timeAgo || 'Just now'}</p>
            </div>
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg sm:rounded-xl transition-colors cursor-pointer"
            aria-label="Post Options"
          >
            <IconDots className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-9 sm:top-10 z-20 w-44 sm:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 text-xs font-medium animate-fadeIn">
              {isOwner && (
                <>
                  <button
                    onClick={() => { setShowEditModal(true); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Post</span>
                  </button>
                  <button
                    onClick={() => { setShowDeleteModal(true); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Post</span>
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                </>
              )}
              <button
                onClick={() => { handleSaveToggle(); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <IconBookmark className="w-3.5 h-3.5 text-brand-500" />
                <span>{isSaved ? 'Unsave Post' : 'Save Post'}</span>
              </button>
              <button
                onClick={() => { setShowShareModal(true); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <IconShare className="w-3.5 h-3.5 text-brand-500" />
                <span>Share Link</span>
              </button>
              {!isOwner && (
                <button
                  onClick={() => {
                    setReportTarget({ type: 'post', id: post.id || post._id, label: 'Post' });
                    if (isGuest) { onRequireAuth?.(); setShowMenu(false); return; }
                    setShowReportModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <span>Report Post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text */}
      <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed mb-3 sm:mb-4 whitespace-pre-line font-normal">
        {renderFormattedContent(post.content)}
      </div>

      {/* Post Media Images */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-1.5 sm:gap-2 mb-3 sm:mb-4 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
          }`}>
          {post.images.map((img, idx) => (
            <div
              key={`${postId}-img-${idx}`}
              className={`post-image-container ${
                post.images.length > 1 ? 'post-image-container--grid' : 'post-image-container--single'
              }`}
            >
              {!loadedImages.has(idx) && !brokenImages.has(idx) && (
                <div className="absolute inset-0 z-[1] skeleton-shimmer bg-slate-200 dark:bg-slate-800" aria-hidden />
              )}
              <button type="button" onClick={() => openImageViewer(idx)} className="absolute inset-0 w-full h-full block cursor-pointer">
                {brokenImages.has(idx) ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-900 text-slate-400 text-xs font-medium">
                    Image unavailable
                  </div>
                ) : (
                  <img
                    src={img}
                    alt={`Post media ${idx}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: 1, visibility: 'visible' }}
                    loading="lazy"
                    decoding="async"
                    ref={(el) => {
                      if (el && el.complete && el.naturalWidth > 0 && !loadedImages.has(idx)) {
                        setLoadedImages((prev) => {
                          if (prev.has(idx)) return prev;
                          const next = new Set(prev);
                          next.add(idx);
                          return next;
                        });
                      }
                    }}
                    onLoad={() => setLoadedImages((prev) => new Set(prev).add(idx))}
                    onError={() => setBrokenImages((prev) => new Set(prev).add(idx))}
                  />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inline feed video — plays in place, no popup */}
      {feedVideoUrl && (
        <FeedVideoPlayer postId={postId} videoUrl={feedVideoUrl} thumbUrl={feedVideoThumb} />
      )}

      {/* Post Metrics Stats Bar */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 py-2 sm:py-2.5 border-t border-b border-slate-200/80 dark:border-slate-800/60 mb-2.5 sm:mb-3">
        <div className="flex items-center gap-2.5 sm:gap-4">
          {isLikesHidden ? (
            isLiked ? (
              <span className="text-rose-500/90 font-medium">You liked this</span>
            ) : null
          ) : (
            <button
              type="button"
              onClick={handleOpenLikers}
              className={`hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${likesCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
              title={likesCount > 0 ? 'View likers' : undefined}
            >
              <strong className="text-slate-900 dark:text-slate-100 font-bold">{likesCount}</strong>{' '}
              {likesCount === 1 ? 'like' : 'likes'}
            </button>
          )}

          {showCommentButton || comments.length > 0 ? (
            <button
              type="button"
              onClick={handleOpenComments}
              className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer font-medium"
            >
              {showComments ? 'Hide comments' : (comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}` : '0 comments')}
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2.5 sm:gap-4">
          <span><strong className="text-slate-900 dark:text-slate-100">{sharesCount}</strong> shares</span>
          <span><strong className="text-slate-900 dark:text-slate-100">{savesCount}</strong> saved</span>
        </div>
      </div>

      {/* Post Action Buttons */}
      <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs font-semibold">
        <button
          onClick={handleLikeToggle}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all cursor-pointer ${isLiked
            ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          aria-pressed={isLiked}
        >
          <IconHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4" filled={isLiked} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        {showCommentButton && (
          <button
            onClick={handleOpenComments}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all cursor-pointer ${showComments
              ? 'text-brand-600 dark:text-cyan-400 bg-brand-50 dark:bg-brand-950/40'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            aria-pressed={showComments}
          >
            <IconComment className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{showComments ? 'Hide' : 'Comment'}</span>
          </button>
        )}

        <button
          onClick={() => guardAction(() => setShowShareModal(true))}
          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer"
        >
          <IconShare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Share</span>
        </button>

        <button
          onClick={handleSaveToggle}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all cursor-pointer ${isSaved
            ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
        >
          {isSaved ? <IconBookmarkFill className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <IconBookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      <PostCommentsSection
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={postId}
        postAuthorId={postOwnerId}
        comments={comments}
        currentUser={user}
        isGuest={isGuest}
        canComment={canUserComment}
        onRequireAuth={onRequireAuth}
        onPostUpdate={(id, updated) => {
          if (updated?.comments) setComments(updated.comments);
          onPostUpdate?.(id, updated);
        }}
      />

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Post">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">Copy link to share this post with friends or external platforms.</p>
          <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <input
              type="text"
              readOnly
              value={getShareUrl(`post/${postId}`)}
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-200 outline-none px-2 truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0 cursor-pointer"
            >
              {copiedLink ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Post Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Post">
        <form onSubmit={handleSaveEdit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Caption / Content</label>
            <textarea
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 bg-slate-100 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500 resize-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Image URL (Optional)</label>
            <input
              type="text"
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Video Thumbnail URL (Optional)</label>
            <input
              type="text"
              value={editVideoUrl}
              onChange={(e) => setEditVideoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Post">
        <div className="space-y-4 text-center sm:text-left">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
              Delete Post
            </Button>
          </div>
        </div>
      </Modal>

      <LikersModal
        isOpen={showLikersModal}
        onClose={() => setShowLikersModal(false)}
        likers={likers}
        loading={loadingLikers}
      />

      <PostMediaViewer
        isOpen={mediaViewerOpen && mediaViewerType === 'image'}
        onClose={() => setMediaViewerOpen(false)}
        post={post}
        initialIndex={mediaViewerIndex}
        mediaType="image"
        user={user}
        isGuest={isGuest}
        onRequireAuth={onRequireAuth}
        onPostUpdate={onPostUpdate}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType={reportTarget.type}
        targetId={reportTarget.id}
        targetLabel={reportTarget.label}
      />
    </article>
  );
}, (prevProps, nextProps) => {
  const prev = prevProps.post;
  const next = nextProps.post;
  const prevId = String(prev.id || prev._id);
  const nextId = String(next.id || next._id);
  if (prevId !== nextId) return false;

  return (
    prev.content === next.content &&
    prev.videoUrl === next.videoUrl &&
    prev.thumbnailUrl === next.thumbnailUrl &&
    prev.likesCount === next.likesCount &&
    prev.commentsCount === next.commentsCount &&
    prev.sharesCount === next.sharesCount &&
    prev.savesCount === next.savesCount &&
    prev.isLiked === next.isLiked &&
    prev.isSaved === next.isSaved &&
    JSON.stringify(prev.images || []) === JSON.stringify(next.images || []) &&
    JSON.stringify(prev.video || null) === JSON.stringify(next.video || null) &&
    JSON.stringify(prev.media || null) === JSON.stringify(next.media || null) &&
    (prev.comments?.length ?? 0) === (next.comments?.length ?? 0) &&
    prevProps.isGuest === nextProps.isGuest &&
    prevProps.user?.id === nextProps.user?.id
  );
});
