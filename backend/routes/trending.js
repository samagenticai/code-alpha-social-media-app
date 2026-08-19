const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const trendingController = require('../controllers/trendingController');

router.get('/config', trendingController.getTrendingConfig);
router.get('/', optionalAuth, trendingController.getTrending);

module.exports = router;
