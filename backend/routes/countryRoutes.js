const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/countries - Get all countries (with filters and pagination)
 */
router.get('/',
    checkPermission('countries', 'read'),
    countryController.getAllCountries
);

/**
 * POST /api/countries - Create new country
 */
router.post('/',
    checkPermission('countries', 'create'),
    countryController.createCountry
);

/**
 * GET /api/countries/code/:code - Get country by code
 */
router.get('/code/:code',
    checkPermission('countries', 'read'),
    countryController.getCountryByCode
);

/**
 * GET /api/countries/:id - Get country by ID
 */
router.get('/:id',
    checkPermission('countries', 'read'),
    validateId,
    countryController.getCountryById
);

/**
 * PUT /api/countries/:id - Update country
 */
router.put('/:id',
    checkPermission('countries', 'update'),
    validateId,
    countryController.updateCountry
);

/**
 * DELETE /api/countries/:id - Delete country (soft delete)
 */
router.delete('/:id',
    checkPermission('countries', 'delete'),
    validateId,
    countryController.deleteCountry
);

module.exports = router;

