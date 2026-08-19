import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminRoute } from '../../components/admin/AdminRoute';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminPosts, AdminReels } from './AdminContentPages';
import { AdminReports } from './AdminReports';
import { AdminSupport } from './AdminSupport';
import { AdminComments } from './AdminComments';
import { AdminBlockedUsers } from './AdminBlockedUsers';
import { AdminActivityLogs } from './AdminActivityLogs';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminNotifications } from './AdminNotifications';
import { AdminSettings } from './AdminSettings';
import { AdminProfile } from './AdminProfile';

export const AdminApp = () => (
  <AdminRoute>
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="reels" element={<AdminReels />} />
        <Route path="comments" element={<AdminComments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="blocked-users" element={<AdminBlockedUsers />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="activity-logs" element={<AdminActivityLogs />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  </AdminRoute>
);

export default AdminApp;
