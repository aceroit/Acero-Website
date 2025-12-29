const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const {
    validateCreatePage,
    validateUpdatePage,
    validateMovePage,
    validateId
} = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/pages/tree - Get hierarchical page tree
 */
router.get('/tree', 
    checkPermission('pages', 'read'),
    pageController.getPageTree
);

/**
 * GET /api/pages/:id/children - Get direct children of a page
 */
router.get('/:id/children',
    checkPermission('pages', 'read'),
    pageController.getPageChildren
);

/**
 * GET /api/pages/:id/breadcrumb - Get breadcrumb trail
 */
router.get('/:id/breadcrumb',
    checkPermission('pages', 'read'),
    pageController.getPageBreadcrumb
);

/**
 * POST /api/pages/:id/duplicate - Duplicate a page
 */
router.post('/:id/duplicate',
    checkPermission('pages', 'create'),
    pageController.duplicatePage
);

/**
 * PUT /api/pages/:id/move - Move page to new parent
 */
router.put('/:id/move',
    checkPermission('pages', 'update'),
    validateId,
    validateMovePage,
    pageController.movePage
);

/**
 * PUT /api/pages/reorder - Reorder pages
 */
router.put('/reorder',
    checkPermission('pages', 'update'),
    pageController.reorderPages
);

/**
 * GET /api/pages - Get all pages (flat list)
 */
router.get('/',
    checkPermission('pages', 'read'),
    pageController.getAllPages
);

/**
 * POST /api/pages - Create new page
 */
router.post('/',
    checkPermission('pages', 'create'),
    validateCreatePage,
    pageController.createPage
);

/**
 * GET /api/pages/:id - Get page by ID
 */
router.get('/:id',
    checkPermission('pages', 'read'),
    pageController.getPageById
);

/**
 * PUT /api/pages/:id - Update page
 */
router.put('/:id',
    checkPermission('pages', 'update'),
    validateId,
    validateUpdatePage,
    pageController.updatePage
);

/**
 * DELETE /api/pages/:id - Delete page (soft delete)
 */
router.delete('/:id',
    checkPermission('pages', 'delete'),
    pageController.deletePage
);

module.exports = router;

