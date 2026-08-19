import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PostCard } from '../feed/PostCard';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { PostMediaViewer } from '../media/PostMediaViewer';
import { IconPlay, IconHeart, IconComment, IconSparkles, IconPlus } from '../ui/Icons';

export const PostGrid = ({
  posts = [],
  reels = [],
  activeTab = 'posts',
  user,
  isGuest,
  onRequireAuth,
  onEditPost,
  onDeletePost,
  onPostUpdate,
  onCreatePost,
  isOwner = false,
}) => {
  const [mediaViewer, setMediaViewer] = useState(null);
  const navigate = useNavigate();

  const videoItems = reels.length
    ? reels.map((reel) => ({
        id: `${reel.id}_reel`,
        video: reel.video || {
          thumbnail: reel.thumbnailUrl || reel.video?.thumbnail || '',
          title: reel.content?.slice(0, 40) || 'Reel',
          duration: '0:30',
        },
        post: reel,
      }))
    : posts
        .filter((post) => post.video || post.isReel || post.videoUrl)
        .map((post) => ({
          id: `${post.id}_vid`,
          video: post.video || {
            thumbnail: post.video?.thumbnail || post.thumbnailUrl || '',
            title: post.content?.slice(0, 40) || 'Video',
            duration: '0:30',
          },
          post,
        }));

  const photoItems = posts.flatMap((post) =>
    (post.images || []).map((img, idx) => ({
      id: `${post.id}_img_${idx}`,
      url: img,
      imageIndex: idx,
      post,
    }))
  );

  const savedPosts = posts.filter((post) => post.isSaved);

  const openReel = (item) => {
    const postId = item.post?.id || item.post?._id;
    if (postId) {
      navigate(`/feed?tab=videos&reel=${postId}`);
      return;
    }
    setMediaViewer({ post: item.post, index: 0, type: 'video' });
  };

  if (activeTab === 'posts') {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Owner Quick Create Post Bar without the button */}
        {isOwner && (
          <div
            onClick={onCreatePost}
            className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3 cursor-pointer hover:border-brand-500/40 dark:hover:border-cyan-500/40 transition-all hover:shadow-md"
          >
            <Avatar src={user?.avatar} size="sm" />
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium select-none truncate flex-1">
              What's on your mind? Share a post...
            </span>
          </div>
        )}

        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              isGuest={isGuest}
              onRequireAuth={onRequireAuth}
              onEditPost={onEditPost}
              onDeletePost={onDeletePost}
              onPostUpdate={onPostUpdate}
            />
          ))
        ) : (
          <div className="glass-panel p-8 text-center rounded-3xl border border-slate-200 dark:border-slate-800">
            <IconSparkles className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No posts published yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Posts created by this user will appear here.</p>
            {isOwner && (
              <Button variant="primary" size="sm" onClick={onCreatePost} className="mt-4">
                Create First Post
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'photos') {
    return (
      <>
        {photoItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 animate-fadeIn">
            {photoItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setMediaViewer({ post: item.post, index: item.imageIndex, type: 'image' })}
                className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer group shadow-sm"
              >
                <img src={item.url} alt="Photo item" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs">
                  {isOwner && (
                    <span className="flex items-center gap-1"><IconHeart className="w-4 h-4" /> {item.post.likesCount}</span>
                  )}
                  <span className="flex items-center gap-1"><IconComment className="w-4 h-4" /></span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 text-center rounded-3xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No photos found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Photo uploads will be listed here.</p>
          </div>
        )}

        <PostMediaViewer
          isOpen={!!mediaViewer}
          onClose={() => setMediaViewer(null)}
          post={mediaViewer?.post}
          initialIndex={mediaViewer?.index || 0}
          mediaType={mediaViewer?.type || 'image'}
          user={user}
          isGuest={isGuest}
          onRequireAuth={onRequireAuth}
          onPostUpdate={onPostUpdate}
        />
      </>
    );
  }

  if (activeTab === 'videos') {
    return (
      <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 animate-fadeIn max-w-md sm:max-w-none">
        {videoItems.length > 0 ? (
          videoItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => openReel(item)}
              className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 aspect-[9/16] group shadow-md w-full cursor-pointer"
            >
              <img src={item.video.thumbnail} alt={item.video.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30" />
              <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-lg pointer-events-none">
                <IconPlay className="w-5 h-5 ml-0.5" />
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                <span className="font-semibold truncate max-w-[180px]">{item.video.title}</span>
                <span className="px-2 py-0.5 bg-black/60 rounded text-[10px] font-mono">{item.video.duration}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full glass-panel p-8 text-center rounded-3xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No reels yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Uploaded reels appear here.</p>
          </div>
        )}
      </div>
      <PostMediaViewer
        isOpen={!!mediaViewer}
        onClose={() => setMediaViewer(null)}
        post={mediaViewer?.post}
        initialIndex={0}
        mediaType={mediaViewer?.type || 'video'}
        user={user}
        isGuest={isGuest}
        onRequireAuth={onRequireAuth}
        onPostUpdate={onPostUpdate}
      />
      </>
    );
  }

  if (activeTab === 'saved') {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fadeIn">
        {savedPosts.length > 0 ? (
          savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              isGuest={isGuest}
              onRequireAuth={onRequireAuth}
              onEditPost={onEditPost}
              onDeletePost={onDeletePost}
              onPostUpdate={onPostUpdate}
            />
          ))
        ) : (
          <div className="glass-panel p-8 text-center rounded-3xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No saved posts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Posts you save will be kept here for quick reference.</p>
          </div>
        )}
      </div>
    );
  }

  return null;
};
