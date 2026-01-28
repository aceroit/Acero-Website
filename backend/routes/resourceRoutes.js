const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/resources/menu - Get resources for sidebar menu
 * Any authenticated user can access this
 */
router.get('/menu',
    resourceController.getMenuResources
);

/**
 * GET /api/resources/tree - Get hierarchical resource tree
 * Any authenticated user can access this
 */
router.get('/tree',
    resourceController.getResourceTree
);

/**
 * GET /api/resources/category - Get resources grouped by category
 * Any authenticated user can access this
 */
router.get('/category',
    resourceController.getResourcesByCategory
);

/**
 * GET /api/resources/slug/:slug - Get resource by slug
 * Any authenticated user can access this
 * Must come before /:id route
 */
router.get('/slug/:slug',
    resourceController.getResourceBySlug
);

/**
 * GET /api/resources/:id/usage - Get resource usage statistics
 * Only super_admin and admin can view usage
 * Must come before /:id route
 */
router.get('/:id/usage',
    authorize('super_admin', 'admin'),
    resourceController.getResourceUsage
);

/**
 * GET /api/resources/:id - Get resource by ID
 * Any authenticated user can access this
 */
router.get('/:id',
    resourceController.getResourceById
);

/**
 * GET /api/resources - Get all resources (with pagination and filters)
 * Any authenticated user can access this
 */
router.get('/',
    resourceController.getAllResources
);

/**
 * POST /api/resources - Create new resource (super_admin only)
 */
router.post('/',
    authorize('super_admin'),
    resourceController.createResource
);

/**
 * PUT /api/resources/:id - Update resource (super_admin only)
 */
router.put('/:id',
    authorize('super_admin'),
    resourceController.updateResource
);

/**
 * DELETE /api/resources/:id - Delete resource (super_admin only)
 */
router.delete('/:id',
    authorize('super_admin'),
    resourceController.deleteResource
);

module.exports = router;

