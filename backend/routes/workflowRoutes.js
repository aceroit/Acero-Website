const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { authenticate } = require('../middleware/auth');
const { checkAnyPermission } = require('../middleware/rbac');
const { validateChangeSummary } = require('../utils/validators');

const RESOURCE_PERMISSION_MAP = {
    page: 'pages',
    section: 'sections',
    project: 'projects',
    branch: 'branches',
    customer: 'customers',
    certification: 'certifications',
    'company-update': 'company-updates',
    'company-update-category': 'company-update-categories',
    brochure: 'brochures',
    'building-type': 'building-types',
    industry: 'industries',
    country: 'countries',
    region: 'regions',
    area: 'areas',
    'header-configuration': 'header-configurations',
    'footer-configuration': 'footer-configurations',
    'website-appearance': 'website-appearance',
    'smtp-settings': 'smtp-settings',
    'google-recaptcha': 'google-recaptcha',
    'google-maps': 'google-maps',
    vacancy: 'vacancies',
};

const normalizeWorkflowResource = (resource) => RESOURCE_PERMISSION_MAP[resource] || resource;

const checkWorkflowRoutePermission = (actions) => {
    const requiredActions = Array.isArray(actions) ? actions : [actions];

    return (req, res, next) => {
        const normalizedResource = normalizeWorkflowResource(req.params.resource);
        const permissions = requiredActions.flatMap((action) => ([
            { resource: normalizedResource, action },
            { resource: 'workflow', action },
        ]));

        return checkAnyPermission(permissions)(req, res, next);
    };
};

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
// Submit for review (draft -> in_review) - Editor+
router.post(
    '/:resource/:id/submit',
    validateResource,
    validateChangeSummary(true),
    checkWorkflowRoutePermission('update'),
    workflowController.submitForReview
);

// Mark reviewed (in_review -> pending_approval) - Reviewer+
router.post(
    '/:resource/:id/review',
    validateResource,
    checkWorkflowRoutePermission('review'),
    workflowController.markReviewed
);

// Request changes (in_review/pending_approval/pending_publish -> changes_requested)
router.post(
    '/:resource/:id/request-changes',
    validateResource,
    checkWorkflowRoutePermission(['review', 'approve']),
    workflowController.requestChanges
);

// Approve content (pending_approval -> pending_publish) - Approver+
router.post(
    '/:resource/:id/approve',
    validateResource,
    checkWorkflowRoutePermission('approve'),
    workflowController.approveContent
);

// Reject content (pending_approval -> changes_requested) - Approver+
router.post(
    '/:resource/:id/reject',
    validateResource,
    checkWorkflowRoutePermission('approve'),
    workflowController.rejectContent
);

// Publish content (pending_publish -> published) - Admin+
router.post(
    '/:resource/:id/publish',
    validateResource,
    checkWorkflowRoutePermission('publish'),
    workflowController.publishContent
);

// Unpublish content (published -> draft) - Admin+
router.post(
    '/:resource/:id/unpublish',
    validateResource,
    checkWorkflowRoutePermission('publish'),
    workflowController.unpublishContent
);

// Archive content (published -> archived) - Admin+
router.post(
    '/:resource/:id/archive',
    validateResource,
    checkWorkflowRoutePermission('delete'),
    workflowController.archiveContent
);

// Restore content (archived -> draft) - Admin+
router.post(
    '/:resource/:id/restore',
    validateResource,
    checkWorkflowRoutePermission('delete'),
    workflowController.restoreContent
);

// Version management routes
router.get(
    '/:resource/:id/versions',
    validateResource,
    checkWorkflowRoutePermission('read'),
    workflowController.getContentVersions
);

router.get(
    '/:resource/:id/versions/compare',
    validateResource,
    checkWorkflowRoutePermission('read'),
    workflowController.compareVersions
);

router.post(
    '/:resource/:id/versions/:version/restore',
    validateResource,
    checkWorkflowRoutePermission('update'),
    workflowController.restoreVersion
);

// Get available workflow actions for current user
router.get(
    '/:resource/:id/available-actions',
    validateResource,
    checkWorkflowRoutePermission('read'),
    workflowController.getAvailableActions
);

module.exports = router;

