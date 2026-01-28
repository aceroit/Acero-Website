const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Activity Log Routes
 * All routes require authentication
 */

// Get all activities (admin/approver+) or filtered by user
router.get(
    '/',
    authenticate,
    authorize('super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'),
    activityController.getAllActivities
);

// Get current user's activity
router.get(
    '/my-activity',
    authenticate,
    activityController.getMyActivity
);

// Get activity statistics (admin+)
router.get(
    '/stats',
    authenticate,
    authorize('super_admin', 'admin', 'approver'),
    activityController.getActivityStats
);

// Export activity logs (admin+)
router.get(
    '/export',
    authenticate,
    authorize('super_admin', 'admin'),
    activityController.exportActivityLogs
);

// Get specific user's activities
router.get(
    '/user/:userId',
    authenticate,
    activityController.getUserActivities
);

// Get resource history
router.get(
    '/resource/:resource/:id',
    authenticate,
    activityController.getResourceHistory
);

module.exports = router;

