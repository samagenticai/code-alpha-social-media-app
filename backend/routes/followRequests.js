const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const followRequestsController = require('../controllers/followRequestsController');

router.get('/count', protect, followRequestsController.getFollowRequestCount);
router.get('/', protect, followRequestsController.getFollowRequests);
router.post('/:userId', protect, followRequestsController.sendFollowRequest);
router.put('/:requestId/accept', protect, followRequestsController.acceptFollowRequest);
router.put('/:requestId/reject', protect, followRequestsController.rejectFollowRequest);

module.exports = router;
