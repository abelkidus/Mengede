const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { rateLimiter } = require('../middleware/rateLimiters');
const {
  createReport,
  getPendingReports,
  updateReportStatus,
} = require('../controllers/reportController');

const router = express.Router();

/**
 * Public route to submit a community report.
 * Protected by rateLimiter to prevent spam.
 */
router.post('/', rateLimiter, createReport);

/**
 * Admin route to get all pending reports.
 * Protected by JWT authentication middleware.
 */
router.get('/pending', authMiddleware, getPendingReports);

/**
 * Admin route to update report status (RESOLVED / DISMISSED).
 * Protected by JWT authentication middleware.
 */
router.patch('/:id/status', authMiddleware, updateReportStatus);

module.exports = router;

