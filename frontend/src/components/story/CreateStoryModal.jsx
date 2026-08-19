import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconClose, IconSparkles, IconImage, IconSend } from '../ui/Icons';
import { Avatar } from '../ui/Avatar';

const PRESET_GRADIENTS = [
  { id: 'grad1', name: 'Sunset Glow', css: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600' },
  { id: 'grad2', name: 'Cyber Neon', css: 'bg-gradient-to-tr from-cyan-500 via-brand-600 to-fuchsia-600' },
  { id: 'grad3', name: 'Deep Space', css: 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-900' },
  { id: 'grad4', name: 'Emerald Aurora', css: 'bg-gradient-to-tr from-emerald-400 via-teal-600 to-cyan-700' },
  { id: 'grad5', name: 'Royal Violet', css: 'bg-gradient-to-tr from-purple-700 via-pink-600 to-rose-500' },
];

const PRESET_PHOTOS = [
  { id: 'p1', title: 'Ocean Waves', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
  { id: 'p2', title: 'City Lights', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80' },
  { id: 'p3', title: 'Mountain Mist', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80' },
  { id: 'p4', title: 'Abstract Art', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' },
];

export const CreateStoryModal = ({ isOpen, onClose, onStoryCreated, user }) => {
  const [activeTab, setActiveTab] = useState('gradient'); // 'gradient' | 'photo' | 'upload'
  const [selectedGradient, setSelectedGradient] = useState(PRESET_GRADIENTS[0].css);
  const [selectedPhoto, setSelectedPhoto] = useState(PRESET_PHOTOS[0].url);
  const [uploadedImage, setUploadedImage] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size should be under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result || '');
      setActiveTab('upload');
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const getActiveMediaUrl = () => {
    if (activeTab === 'upload' && uploadedImage) return uploadedImage;
    if (activeTab === 'photo') return selectedPhoto;
    return '';
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const mediaUrl = getActiveMediaUrl();
      const payload = {
        media: mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        mediaType: 'image',
        caption: caption.trim(),
        bgGradient: activeTab === 'gradient' ? selectedGradient : '',
      };

      await onStoryCreated(payload);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Failed to create story:', err);
      setErrorMsg('Could not publish story. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto theme-modal-backdrop">
        {/* Backdrop Close Click */}
        <div className="absolute inset-0 z-0 cursor-pointer" onClick={onClose} />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* LEFT SIDE: Live 9:16 Story Preview Frame */}
          <div className="w-full md:w-1/2 p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 relative">
            <div className="text-center mb-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 flex items-center justify-center gap-1">
                <IconSparkles className="w-3 h-3" /> Live Mobile Story Preview
              </span>
            </div>

            {/* Story Mobile Device Frame */}
            <div className="relative w-56 sm:w-64 h-[380px] sm:h-[430px] rounded-[2.5rem] overflow-hidden border-4 border-slate-800 shadow-2xl shadow-black/80 flex flex-col justify-between p-3 select-none">
              
              {/* Background Layer */}
              {activeTab === 'gradient' ? (
                <div className={`absolute inset-0 ${selectedGradient} transition-all duration-500`} />
              ) : getActiveMediaUrl() ? (
                <img
                  src={getActiveMediaUrl()}
                  alt="Story preview"
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-600 text-xs">
                  Select background media
                </div>
              )}

              {/* Dark Gradient Overlay for text contrast */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

              {/* Progress bar mock */}
              <div className="relative z-20 w-full h-1 bg-white/30 rounded-full overflow-hidden mb-2">
                <div className="w-3/4 h-full bg-white rounded-full" />
              </div>

              {/* User Header */}
              <div className="relative z-20 flex items-center gap-2">
                <Avatar src={user?.avatar} size="xs" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white leading-tight truncate drop-shadow">
                    {user?.name || 'Your Story'}
                  </p>
                  <p className="text-[9px] text-slate-300 drop-shadow">Just now</p>
                </div>
              </div>

              {/* Caption Overlay */}
              <div className="relative z-20 my-auto text-center px-3">
                {caption.trim() ? (
                  <p className="text-xs sm:text-sm font-semibold text-white bg-black/40 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-lg inline-block break-words max-w-full">
                    {caption}
                  </p>
                ) : (
                  <p className="text-[11px] text-white/50 italic">Your caption will appear here...</p>
                )}
              </div>

              {/* Bottom Quick Reply Mock */}
              <div className="relative z-20 w-full px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[10px] text-white/60">
                Reply to story...
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Customization Controls */}
          <div className="w-full md:w-1/2 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Create New Story
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Share moments that disappear in 24 hours.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
                >
                  <IconClose className="w-5 h-5" />
                </button>
              </div>

              {/* Type Switcher Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-5 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('gradient')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    activeTab === 'gradient'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Gradients
                </button>
                <button
                  onClick={() => setActiveTab('photo')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    activeTab === 'photo'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  HD Photos
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    activeTab === 'upload'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Upload File
                </button>
              </div>

              {/* Content Selection Panels */}
              {activeTab === 'gradient' && (
                <div className="space-y-2 mb-5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Choose Background Gradient
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_GRADIENTS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGradient(g.css)}
                        className={`h-12 rounded-xl ${g.css} border-2 transition-all ${
                          selectedGradient === g.css
                            ? 'border-white ring-2 ring-brand-500 scale-105 shadow-md'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        title={g.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'photo' && (
                <div className="space-y-2 mb-5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Choose Curated HD Wallpaper
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_PHOTOS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPhoto(p.url)}
                        className={`h-16 rounded-xl overflow-hidden relative border-2 transition-all ${
                          selectedPhoto === p.url
                            ? 'border-brand-500 ring-2 ring-brand-500/50 scale-105'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="space-y-2 mb-5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Upload Custom Image
                  </label>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-brand-500 transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                    <IconImage className="w-7 h-7 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Click to choose image file
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 10MB</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {/* Caption Input */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Story Text / Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a message for your story..."
                  maxLength={250}
                  rows={3}
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
                <div className="flex justify-end text-[10px] text-slate-400">
                  {caption.length} / 250
                </div>
              </div>

              {errorMsg && <p className="text-xs text-rose-500 font-medium mb-3">{errorMsg}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-purple to-brand-cyan hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                ) : (
                  <>
                    <IconSend className="w-4 h-4" /> Publish Story
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
