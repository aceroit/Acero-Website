const express = require('express');
const router = express.Router();
const companyUpdateCategoryController = require('../controllers/companyUpdateCategoryController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/company-update-categories - Get all company update categories (with filters and pagination)
 */
router.get('/',
    checkPermission('company-update-categories', 'read'),
    companyUpdateCategoryController.getAllCompanyUpdateCategories
);

/**
 * POST /api/company-update-categories - Create new company update category
 */
router.post('/',
    checkPermission('company-update-categories', 'create'),
    companyUpdateCategoryController.createCompanyUpdateCategory
);

/**
 * GET /api/company-update-categories/slug/:slug - Get company update category by slug
 */
router.get('/slug/:slug',
    checkPermission('company-update-categories', 'read'),
    companyUpdateCategoryController.getCompanyUpdateCategoryBySlug
);

/**
 * GET /api/company-update-categories/:id - Get company update category by ID
 */
router.get('/:id',
    checkPermission('company-update-categories', 'read'),
    validateId,
    companyUpdateCategoryController.getCompanyUpdateCategoryById
);

/**
 * PUT /api/company-update-categories/:id - Update company update category
 */
router.put('/:id',
    checkPermission('company-update-categories', 'update'),
    validateId,
    companyUpdateCategoryController.updateCompanyUpdateCategory
);

/**
 * DELETE /api/company-update-categories/:id - Delete company update category (soft delete)
 */
router.delete('/:id',
    checkPermission('company-update-categories', 'delete'),
    validateId,
    companyUpdateCategoryController.deleteCompanyUpdateCategory
);

module.exports = router;

