const express = require('express');
const router = express.Router();
const industryController = require('../controllers/industryController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/industries - Get all industries (with filters and pagination)
 */
router.get('/',
    checkPermission('industries', 'read'),
    industryController.getAllIndustries
);

/**
 * POST /api/industries - Create new industry
 */
router.post('/',
    checkPermission('industries', 'create'),
    industryController.createIndustry
);

/**
 * GET /api/industries/slug/:slug - Get industry by slug
 */
router.get('/slug/:slug',
    checkPermission('industries', 'read'),
    industryController.getIndustryBySlug
);

/**
 * GET /api/industries/:id - Get industry by ID
 */
router.get('/:id',
    checkPermission('industries', 'read'),
    validateId,
    industryController.getIndustryById
);

/**
 * PUT /api/industries/:id - Update industry
 */
router.put('/:id',
    checkPermission('industries', 'update'),
    validateId,
    industryController.updateIndustry
);

/**
 * DELETE /api/industries/:id - Delete industry (soft delete)
 */
router.delete('/:id',
    checkPermission('industries', 'delete'),
    validateId,
    industryController.deleteIndustry
);

module.exports = router;

