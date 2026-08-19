import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import {
  IconImage,
  IconVideo,
  IconClose,
  IconSparkles,
  IconCheck,
  IconLock,
  IconUsers,
  IconGlobe,
} from '../ui/Icons';
import {
  EmojiHeart,
  EmojiFlame,
  EmojiClap,
  EmojiHeartEyes,
  EmojiSparkles,
  EmojiCelebrate,
} from '../ui/EmojiIcons';
import { uploadService } from '../../services/uploadService';

const TRENDING_TAGS = ['#tech', '#developer', '#social', '#trending', '#coding', '#design', '#innovation'];

const EMOJI_LIST = [
  '🚀', '🔥', '✨', '💻', '🎨', '❤️', '🙌', '💡', '⚡', '🎉',
  '🌟', '🎯', '😍', '👏', '💯', '🤩', '☕', '🧠', '💼', '🏆',
  '✌️', '💪', '🤝', '🥳'
];

const AUDIENCE_OPTIONS = [
  {
    id: 'public',
    label: 'Anyone (Public)',
    description: 'Anyone on or off the platform',
    Icon: IconGlobe,
    iconColor: 'text-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/20',
  },
  {
    id: 'followers',
    label: 'Followers Only',
    description: 'Only your active followers',
    Icon: IconUsers,
    iconColor: 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20',
  },
  {
    id: 'private',
    label: 'Only Me',
    description: 'Only visible to you',
    Icon: IconLock,
    iconColor: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20',
  },
];

