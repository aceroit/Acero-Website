const express = require('express');
const router = express.Router();
const buildingTypeController = require('../controllers/buildingTypeController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/building-types - Get all building types (with filters and pagination)
 */
router.get('/',
    checkPermission('building-types', 'read'),
    buildingTypeController.getAllBuildingTypes
);

/**
 * POST /api/building-types - Create new building type
 */
router.post('/',
    checkPermission('building-types', 'create'),
    buildingTypeController.createBuildingType
);

/**
 * GET /api/building-types/:id - Get building type by ID
 */
router.get('/:id',
    checkPermission('building-types', 'read'),
    validateId,
    buildingTypeController.getBuildingTypeById
);

/**
 * PUT /api/building-types/:id - Update building type
 */
router.put('/:id',
    checkPermission('building-types', 'update'),
    validateId,
    buildingTypeController.updateBuildingType
);

/**
 * DELETE /api/building-types/:id - Delete building type (soft delete)
 */
router.delete('/:id',
    checkPermission('building-types', 'delete'),
    validateId,
    buildingTypeController.deleteBuildingType
);

module.exports = router;

