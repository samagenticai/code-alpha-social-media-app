const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdminRole } = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

router.use(protect, requireAdminRole);

router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);
router.get('/search', adminController.globalSearch);

router.get('/users', adminController.getUsers);
router.get('/users/:id/moderation', adminController.getUserModeration);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/unblock', adminController.unblockUser);
router.put('/users/:id/suspend', adminController.suspendUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/blocked-users', adminController.getBlockedUsers);

router.get('/posts', adminController.getPosts);
router.put('/posts/:id/remove', adminController.removePost);
router.put('/posts/:id/restore', adminController.restorePost);

router.get('/reels', adminController.getReels);
router.put('/reels/:id/remove', adminController.removeReel);
router.put('/reels/:id/restore', adminController.restoreReel);

router.get('/comments', adminController.getComments);
router.delete('/comments', adminController.removeComment);

router.get('/reports', adminController.getReports);
router.get('/reports/:id/messages', adminController.getAdminReportMessages);
router.post('/reports/:id/messages', adminController.postAdminReportMessage);
router.get('/reports/:id', adminController.getReportById);
router.put('/reports/:id', adminController.updateReport);

router.get('/support', adminController.getSupportTickets);
router.get('/support/:id', adminController.getSupportTicket);
router.put('/support/:id', adminController.updateSupportTicket);

router.get('/activity-logs', adminController.getActivityLogs);
router.get('/notifications/unread-count', adminController.getUnreadNotificationCount);
router.put('/notifications/read-all', adminController.markAllNotificationsRead);
router.get('/notifications', adminController.getNotifications);
router.put('/notifications/:id/read', adminController.markNotificationRead);

router.get('/profile', adminController.getProfile);
router.put('/profile', adminController.updateProfile);

module.exports = router;
