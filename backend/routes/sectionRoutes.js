const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const {
    validateCreateSection,
    validateUpdateSection,
    validateId
} = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/pages/:pageId/sections - Get all sections for a page
 */
router.get('/pages/:pageId/sections',
    checkPermission('sections', 'read'),
    sectionController.getPageSections
);

/**
 * POST /api/pages/:pageId/sections - Create section for a page
 */
router.post('/pages/:pageId/sections',
    checkPermission('sections', 'create'),
    validateCreateSection,
    sectionController.createSection
);

/**
 * GET /api/sections/type/:slug - Get sections by type
 */
router.get('/type/:slug',
    checkPermission('sections', 'read'),
    sectionController.getSectionsByType
);

/**
 * PUT /api/sections/reorder - Reorder sections
 */
router.put('/reorder',
    checkPermission('sections', 'update'),
    sectionController.reorderSections
);

/**
 * POST /api/sections/:id/duplicate - Duplicate section
 */
router.post('/:id/duplicate',
    checkPermission('sections', 'create'),
    sectionController.duplicateSection
);

/**
 * PUT /api/sections/:id/visibility - Toggle section visibility
 */
router.put('/:id/visibility',
    checkPermission('sections', 'update'),
    sectionController.toggleVisibility
);

/**
 * GET /api/sections/:id - Get section by ID
 */
router.get('/:id',
    checkPermission('sections', 'read'),
    sectionController.getSectionById
);

/**
 * PUT /api/sections/:id - Update section
 */
router.put('/:id',
    checkPermission('sections', 'update'),
    validateId,
    validateUpdateSection,
    sectionController.updateSection
);

/**
 * DELETE /api/sections/:id - Delete section
 */
router.delete('/:id',
    checkPermission('sections', 'delete'),
    sectionController.deleteSection
);

module.exports = router;

