const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supportController = require('../controllers/supportController');

router.post('/', protect, supportController.createTicket);
router.get('/', protect, supportController.getMyTickets);
router.get('/:id', protect, supportController.getMyTicket);
router.post('/:id/reply', protect, supportController.replyToTicket);

module.exports = router;
