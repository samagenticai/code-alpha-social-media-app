const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

router.get('/', optionalAuth, notificationsController.getNotifications);
router.put('/read-all', optionalAuth, notificationsController.markAllAsRead);
router.put('/:id/read', optionalAuth, notificationsController.markAsRead);
router.delete('/:id', optionalAuth, notificationsController.deleteNotification);
router.delete('/', optionalAuth, notificationsController.clearAllNotifications);

module.exports = router;
