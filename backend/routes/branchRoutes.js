const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/branches - Get all branches (with filters and pagination)
 */
router.get('/',
    checkPermission('branches', 'read'),
    branchController.getAllBranches
);

/**
 * POST /api/branches - Create new branch
 */
router.post('/',
    checkPermission('branches', 'create'),
    branchController.createBranch
);

/**
 * PUT /api/branches/reorder - Reorder branches (bulk update order)
 */
router.put('/reorder',
    checkPermission('branches', 'update'),
    branchController.reorderBranches
);

/**
 * GET /api/branches/:id - Get branch by ID
 */
router.get('/:id',
    checkPermission('branches', 'read'),
    validateId,
    branchController.getBranchById
);

/**
 * PUT /api/branches/:id - Update branch
 */
router.put('/:id',
    checkPermission('branches', 'update'),
    validateId,
    branchController.updateBranch
);

/**
 * DELETE /api/branches/:id - Delete branch (soft delete)
 */
router.delete('/:id',
    checkPermission('branches', 'delete'),
    validateId,
    branchController.deleteBranch
);

module.exports = router;

