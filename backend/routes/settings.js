const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.get('/privacy', protect, settingsController.getPrivacySettings);
router.put('/privacy', protect, settingsController.updatePrivacySettings);

module.exports = router;
