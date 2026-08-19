import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadService } from '../../services/uploadService';
import { userService } from '../../services/userService';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

const TAB_MAP = { general: 'general', bio: 'bio', photos: 'photos', media: 'photos' };

export const EditProfileModal = ({
  isOpen,
  onClose,
  userProfile,
  onSave,
  initialFocusSection = 'general',
  profileUpdateFn,
  includePhone = false,
}) => {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    title: '',
    bio: '',
    location: '',
    phone: '',
    avatar: '',
    profileImagePublicId: '',
    coverImage: '',
    coverImagePublicId: '',
  });

  const [activeTab, setActiveTab] = useState('general');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [avatarPendingFile, setAvatarPendingFile] = useState(null);
  const [coverPendingFile, setCoverPendingFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const bioRef = useRef(null);

  const autoResizeBio = () => {
    const el = bioRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  useEffect(() => {
    if (userProfile && isOpen) {
      const cleanUsername = (userProfile.username || userProfile.handle || '').replace('@', '').toLowerCase();
      setForm({
        name: userProfile.name || userProfile.fullName || '',
        username: cleanUsername,
        email: userProfile.email || '',
        title: userProfile.title || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        phone: userProfile.phone || '',
        avatar: userProfile.avatar || userProfile.profileImage || '',
        profileImagePublicId: userProfile.profileImagePublicId || '',
        coverImage: userProfile.coverImage || '',
        coverImagePublicId: userProfile.coverImagePublicId || '',
      });
      setAvatarPreview('');
      setCoverPreview('');
      setAvatarPendingFile(null);
      setCoverPendingFile(null);
      setErrors({});
      setToastMessage(null);
      setActiveTab(TAB_MAP[initialFocusSection] || 'general');
    }
  }, [userProfile, isOpen, initialFocusSection]);

  useEffect(() => {
    if (isOpen && activeTab === 'bio') {
      setTimeout(autoResizeBio, 50);
    }
  }, [isOpen, activeTab, form.bio]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'bio') setTimeout(autoResizeBio, 0);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    else if (form.name.trim().length > 100) newErrors.name = 'Full name cannot exceed 100 characters';

    const cleanUsername = form.username.replace('@', '').trim().toLowerCase();
    if (!cleanUsername) newErrors.username = 'Username is required';
    else if (cleanUsername.length < 3 || cleanUsername.length > 30) newErrors.username = 'Username must be 3–30 characters';
    else if (!/^[a-z0-9_]+$/.test(cleanUsername)) newErrors.username = 'Lowercase letters, numbers, and underscores only';

    if (form.bio && form.bio.length > 500) newErrors.bio = 'Bio cannot exceed 500 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setToastMessage({ type: 'error', text: 'Please select JPG, PNG, or WEBP.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToastMessage({ type: 'error', text: 'Image must be under 10MB.' });
      return;
    }

    setAvatarPendingFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setToastMessage(null);
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setToastMessage({ type: 'error', text: 'Please select JPG, PNG, or WEBP.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToastMessage({ type: 'error', text: 'Image must be under 10MB.' });
      return;
    }

    setCoverPendingFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setToastMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setToastMessage({ type: 'error', text: 'Please fix the highlighted errors.' });
      return;
    }

    setIsSaving(true);
    setToastMessage(null);

    try {
      let avatarUrl = form.avatar;
      let avatarPublicId = form.profileImagePublicId;
      let coverUrl = form.coverImage;
      let coverPublicId = form.coverImagePublicId;

      if (avatarPendingFile) {
        const res = await uploadService.uploadSingle(avatarPendingFile, 'profile_pictures');
        const media = res.data || res;
        avatarUrl = media.secure_url || media.url;
        avatarPublicId = media.public_id || media.publicId;
      }

      if (coverPendingFile) {
        const res = await uploadService.uploadSingle(coverPendingFile, 'cover_photos');
        const media = res.data || res;
        coverUrl = media.secure_url || media.url;
        coverPublicId = media.public_id || media.publicId;
      }

      const cleanUsername = form.username.replace('@', '').trim().toLowerCase();
      const updatedPayload = {
        name: form.name.trim(),
        fullName: form.name.trim(),
        username: cleanUsername,
        handle: `@${cleanUsername}`,
        title: form.title.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        avatar: avatarUrl,
        profileImage: avatarUrl,
        profileImagePublicId: avatarPublicId,
        coverImage: coverUrl,
        coverImagePublicId: coverPublicId,
      };

      if (includePhone) {
        updatedPayload.phone = form.phone.trim();
      }

      const updateFn = profileUpdateFn || userService.updateUserProfile.bind(userService);
      const res = await updateFn(updatedPayload);

      if (res.success) {
        onSave?.(res.data || res.profile || updatedPayload);
        setToastMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => {
          setIsSaving(false);
          onClose();
        }, 500);
      } else {
        throw new Error(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setToastMessage({ type: 'error', text: err.message || 'Could not save profile.' });
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentAvatar =
    avatarPreview ||
    form.avatar ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

  const currentCover =
    coverPreview ||
    form.coverImage ||
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

  const tabs = [
    { id: 'general', label: 'Basic Info' },
    { id: 'bio', label: 'Bio' },
    { id: 'photos', label: 'Photos' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSaving && onClose()}
          className="fixed inset-0 theme-modal-backdrop cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="relative w-full md:max-w-2xl h-full md:h-auto md:max-h-[90vh] bg-white dark:bg-[#0b0f19] md:border border-slate-200/90 dark:border-slate-800/90 md:rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute top-3 left-4 right-4 z-50 p-3 rounded-2xl text-xs font-bold shadow-lg ${
                  toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {toastMessage.text}
              </motion.div>
            )}
          </AnimatePresence>

          <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarFileChange} disabled={isSaving} />
          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverFileChange} disabled={isSaving} />

          {/* Banner Cover Image */}
          <div className="relative flex-shrink-0 h-28 sm:h-36 bg-slate-900 overflow-hidden">
            <img src={currentCover} alt="Cover Banner" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-all cursor-pointer z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Bar (Avatar + Title) */}
          <div className="relative px-4 sm:px-6 pb-3 pt-0 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-end gap-3 sm:gap-4 -mt-10 sm:-mt-12 relative z-10">
              <Avatar
                src={currentAvatar}
                size="xl"
                className="!w-20 !h-20 sm:!w-24 sm:!h-24 border-4 border-white dark:border-[#0b0f19] shadow-2xl rounded-full flex-shrink-0"
              />
              <div className="mb-1">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">Edit Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update your account details and media</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex-shrink-0 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3.5 sm:px-4 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} disabled={isSaving} className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-100 dark:bg-slate-950/80 ${errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} focus:outline-none focus:border-brand-500`} />
                    {errors.name && <p className="mt-1 text-[11px] text-rose-500">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Username *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">@</span>
                      <input type="text" name="username" value={form.username} onChange={handleChange} disabled={isSaving} className={`w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border bg-slate-100 dark:bg-slate-950/80 ${errors.username ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} focus:outline-none focus:border-brand-500`} />
                    </div>
                    {errors.username && <p className="mt-1 text-[11px] text-rose-500">{errors.username}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">City / Location</label>
                    <input type="text" name="location" value={form.location} onChange={handleChange} disabled={isSaving} placeholder="e.g. Lahore, Pakistan" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 focus:outline-none focus:border-brand-500" />
                  </div>
                  {includePhone ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange} disabled={isSaving} placeholder="+1 (555) 000-0000" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 focus:outline-none focus:border-brand-500" />
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
                {includePhone && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} disabled={isSaving} placeholder="+1 (555) 000-0000" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 focus:outline-none focus:border-brand-500" />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bio' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">About You</label>
                  <span className={`text-[11px] font-mono font-bold ${form.bio.length > 450 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {form.bio.length}/500
                  </span>
                </div>
                <textarea
                  ref={bioRef}
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  disabled={isSaving}
                  maxLength={500}
                  rows={3}
                  placeholder="Tell people about yourself, your work, and interests..."
                  className={`w-full p-3.5 text-sm rounded-xl border bg-slate-100 dark:bg-slate-950/80 leading-relaxed resize-none overflow-hidden min-h-[100px] max-h-[200px] ${errors.bio ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} focus:outline-none focus:border-brand-500 dark:focus:border-cyan-500 transition-colors`}
                />
                {errors.bio && <p className="mt-1 text-[11px] text-rose-500">{errors.bio}</p>}
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Write a short description that appears on your profile.</p>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={currentAvatar} size="lg" className="!w-14 !h-14 flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold">Profile Picture</h4>
                      <p className="text-[11px] text-slate-500 truncate">JPG, PNG or WEBP · Max 10MB</p>
                    </div>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={isSaving} className="flex-shrink-0">
                    {avatarPendingFile ? 'Replace' : 'Upload'}
                  </Button>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold">Cover Photo</h4>
                      <p className="text-[11px] text-slate-500">Landscape banner · Max 10MB</p>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={() => coverInputRef.current?.click()} disabled={isSaving} className="flex-shrink-0">
                      {coverPendingFile ? 'Replace' : 'Upload'}
                    </Button>
                  </div>
                  <div className="relative w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img src={currentCover} alt="Cover preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            )}
          </form>

          <div className="flex-shrink-0 p-4 sm:px-6 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/90 flex justify-end gap-2.5">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} variant="primary" size="sm" disabled={isSaving} className="!px-6">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
