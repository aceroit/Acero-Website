const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/roles/slug/:slug - Get role by slug
 * Any authenticated user can access this
 * Must come before /:id route
 */
router.get('/slug/:slug',
    roleController.getRoleBySlug
);

/**
 * GET /api/roles/:id/usage - Get role usage statistics
 * Only super_admin can view usage
 * Must come before /:id route
 */
router.get('/:id/usage',
    authorize('super_admin'),
    roleController.getRoleUsage
);

/**
 * GET /api/roles/:id - Get role by ID
 * Any authenticated user can access this
 */
router.get('/:id',
    roleController.getRoleById
);

/**
 * GET /api/roles - Get all roles (with pagination and filters)
 * Any authenticated user can access this
 */
router.get('/',
    roleController.getAllRoles
);

/**
 * POST /api/roles - Create new role (super_admin only)
 */
router.post('/',
    authorize('super_admin'),
    roleController.createRole
);

/**
 * PUT /api/roles/:id - Update role (super_admin only)
 */
router.put('/:id',
    authorize('super_admin'),
    roleController.updateRole
);

/**
 * DELETE /api/roles/:id - Delete role (super_admin only)
 */
router.delete('/:id',
    authorize('super_admin'),
    roleController.deleteRole
);

module.exports = router;

