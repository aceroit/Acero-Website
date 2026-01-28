const express = require('express');
const router = express.Router();
const brochureController = require('../controllers/brochureController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/brochures - Get all brochures (with filters and pagination)
 */
router.get('/',
    checkPermission('brochures', 'read'),
    brochureController.getAllBrochures
);

/**
 * POST /api/brochures - Create new brochure
 */
router.post('/',
    checkPermission('brochures', 'create'),
    brochureController.createBrochure
);

/**
 * GET /api/brochures/:id - Get brochure by ID
 */
router.get('/:id',
    checkPermission('brochures', 'read'),
    validateId,
    brochureController.getBrochureById
);

/**
 * PUT /api/brochures/:id - Update brochure
 */
router.put('/:id',
    checkPermission('brochures', 'update'),
    validateId,
    brochureController.updateBrochure
);

/**
 * DELETE /api/brochures/:id - Delete brochure (soft delete)
 */
router.delete('/:id',
    checkPermission('brochures', 'delete'),
    validateId,
    brochureController.deleteBrochure
);

module.exports = router;

