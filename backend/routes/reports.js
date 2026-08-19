const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const reportsController = require('../controllers/reportsController');

router.post('/', protect, reportsController.createReport);
router.get('/mine', protect, reportsController.getMyReports);
router.get('/my', protect, reportsController.getMyReports);
router.get('/:reportId/messages', protect, reportsController.getReportMessages);
router.post('/:reportId/messages', protect, reportsController.postReportMessage);
router.get('/:reportId', protect, reportsController.getReportById);

module.exports = router;
