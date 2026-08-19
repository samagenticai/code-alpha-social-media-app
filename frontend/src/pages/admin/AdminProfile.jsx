import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { EditProfileModal } from '../../components/profile/EditProfileModal';

const InfoRow = ({ label, value }) => (
  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60">
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 break-words">{value || '—'}</p>
  </div>
);

export const AdminProfile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getProfile();
      setProfile(res.profile);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = (updated) => {
    setProfile((prev) => ({ ...prev, ...updated }));
    updateUser(updated);
    loadProfile();
  };

  const adminUpdateFn = async (payload) => {
    const res = await adminService.updateProfile(payload);
    return { success: true, data: res.profile, profile: res.profile };
  };

  if (loading) {
    return <div className="animate-pulse h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />;
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
        {error}
        <button type="button" onClick={loadProfile} className="block mt-2 text-xs font-bold underline">Retry</button>
      </div>
    );
  }

  const cover = profile?.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">Admin Profile</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your administrator account details</p>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={() => setEditOpen(true)} className="font-bold">
          Edit Profile
        </Button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="relative h-36 sm:h-44">
          <img src={cover} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="px-4 sm:px-6 pb-6 -mt-12 relative">
          <Avatar
            src={profile?.profileImage || profile?.avatar}
            alt={profile?.fullName}
            size="xl"
            className="!w-24 !h-24 border-4 border-white dark:border-slate-900 shadow-xl rounded-full"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{profile?.fullName}</h3>
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              {profile?.role || 'admin'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">@{profile?.username}</p>
          {profile?.title && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{profile.title}</p>}
          {profile?.bio && <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">{profile.bio}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="Email (read-only)" value={profile?.email} />
        <InfoRow label="Phone" value={profile?.phone} />
        <InfoRow label="Profession" value={profile?.title} />
        <InfoRow label="Location" value={profile?.location} />
        <InfoRow label="Account Role" value="Admin" />
        <InfoRow
          label="Account Created"
          value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
        />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Admin email is controlled by backend environment configuration and cannot be changed from the dashboard. Your role is permanently set to Admin by the server.
      </p>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        userProfile={profile}
        onSave={handleSave}
        includePhone
        profileUpdateFn={adminUpdateFn}
      />
    </div>
  );
};

export default AdminProfile;
