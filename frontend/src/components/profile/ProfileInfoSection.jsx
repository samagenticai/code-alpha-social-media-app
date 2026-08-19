import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconLocation,
  IconBriefcase,
  IconGraduation,
  IconEdit,
  IconCake,
  IconBuilding,
  IconCheck,
  IconClose,
} from '../ui/Icons';
import { EditProfileInfoModal } from './EditProfileInfoModal';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

export const ProfileInfoSection = ({
  profile,
  isOwner,
  onProfileUpdated,
}) => {
  const { updateUser } = useAuth();
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null); // 'city', 'job', etc.
  const [editValue, setEditValue] = useState('');
  const [savingField, setSavingField] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const city = profile?.city || profile?.location || '';
  const maritalStatus = profile?.maritalStatus || '';
  const dateOfBirth = profile?.dateOfBirth || '';
  const job = profile?.job || profile?.title || '';
  const school = profile?.school || profile?.education?.school || '';
  const college = profile?.college || profile?.education?.college || '';
  const university = profile?.university || profile?.education?.university || '';

  // Format Date of Birth nicely (e.g. 1946-05-10 -> 10 May 1946)
  const formatDOB = (dobString) => {
    if (!dobString) return '';
    try {
      const parts = dobString.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        }
      }
      return dobString;
    } catch {
      return dobString;
    }
  };

  const startInlineEdit = (fieldKey, currentValue) => {
    if (!isOwner) return;
    setEditingField(fieldKey);
    setEditValue(currentValue || '');
    setFieldError('');
  };

  const cancelInlineEdit = () => {
    setEditingField(null);
    setEditValue('');
    setFieldError('');
  };

  const saveInlineField = async (fieldKey) => {
    if (savingField) return;
    setSavingField(true);
    setFieldError('');

    try {
      const trimmed = editValue.trim();
      const payload = {
        city,
        maritalStatus,
        dateOfBirth,
        job,
        school,
        college,
        university,
        [fieldKey]: trimmed,
      };

      if (fieldKey === 'city') payload.location = trimmed;
      if (fieldKey === 'job') payload.title = trimmed;

      payload.education = {
        school: fieldKey === 'school' ? trimmed : school,
        college: fieldKey === 'college' ? trimmed : college,
        university: fieldKey === 'university' ? trimmed : university,
      };

      const res = await userService.updateUserProfile(payload);
      if (res.success && res.data) {
        updateUser(res.data);
        onProfileUpdated?.(res.data);
        setEditingField(null);
      } else {
        setFieldError(res.message || 'Failed to save');
      }
    } catch (err) {
      console.error('Inline field update failed:', err);
      setFieldError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSavingField(false);
    }
  };

  const handleKeyDown = (e, fieldKey) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveInlineField(fieldKey);
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  const hasAnyDetails = Boolean(city || maritalStatus || dateOfBirth || job || school || college || university);

  // Field configurations
  const fields = [
    {
      key: 'job',
      label: 'Job',
      value: job,
      display: job ? `Works as ${job}` : '+ Add job',
      icon: <IconBriefcase className="w-5 h-5 text-brand-600 dark:text-cyan-400" />,
      type: 'text',
      placeholder: 'e.g. Senior Software Engineer',
    },
    {
      key: 'city',
      label: 'City',
      value: city,
      display: city ? `Lives in ${city}` : '+ Add current city',
      icon: <IconLocation className="w-5 h-5 text-emerald-500" />,
      type: 'text',
      placeholder: 'e.g. Multan, Pakistan',
    },
    {
      key: 'maritalStatus',
      label: 'Marital Status',
      value: maritalStatus,
      display: maritalStatus ? maritalStatus : '+ Add marital status',
      icon: <span className="text-base">💍</span>,
      type: 'select',
      options: [
        { label: 'Unmarried', value: 'Unmarried' },
        { label: 'Married', value: 'Married' },
      ],
    },
    {
      key: 'dateOfBirth',
      label: 'Date of Birth',
      value: dateOfBirth,
      display: dateOfBirth ? formatDOB(dateOfBirth) : '+ Add date of birth',
      icon: <IconCake className="w-5 h-5 text-amber-500" />,
      type: 'date',
    },
    {
      key: 'school',
      label: 'School',
      value: school,
      display: school ? `Went to ${school}` : '+ Add school',
      icon: <IconGraduation className="w-5 h-5 text-indigo-500" />,
      type: 'text',
      placeholder: 'e.g. City Grammar High School',
    },
    {
      key: 'college',
      label: 'College',
      value: college,
      display: college ? `Studied at ${college}` : '+ Add college',
      icon: <IconBuilding className="w-5 h-5 text-purple-500" />,
      type: 'text',
      placeholder: 'e.g. Govt College of Science',
    },
    {
      key: 'university',
      label: 'University',
      value: university,
      display: university ? `Studied at ${university}` : '+ Add university',
      icon: <IconGraduation className="w-5 h-5 text-blue-500" />,
      type: 'text',
      placeholder: 'e.g. National University (NUST)',
    },
  ];

  return (
    <>
      <div className="mx-3 sm:mx-6 mb-4 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-slate-700/80 shadow-md transition-colors">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Personal details
          </h3>

          {isOwner && (
            <button
              type="button"
              onClick={() => setIsFullModalOpen(true)}
              title="Edit all personal details"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
            >
              <IconEdit className="w-3.5 h-3.5" />
              <span>Edit All</span>
            </button>
          )}
        </div>

        {/* Details List with Inline Editing */}
        <div className="space-y-2 text-sm text-slate-800 dark:text-slate-200 font-medium">
          {fields.map((f) => {
            const isEditingThis = editingField === f.key;
            if (!f.value && !isOwner) return null;

            return (
              <div key={f.key} className="rounded-xl transition-all">
                {isEditingThis ? (
                  /* --- INLINE EDIT MODE --- */
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-brand-500/40 dark:border-cyan-500/40 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0">{f.icon}</div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{f.label}:</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {f.type === 'select' ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                        >
                          <option value="">Select {f.label}</option>
                          {f.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, f.key)}
                          placeholder={f.placeholder}
                          max={f.type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
                          autoFocus
                          className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                        />
                      )}

                      {/* Save Button */}
                      <button
                        type="button"
                        onClick={() => saveInlineField(f.key)}
                        disabled={savingField}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="Save"
                      >
                        {savingField ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <IconCheck className="w-4 h-4" />
                        )}
                      </button>

                      {/* Cancel Button */}
                      <button
                        type="button"
                        onClick={cancelInlineEdit}
                        disabled={savingField}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                        title="Cancel"
                      >
                        <IconClose className="w-4 h-4" />
                      </button>
                    </div>

                    {fieldError && (
                      <p className="text-[11px] font-semibold text-rose-500 pl-1">{fieldError}</p>
                    )}
                  </div>
                ) : (
                  /* --- NORMAL DISPLAY MODE --- */
                  <div
                    onClick={() => isOwner && startInlineEdit(f.key, f.value)}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                      isOwner ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 group' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">{f.icon}</div>
                      <span
                        className={`truncate ${
                          f.value
                            ? 'font-semibold text-slate-900 dark:text-slate-100'
                            : 'text-slate-400 italic text-xs'
                        }`}
                      >
                        {f.display}
                      </span>
                    </div>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startInlineEdit(f.key, f.value);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-brand-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-600/60 transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                        title={`Edit ${f.label}`}
                      >
                        <IconEdit className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!hasAnyDetails && !isOwner && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
              No personal details shared.
            </p>
          )}
        </div>
      </div>

      {/* Full Modal Popup when user clicks 'Edit All' */}
      {isOwner && (
        <EditProfileInfoModal
          isOpen={isFullModalOpen}
          onClose={() => setIsFullModalOpen(false)}
          userProfile={profile}
          onProfileUpdated={onProfileUpdated}
        />
      )}
    </>
  );
};
