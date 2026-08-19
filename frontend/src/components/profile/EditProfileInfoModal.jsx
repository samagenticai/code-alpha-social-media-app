import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import {
  IconClose,
  IconLocation,
  IconBriefcase,
  IconCalendar,
  IconGraduation,
  IconCheck,
} from '../ui/Icons';

export const EditProfileInfoModal = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
  initialFocusField,
}) => {
  const { updateUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [formData, setFormData] = useState({
    city: '',
    maritalStatus: '',
    dateOfBirth: '',
    job: '',
    school: '',
    college: '',
    university: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only initialize form data when modal opens from closed to open
    if (isOpen && !prevIsOpenRef.current) {
      setFormData({
        city: userProfile?.city || userProfile?.location || '',
        maritalStatus: userProfile?.maritalStatus || '',
        dateOfBirth: userProfile?.dateOfBirth || '',
        job: userProfile?.job || userProfile?.title || '',
        school: userProfile?.school || userProfile?.education?.school || '',
        college: userProfile?.college || userProfile?.education?.college || '',
        university: userProfile?.university || userProfile?.education?.university || '',
      });
      setError('');
      setSuccess(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, userProfile]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError('');

    try {
      const payload = {
        city: formData.city !== undefined ? formData.city.trim() : '',
        maritalStatus: formData.maritalStatus !== undefined ? formData.maritalStatus.trim() : '',
        dateOfBirth: formData.dateOfBirth !== undefined ? formData.dateOfBirth.trim() : '',
        job: formData.job !== undefined ? formData.job.trim() : '',
        school: formData.school !== undefined ? formData.school.trim() : '',
        college: formData.college !== undefined ? formData.college.trim() : '',
        university: formData.university !== undefined ? formData.university.trim() : '',
      };

      payload.education = {
        school: payload.school,
        college: payload.college,
        university: payload.university,
      };

      const res = await userService.updateUserProfile(payload);
      if (res.success && res.data) {
        updateUser(res.data);
        onProfileUpdated?.(res.data);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 300);
      } else {
        setError(res.message || 'Failed to update personal details.');
      }
    } catch (err) {
      console.error('Update personal details failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          {/* Backdrop: Light Frosted Glass in Light Mode, Deep Dark in Dark Mode */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && onClose()}
            className={`fixed inset-0 cursor-pointer transition-colors duration-200 ${
              isDark
                ? 'bg-black/80 backdrop-blur-md'
                : 'bg-slate-900/25 backdrop-blur-md'
            }`}
          />

          {/* Centered Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh] my-auto transition-colors duration-200 ${
              isDark
                ? 'bg-[#0f172a] text-white border-slate-700/80 shadow-black/60'
                : 'bg-white text-slate-900 border-slate-200 shadow-xl'
            }`}
          >
            {/* 1. Header */}
            <div
              className={`flex items-center justify-between px-5 sm:px-6 py-4 border-b flex-shrink-0 transition-colors duration-200 ${
                isDark
                  ? 'bg-[#090d16] text-white border-slate-700/80'
                  : 'bg-slate-50/90 text-slate-900 border-slate-200'
              }`}
            >
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Edit Personal Details
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Update your location, marital status, birthday, job, and education
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Close"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Form Body */}
            <form
              id="edit-profile-info-form"
              onSubmit={handleSubmit}
              className={`flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-4 transition-colors duration-200 ${
                isDark ? 'bg-[#0f172a]' : 'bg-white'
              }`}
            >
              {error && (
                <div className={`p-3 text-xs font-semibold rounded-xl border ${
                  isDark
                    ? 'text-rose-300 bg-rose-950/60 border-rose-800/80'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}>
                  {error}
                </div>
              )}

              {/* 1. Job */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <IconBriefcase className="w-4 h-4 text-brand-600 dark:text-cyan-400" />
                  <span>Job</span>
                </label>
                <input
                  type="text"
                  name="job"
                  value={formData.job}
                  onChange={handleChange}
                  placeholder="e.g. Senior Software Engineer"
                  autoFocus={initialFocusField === 'job'}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium ${
                    isDark
                      ? 'bg-[#090d16] text-white placeholder:text-slate-500 border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/20'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20'
                  }`}
                />
              </div>

              {/* 2. City */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <IconLocation className="w-4 h-4 text-emerald-500" />
                  <span>City</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Multan, Pakistan"
                  autoFocus={initialFocusField === 'city'}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium ${
                    isDark
                      ? 'bg-[#090d16] text-white placeholder:text-slate-500 border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/20'
                      : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20'
                  }`}
                />
              </div>

              {/* 3. Marital Status */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <span className="text-pink-500 text-sm">💍</span>
                  <span>Marital Status</span>
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium cursor-pointer ${
                    isDark
                      ? 'bg-[#090d16] text-white border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/20'
                      : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20'
                  }`}
                >
                  <option value="">Select Marital Status</option>
                  <option value="Unmarried">Unmarried</option>
                  <option value="Married">Married</option>
                </select>
              </div>

              {/* 4. Date of Birth */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <IconCalendar className="w-4 h-4 text-amber-500" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  autoFocus={initialFocusField === 'dateOfBirth'}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium cursor-pointer ${
                    isDark
                      ? 'bg-[#090d16] text-white border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/20'
                      : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20'
                  }`}
                />
              </div>

              {/* Academic Background Divider */}
              <div className={`pt-3 border-t ${isDark ? 'border-slate-700/80' : 'border-slate-200'}`}>
                <span className={`text-[11px] font-black uppercase tracking-wider block mb-3 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Academic Background
                </span>

                {/* 5. School */}
                <div className="space-y-1.5 mb-3.5">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    <IconGraduation className="w-4 h-4 text-indigo-500" />
                    <span>School</span>
                  </label>
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    placeholder="e.g. City Grammar High School"
                    autoFocus={initialFocusField === 'school'}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium ${
                      isDark
                        ? 'bg-[#090d16] text-white placeholder:text-slate-500 border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/20'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20'
                    }`}
                  />
                </div>

                {/* 6. College */}
                <div className="space-y-1.5 mb-3.5">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    <IconGraduation className="w-4 h-4 text-purple-500" />
                    <span>College</span>
                  </label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder="e.g. Govt College of Science"
                    autoFocus={initialFocusField === 'college'}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium ${
                      isDark
                        ? 'bg-[#090d16] text-white placeholder:text-slate-500 border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/20'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20'
                    }`}
                  />
                </div>

                {/* 7. University */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    <IconGraduation className="w-4 h-4 text-blue-500" />
                    <span>University</span>
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    placeholder="e.g. National University (NUST)"
                    autoFocus={initialFocusField === 'university'}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium ${
                      isDark
                        ? 'bg-[#090d16] text-white placeholder:text-slate-500 border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/20'
                        : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20'
                    }`}
                  />
                </div>
              </div>
            </form>

            {/* 3. Fixed Footer with Direct Submit Handler */}
            <div
              className={`flex items-center justify-end gap-3 px-5 sm:px-6 py-3.5 border-t flex-shrink-0 transition-colors duration-200 ${
                isDark
                  ? 'bg-[#090d16] border-slate-700/80'
                  : 'bg-slate-50/90 border-slate-200'
              }`}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                variant="primary"
                size="sm"
                loading={saving}
                icon={success ? IconCheck : undefined}
              >
                {success ? 'Saved!' : 'Save Details'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
