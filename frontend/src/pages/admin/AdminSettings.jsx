import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { BRAND } from '../../config/brand';
import { Button } from '../../components/ui/Button';

export const AdminSettings = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-extrabold">Admin Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Dashboard preferences and platform configuration</p>
      </div>

      <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm">Admin Profile</h3>
          <p className="text-xs text-slate-400 mt-0.5">View and edit your profile picture, bio, and account details</p>
        </div>
        <Link to="/admin/profile">
          <Button type="button" variant="secondary" size="sm" className="font-bold">Open Profile</Button>
        </Link>
      </section>

      <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Theme</h3>
          <p className="text-xs text-slate-400 mt-0.5">Toggle light / dark mode for the admin dashboard</p>
        </div>
        <ThemeToggle />
      </section>

      <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-sm">Security</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Admin login credentials are managed via backend environment variables (<code className="text-[10px]">ADMIN_EMAIL</code> / <code className="text-[10px]">ADMIN_PASSWORD</code>). Passwords are never exposed to the frontend.
        </p>
      </section>

      <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-sm">Platform</h3>
        <p className="text-xs text-slate-400 mt-1">{BRAND.name} Admin Dashboard · Moderation & Support</p>
      </section>
    </div>
  );
};

export default AdminSettings;
