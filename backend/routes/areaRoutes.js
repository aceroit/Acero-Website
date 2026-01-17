const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/areas - Get all areas (with filters and pagination)
 */
router.get('/',
    checkPermission('areas', 'read'),
    areaController.getAllAreas
);

/**
 * POST /api/areas - Create new area
 */
router.post('/',
    checkPermission('areas', 'create'),
    areaController.createArea
);

/**
 * GET /api/areas/:id - Get area by ID
 */
router.get('/:id',
    checkPermission('areas', 'read'),
    validateId,
    areaController.getAreaById
);

/**
 * PUT /api/areas/:id - Update area
 */
router.put('/:id',
    checkPermission('areas', 'update'),
    validateId,
    areaController.updateArea
);

/**
 * DELETE /api/areas/:id - Delete area (soft delete)
 */
router.delete('/:id',
    checkPermission('areas', 'delete'),
    validateId,
    areaController.deleteArea
);

module.exports = router;

