const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const postsController = require('../controllers/postsController');
const reelsController = require('../controllers/reelsController');

router.get('/saved', protect, postsController.getSavedPosts);
router.get('/reels', optionalAuth, reelsController.getReels);
router.get('/', optionalAuth, postsController.getFeed);
router.get('/:id/likes', optionalAuth, postsController.getPostLikers);
router.post('/', protect, postsController.createPost);
router.put('/:id', protect, postsController.updatePost);
router.delete('/:id', protect, postsController.deletePost);
router.post('/:id/like', protect, postsController.toggleLike);
router.post('/:id/comment', protect, postsController.addComment);
router.delete('/:id/comment/:commentId', protect, postsController.deleteComment);
router.post('/:id/comment/:commentId/like', protect, postsController.toggleCommentLike);
router.post('/:id/save', protect, postsController.toggleSave);
router.post('/:id/share', protect, postsController.sharePost);

module.exports = router;
