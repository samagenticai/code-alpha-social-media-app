import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconClose, IconVideo, IconLocation } from '../ui/Icons';
import { Button } from '../ui/Button';
import { uploadService } from '../../services/uploadService';
import { userService } from '../../services/userService';

const ACCEPTED = ['video/mp4', 'video/quicktime', 'video/webm'];
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', desc: 'Anyone can view' },
  { value: 'followers', label: 'Followers', desc: 'Only your followers' },
  { value: 'private', label: 'Private', desc: 'Only you' },
];

export const CreateReelModal = ({ isOpen, onClose, onPublished, onUpdated, currentUser, editReel = null }) => {
  const isEdit = Boolean(editReel);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && editReel) {
      setCaption(editReel.caption || editReel.content || '');
      setLocation(editReel.location || '');
      setHashtags((editReel.hashtags || []).map((t) => `#${t}`).join(' '));
      setVisibility(editReel.visibility || 'public');
      setPreviewUrl(editReel.videoUrl || editReel.video?.url || '');
    }
  }, [isOpen, editReel]);

  const reset = () => {
    setCaption('');
    setLocation('');
    setHashtags('');
    setVisibility('public');
    setFile(null);
    if (previewUrl && !isEdit) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setUploadProgress(0);
    setPublishing(false);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED.includes(selected.type) && !selected.type.startsWith('video/')) {
      setError('Please select MP4, MOV, or WEBM.');
      return;
    }

    if (selected.size > 100 * 1024 * 1024) {
      setError('Video must be under 100MB.');
      return;
    }

    setError('');
    setFile(selected);
    if (previewUrl && !isEdit) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handlePublish = async () => {
    if (publishing) return;
    if (!isEdit && !file) return;

    setPublishing(true);
    setError('');

    try {
      if (isEdit) {
        const res = await userService.updateReel(editReel.id || editReel._id, {
          caption: caption.trim(),
          location: location.trim(),
          hashtags,
          visibility,
        });
        if (res.success && res.reel) {
          onUpdated?.(res.reel);
          handleClose();
        }
        return;
      }

      const uploadRes = await uploadService.uploadSingle(file, 'reels', setUploadProgress);
      const data = uploadRes.data || uploadRes;
      const videoUrl = data.secure_url || data.url;
      const videoPublicId = data.public_id || data.publicId;

      if (!videoUrl || !videoPublicId) {
        throw new Error('Upload did not return video URL.');
      }

      const thumbUrl = videoUrl
        .replace('/upload/', '/upload/so_0/')
        .replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg');

      const res = await userService.createReel({
        caption: caption.trim(),
        location: location.trim(),
        hashtags,
        visibility,
        videoUrl,
        videoPublicId,
        thumbnailUrl: thumbUrl,
      });

      if (res.success && res.reel) {
        onPublished?.(res.reel);
        handleClose();
      } else {
        throw new Error('Failed to publish reel.');
      }
    } catch (err) {
      console.error('Reel save failed:', err);
      setError(err.response?.data?.message || err.message || 'Something went wrong.');
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] theme-modal-backdrop flex items-end sm:items-center justify-center cursor-pointer"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] bg-white dark:bg-slate-950 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden safe-bottom"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Edit Reel' : 'Create Reel'}
            </h3>
            <button type="button" onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <IconClose className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!isEdit && (
              <>
                {previewUrl ? (
                  <div className="relative aspect-[9/16] max-h-[min(360px,45vh)] mx-auto rounded-2xl overflow-hidden bg-black ring-1 ring-slate-200 dark:ring-slate-800">
                    <video src={previewUrl} className="w-full h-full object-contain" controls playsInline muted />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full aspect-[9/16] max-h-[min(320px,40vh)] mx-auto rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-brand-500 hover:text-brand-500 transition-colors touch-manipulation"
                  >
                    <IconVideo className="w-12 h-12" />
                    <span className="text-sm font-bold">Tap to select video</span>
                    <span className="text-xs px-3 text-center">MP4 · MOV · WEBM · max 100MB</span>
                  </button>
                )}
                <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/*" className="hidden" onChange={handleFileChange} />
                {file && !publishing && (
                  <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-semibold text-brand-600 dark:text-cyan-400">
                    Change video
                  </button>
                )}
              </>
            )}

            {isEdit && previewUrl && (
              <div className="aspect-[9/16] max-h-[200px] mx-auto rounded-xl overflow-hidden bg-black">
                <video src={previewUrl} className="w-full h-full object-contain" muted playsInline />
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                maxLength={2200}
                className="mt-1.5 w-full bg-slate-100 dark:bg-slate-900 border-0 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/50 outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Location (optional)</label>
              <div className="relative mt-1.5">
                <IconLocation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add a location"
                  maxLength={120}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-0 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/50 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hashtags (optional)</label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#synora #creative #vibes"
                className="mt-1.5 w-full bg-slate-100 dark:bg-slate-900 border-0 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/50 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Visibility</label>
              <div className="grid grid-cols-3 gap-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={`p-2.5 rounded-xl text-left border transition-all touch-manipulation ${
                      visibility === opt.value
                        ? 'border-brand-500 bg-brand-500/10 dark:bg-cyan-500/10 ring-1 ring-brand-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white">{opt.label}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {uploadProgress > 0 && publishing && !isEdit && uploadProgress < 100 && (
              <div className="space-y-1">
                <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 text-center">Uploading {uploadProgress}%</p>
              </div>
            )}

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
          </div>

          <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 safe-bottom">
            <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={publishing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handlePublish}
              disabled={(!isEdit && !file) || publishing}
            >
              {publishing
                ? isEdit ? 'Saving...' : uploadProgress < 100 ? 'Uploading...' : 'Publishing...'
                : isEdit ? 'Save Changes' : 'Publish Reel'}
            </Button>
          </div>

          {currentUser && !isEdit && (
            <p className="text-[10px] text-center text-slate-400 pb-3 px-4">
              Publishing as @{currentUser.username || currentUser.handle?.replace('@', '')}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
