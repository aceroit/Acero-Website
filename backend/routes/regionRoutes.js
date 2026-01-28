const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/regions - Get all regions (with filters and pagination)
 */
router.get('/',
    checkPermission('regions', 'read'),
    regionController.getAllRegions
);

/**
 * POST /api/regions - Create new region
 */
router.post('/',
    checkPermission('regions', 'create'),
    regionController.createRegion
);

/**
 * GET /api/regions/:id - Get region by ID
 */
router.get('/:id',
    checkPermission('regions', 'read'),
    validateId,
    regionController.getRegionById
);

/**
 * PUT /api/regions/:id - Update region
 */
router.put('/:id',
    checkPermission('regions', 'update'),
    validateId,
    regionController.updateRegion
);

/**
 * DELETE /api/regions/:id - Delete region (soft delete)
 */
router.delete('/:id',
    checkPermission('regions', 'delete'),
    validateId,
    regionController.deleteRegion
);

module.exports = router;

