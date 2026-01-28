const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateChangeSummary } = require('../utils/validators');

// Middleware to validate resource parameter
const validateResource = (req, res, next) => {
    const { resource } = req.params;
    const validResources = [
        'page', 
        'section', 
        'project', 
        'branch', 
        'customer', 
        'certification', 
        'company-update', 
        'company-update-category', 
        'brochure',
        'building-type',
        'industry',
        'country',
        'region',
        'area',
        'header-configuration',
        'footer-configuration',
        'website-appearance',
        'smtp-settings',
        'google-recaptcha',
        'google-maps',
        'vacancy'
    ];
    
    if (!validResources.includes(resource)) {
        return res.status(400).json({
            success: false,
            message: `Invalid resource type. Must be one of: ${validResources.join(', ')}`
        });
    }
    
    next();
};

// Apply authentication to all routes
router.use(authenticate);

// Workflow state transition routes
// Submit for review (draft → in_review) - Editor+
router.post(
    '/:resource/:id/submit',
    validateResource,
    validateChangeSummary(true), // Require change summary for submit
    checkPermission('pages', 'update'), // Generic permission check
    workflowController.submitForReview
);

// Mark reviewed (in_review → pending_approval) - Reviewer+
router.post(
    '/:resource/:id/review',
    validateResource,
    checkPermission('pages', 'update'), // Requires reviewer role (reviewers have update permission)
    workflowController.markReviewed
);

// Request changes (in_review/pending_approval → changes_requested) - Reviewer+
router.post(
    '/:resource/:id/request-changes',
    validateResource,
    checkPermission('pages', 'update'), // Requires reviewer role (reviewers have update permission)
    workflowController.requestChanges
);

// Approve content (pending_approval → pending_publish) - Approver+
router.post(
    '/:resource/:id/approve',
    validateResource,
    checkPermission('pages', 'approve'), // Requires approver role
    workflowController.approveContent
);

// Reject content (pending_approval → changes_requested) - Approver+
router.post(
    '/:resource/:id/reject',
    validateResource,
    checkPermission('pages', 'approve'), // Requires approver role
    workflowController.rejectContent
);

// Publish content (pending_publish → published) - Admin+
router.post(
    '/:resource/:id/publish',
    validateResource,
    checkPermission('pages', 'delete'), // Admin-only action
    workflowController.publishContent
);

// Unpublish content (published → draft) - Admin+
router.post(
    '/:resource/:id/unpublish',
    validateResource,
    checkPermission('pages', 'delete'), // Admin-only action
    workflowController.unpublishContent
);

// Archive content (published → archived) - Admin+
router.post(
    '/:resource/:id/archive',
    validateResource,
    checkPermission('pages', 'delete'), // Admin-only action
    workflowController.archiveContent
);

// Restore content (archived → draft) - Admin+
router.post(
    '/:resource/:id/restore',
    validateResource,
    checkPermission('pages', 'delete'), // Admin-only action
    workflowController.restoreContent
);

// Version management routes
// Get version history
router.get(
    '/:resource/:id/versions',
    validateResource,
    checkPermission('pages', 'read'),
    workflowController.getContentVersions
);

// Compare versions
router.get(
    '/:resource/:id/versions/compare',
    validateResource,
    checkPermission('pages', 'read'),
    workflowController.compareVersions
);

// Restore a previous version
router.post(
    '/:resource/:id/versions/:version/restore',
    validateResource,
    checkPermission('pages', 'update'),
    workflowController.restoreVersion
);

// Get available workflow actions for current user
router.get(
    '/:resource/:id/available-actions',
    validateResource,
    checkPermission('pages', 'read'),
    workflowController.getAvailableActions
);

module.exports = router;

