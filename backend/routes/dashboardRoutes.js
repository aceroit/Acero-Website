const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

// Apply authentication to all routes
router.use(authenticate);

// Overview metrics - accessible to all authenticated users
router.get(
    '/metrics',
    dashboardController.getWorkflowMetrics
);

// User workload summary - accessible to all authenticated users
router.get(
    '/workload',
    dashboardController.getUserWorkloadSummary
);

// Team activity - reviewer+ only
router.get(
    '/team-activity',
    checkPermission('pages', 'update'), // Requires reviewer role (reviewers have update permission)
    dashboardController.getTeamActivity
);

// Pending items awaiting user action - accessible to all authenticated users
router.get(
    '/pending',
    dashboardController.getPendingItems
);

// User's draft content - accessible to all authenticated users
router.get(
    '/my-drafts',
    dashboardController.getMyDrafts
);

// User's submissions in workflow - accessible to all authenticated users
router.get(
    '/my-submissions',
    dashboardController.getMySubmissions
);

// Recently published content - accessible to all authenticated users
router.get(
    '/recently-published',
    dashboardController.getRecentlyPublished
);

// Workflow timeline - reviewer+ only
router.get(
    '/timeline',
    checkPermission('pages', 'update'), // Requires reviewer role (reviewers have update permission)
    dashboardController.getWorkflowTimeline
);

// User productivity statistics - admin+ only
router.get(
    '/productivity/:userId',
    checkPermission('pages', 'delete'), // Admin-only
    dashboardController.getUserProductivityStats
);

// Workflow bottlenecks - admin+ only
router.get(
    '/bottlenecks',
    checkPermission('pages', 'delete'), // Admin-only
    dashboardController.getBottlenecks
);

module.exports = router;

