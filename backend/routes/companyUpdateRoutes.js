const express = require('express');
const router = express.Router();
const companyUpdateController = require('../controllers/companyUpdateController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/company-updates - Get all company updates (with filters and pagination)
 */
router.get('/',
    checkPermission('company-updates', 'read'),
    companyUpdateController.getAllCompanyUpdates
);

/**
 * POST /api/company-updates - Create new company update
 */
router.post('/',
    checkPermission('company-updates', 'create'),
    companyUpdateController.createCompanyUpdate
);

/**
 * GET /api/company-updates/slug/:slug - Get company update by slug
 */
router.get('/slug/:slug',
    checkPermission('company-updates', 'read'),
    companyUpdateController.getCompanyUpdateBySlug
);

/**
 * GET /api/company-updates/:id - Get company update by ID
 */
router.get('/:id',
    checkPermission('company-updates', 'read'),
    validateId,
    companyUpdateController.getCompanyUpdateById
);

/**
 * PUT /api/company-updates/:id - Update company update
 */
router.put('/:id',
    checkPermission('company-updates', 'update'),
    validateId,
    companyUpdateController.updateCompanyUpdate
);

/**
 * DELETE /api/company-updates/:id - Delete company update (soft delete)
 */
router.delete('/:id',
    checkPermission('company-updates', 'delete'),
    validateId,
    companyUpdateController.deleteCompanyUpdate
);

module.exports = router;

