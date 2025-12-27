const express = require('express');
const router = express.Router();
const sectionTypeController = require('../controllers/sectionTypeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/section-types/active - Get only active section types
 */
router.get('/active',
    sectionTypeController.getActiveSectionTypes
);

/**
 * GET /api/section-types/:slug/usage - Get usage statistics
 */
router.get('/:slug/usage',
    authorize('super_admin', 'admin'),
    sectionTypeController.getSectionTypeUsage
);

/**
 * GET /api/section-types/:slug - Get section type by slug
 */
router.get('/:slug',
    sectionTypeController.getSectionTypeBySlug
);

/**
 * GET /api/section-types - Get all section types
 */
router.get('/',
    sectionTypeController.getAllSectionTypes
);

/**
 * POST /api/section-types - Create new section type (super_admin only)
 */
router.post('/',
    authorize('super_admin'),
    sectionTypeController.createSectionType
);

/**
 * PUT /api/section-types/:slug - Update section type (super_admin only)
 */
router.put('/:slug',
    authorize('super_admin'),
    sectionTypeController.updateSectionType
);

/**
 * DELETE /api/section-types/:slug - Delete section type (super_admin only)
 */
router.delete('/:slug',
    authorize('super_admin'),
    sectionTypeController.deleteSectionType
);

module.exports = router;

