const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const reelsController = require('../controllers/reelsController');

router.get('/', optionalAuth, reelsController.getReels);
router.post('/', protect, reelsController.createReel);
router.put('/:id', protect, reelsController.updateReel);
router.delete('/:id', protect, reelsController.deleteReel);
router.post('/:id/like', protect, reelsController.toggleLike);
router.post('/:id/comment', protect, reelsController.addComment);
router.delete('/:id/comment/:commentId', protect, reelsController.deleteComment);
router.post('/:id/comment/:commentId/like', protect, reelsController.toggleCommentLike);
router.post('/:id/share', protect, reelsController.shareReel);

module.exports = router;
