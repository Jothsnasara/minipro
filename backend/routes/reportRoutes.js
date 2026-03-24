const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/stats', verifyToken, reportController.getReportStats);
router.get('/utilization-trend', verifyToken, reportController.getUtilizationTrend);
router.get('/cost-analysis', verifyToken, reportController.getCostAnalysis);


module.exports = router;