export const CreatePost = ({
  onPostCreated,
  isModalOpen,
  setIsModalOpen,
  user,
  isGuest,
  onRequireAuth,
  showInlineBar = true,
  initialMediaType = null,
}) => {
  const [postText, setPostText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  const [audience, setAudience] = useState('public'); // 'public' | 'followers' | 'private'
  const [isDragOver, setIsDragOver] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textareaRef = useRef(null);
  const audienceMenuRef = useRef(null);

  useEffect(() => {
    if (!isModalOpen || !initialMediaType) return;
    const timer = setTimeout(() => {
      if (initialMediaType === 'image') imageInputRef.current?.click();
      if (initialMediaType === 'video') videoInputRef.current?.click();
    }, 350);
    return () => clearTimeout(timer);
  }, [isModalOpen, initialMediaType]);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [isModalOpen]);

  // Click outside to dismiss audience menu
  useEffect(() => {
    const handleAudienceClickOutside = (e) => {
      if (audienceMenuRef.current && !audienceMenuRef.current.contains(e.target)) {
        setShowAudienceMenu(false);
      }
    };
    if (showAudienceMenu) {
      document.addEventListener('pointerdown', handleAudienceClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleAudienceClickOutside);
    };
  }, [showAudienceMenu]);

  const guardAction = (callback) => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    callback();
  };

  const processFile = (file, type) => {
    if (!file) return;

    if (type === 'image' && !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadError('Please select a valid image (JPG, PNG, WEBP, GIF).');
      return;
    }
    if (type === 'video' && !['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type)) {
      setUploadError('Please select a valid video (MP4, MOV, WEBM).');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setUploadError('File size exceeds 100MB limit.');
      return;
    }

    setUploadError('');
    setSelectedFile(file);
    setMediaType(type);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    processFile(file, type);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    processFile(file, type);
  };

  const handleClearMedia = () => {
    setSelectedFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadProgress(0);
    setUploadError('');
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleAddEmoji = (emoji) => {
    setPostText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleAddHashtag = (tag) => {
    setPostText((prev) => (prev ? `${prev} ${tag}` : tag));
    textareaRef.current?.focus();
  };

  const handlePublish = async () => {
    if (!postText.trim() && !selectedFile) return;

    let mediaData = null;

    if (selectedFile) {
      setUploading(true);
      setUploadProgress(0);
      setUploadError('');

      try {
        const uploadRes = await uploadService.uploadSingle(selectedFile, 'posts', (percent) => {
          setUploadProgress(percent);
        });

        mediaData = uploadRes.data || uploadRes;
      } catch (err) {
        console.error('Failed uploading media to Cloudinary:', err);
        setUploadError(err.message || 'Failed to upload media.');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const secureUrl = mediaData?.secure_url || mediaData?.url;
    const publicId = mediaData?.public_id || mediaData?.publicId;

    const postPayload = {
      content: postText.trim(),
      images: mediaType === 'image' && secureUrl ? [secureUrl] : undefined,
      imageUrl: mediaType === 'image' ? secureUrl : undefined,
      imagePublicId: mediaType === 'image' ? publicId : undefined,
      videoUrl: mediaType === 'video' ? secureUrl : undefined,
      videoPublicId: mediaType === 'video' ? publicId : undefined,
      audience,
      media: secureUrl
        ? [
            {
              url: secureUrl,
              publicId: publicId,
              resourceType: mediaType || 'image',
            },
          ]
        : [],
      video:
        mediaType === 'video' && secureUrl
          ? {
              url: secureUrl,
              publicId: publicId,
              thumbnail: secureUrl,
              duration: '0:30',
              title: selectedFile?.name || 'Uploaded Video Clip',
            }
          : undefined,
    };

    onPostCreated?.(postPayload);
    setPostText('');
    handleClearMedia();
    setIsModalOpen(false);

    if (typeof window !== 'undefined' && window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const openModal = () => guardAction(() => setIsModalOpen(true));

  const currentAvatar =
    user?.avatar ||
    user?.profileImage ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
  const currentName = user?.name || user?.fullName || 'User';
  const currentHandle = user?.handle || (user?.username ? `@${user.username}` : '@user');
  const currentTitle = user?.title ? user.title : 'Creator';

  const currentAudienceObj = AUDIENCE_OPTIONS.find((a) => a.id === audience) || AUDIENCE_OPTIONS[0];
  const CurrentAudienceIcon = currentAudienceObj.Icon;

  const charPercent = Math.min(100, (postText.length / 1000) * 100);

  return (
    <>
      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'video')}
      />

      {/* Feed Inline Post Bar */}
      {showInlineBar && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-4 border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-xl transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center gap-3">
            <Avatar
              src={currentAvatar}
              alt={currentName}
              size="md"
              online={!isGuest}
              className="!w-10 !h-10 ring-2 ring-brand-500/20"
            />
            <button
              type="button"
              onClick={openModal}
              className="flex-1 text-left px-4 py-3 bg-slate-100/90 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs sm:text-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/50 dark:hover:border-cyan-500/50 transition-all cursor-pointer shadow-inner truncate"
            >
              {isGuest
                ? 'Sign in to share your thoughts...'
                : `What's on your mind, ${currentName ? currentName.split(' ')[0] : 'there'}?`}
            </button>
          </div>

          <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() =>
                  guardAction(() => {
                    setIsModalOpen(true);
                    setTimeout(() => imageInputRef.current?.click(), 100);
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <IconImage className="w-4 h-4" />
                <span>Photo</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  guardAction(() => {
                    setIsModalOpen(true);
                    setTimeout(() => videoInputRef.current?.click(), 100);
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <IconVideo className="w-4 h-4" />
                <span>Video</span>
              </button>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Create Post
            </button>
          </div>
        </div>
      )}

      {/* State-of-the-Art Create Post Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Post" maxWidth="max-w-xl">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="space-y-3 sm:space-y-4"
        >
          {/* Header Profile & Audience Control */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 pb-1">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <Avatar
                src={currentAvatar}
                alt={currentName}
                size="md"
                className="!w-9 !h-9 sm:!w-11 sm:!h-11 ring-2 ring-brand-500/30 rounded-full flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[110px] sm:max-w-[180px]">
                    {currentName}
                  </h4>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate max-w-[80px] sm:max-w-[140px]">
                    {currentHandle}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-brand-600 dark:text-cyan-400 truncate">
                  {currentTitle}
                </p>
              </div>
            </div>

            {/* Crisp Vector Audience Selector Dropdown */}
            <div className="relative flex-shrink-0" ref={audienceMenuRef}>
              <button
                type="button"
                onClick={() => setShowAudienceMenu(!showAudienceMenu)}
                className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs group"
              >
                <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${currentAudienceObj.iconColor}`}>
                  <CurrentAudienceIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                </div>
                <span className="truncate max-w-[85px] sm:max-w-none">{currentAudienceObj.label}</span>
                <span className="text-[8px] sm:text-[9px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">▾</span>
              </button>

              {showAudienceMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 w-48 sm:w-56 max-w-[calc(100vw-2rem)] rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl p-1.5 space-y-0.5 animate-fadeIn backdrop-blur-xl">
                  <div className="px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    Who can see your post?
                  </div>
                  {AUDIENCE_OPTIONS.map((opt) => {
                    const isSelected = audience === opt.id;
                    const OptIcon = opt.Icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setAudience(opt.id);
                          setShowAudienceMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg sm:rounded-xl transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-cyan-400 border border-brand-500/30 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-medium'
                        }`}
                      >
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center flex-shrink-0 ${opt.iconColor}`}>
                          <OptIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] sm:text-xs leading-tight">{opt.label}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5 truncate">{opt.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-3.5 h-3.5 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                            <IconCheck className="w-2 h-2 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Validation Error Alert */}
          {uploadError && (
            <div className="p-2.5 sm:p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-500 font-semibold flex items-center justify-between animate-fadeIn">
              <span className="truncate mr-2">⚠️ {uploadError}</span>
              <button
                onClick={() => setUploadError('')}
                className="p-1 hover:bg-rose-500/20 rounded-lg cursor-pointer flex-shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          {/* Text Input Area */}
          <div className="relative rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 p-2.5 sm:p-3.5 focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:bg-white dark:focus-within:bg-slate-950 transition-all shadow-inner">
            <textarea
              ref={textareaRef}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              maxLength={1000}
              disabled={uploading}
              placeholder="What's happening? Share your thoughts, project updates, or questions with the community..."
              rows={4}
              className="w-full bg-transparent text-xs sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
            />

            {/* Bottom Info inside input box */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50 mt-1 gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap overflow-hidden">
                {TRENDING_TAGS.slice(0, 4).map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddHashtag(tag)}
                    className="text-[10px] sm:text-[11px] font-medium text-brand-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <span
                  className={`text-[10px] sm:text-[11px] font-mono font-bold ${
                    postText.length > 900 ? 'text-rose-500' : 'text-slate-400'
                  }`}
                >
                  {postText.length}/1000
                </span>
                {/* Micro Circular Progress */}
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                  <div
                    className="absolute inset-0 bg-brand-500/40"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% ${charPercent}%, 0 ${charPercent}%)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Drag & Drop Visual Indicator / Dropzone */}
          {isDragOver && (
            <div className="p-6 sm:p-8 rounded-2xl border-2 border-dashed border-brand-500 bg-brand-500/10 text-center animate-pulse">
              <p className="text-xs sm:text-sm font-bold text-brand-600 dark:text-cyan-400">
                Drop your photo or video here to upload!
              </p>
            </div>
          )}

          {/* Selected Media Preview & Upload Progress */}
          {mediaPreview && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-950 shadow-xl max-h-56 sm:max-h-72">
              {mediaType === 'image' ? (
                <img
                  src={mediaPreview}
                  alt="Selected upload preview"
                  className="w-full h-full max-h-56 sm:max-h-72 object-contain bg-slate-900"
                />
              ) : (
                <video src={mediaPreview} controls className="w-full max-h-56 sm:max-h-72 object-contain bg-slate-900" />
              )}

              {/* Uploading Progress Overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-4 z-20">
                  <div className="w-full max-w-xs bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/20">
                    <div
                      className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-brand-600 h-full transition-all duration-300 shadow-md shadow-cyan-400/50"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white tracking-wide">
                    Uploading media... {uploadProgress}%
                  </span>
                </div>
              )}

              {/* Remove Media Button */}
              {!uploading && (
                <button
                  type="button"
                  onClick={handleClearMedia}
                  className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full bg-slate-900/85 hover:bg-rose-600 text-white transition-colors cursor-pointer z-10 shadow-lg border border-white/20 active:scale-95"
                  title="Remove media"
                >
                  <IconClose className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          )}

          {/* Emoji Popover Grid */}
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-2"
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Emojis
                </span>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                {EMOJI_LIST.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="p-1.5 sm:p-2 text-base sm:text-lg hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-transform hover:scale-125 active:scale-95 cursor-pointer flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Bottom Action Toolbar & Publish Button */}
          <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-200/80 dark:border-slate-800/80 gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all active:scale-95 cursor-pointer text-xs font-bold"
                title="Add Image"
              >
                <IconImage className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Photo</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all active:scale-95 cursor-pointer text-xs font-bold"
                title="Add Video"
              >
                <IconVideo className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Video</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all active:scale-95 cursor-pointer text-xs font-bold"
                title="Add Emoji"
              >
                <EmojiHeartEyes className="w-4 h-4" />
                <span className="hidden sm:inline">Emoji</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePublish}
              disabled={(!postText.trim() && !selectedFile) || uploading}
              className={`px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-md flex-shrink-0 ${
                (!postText.trim() && !selectedFile) || uploading
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {uploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{uploadProgress}%</span>
                </>
              ) : (
                <>
                  <span>Publish</span>
                  <IconSparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CreatePost;
