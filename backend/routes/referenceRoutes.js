const express = require('express');
const router = express.Router();
const referenceController = require('../controllers/referenceController');
const { authenticate } = require('../middleware/auth');

/**
 * Reference Data Routes
 * These routes provide reference data for dropdowns and filters
 * All routes require authentication
 */

/**
 * GET /api/reference/countries - Get all active countries
 */
router.get('/countries',
    authenticate,
    referenceController.getCountries
);

/**
 * GET /api/reference/regions - Get all active regions
 * Query params: country (optional) - Filter by country ID
 */
router.get('/regions',
    authenticate,
    referenceController.getRegions
);

/**
 * GET /api/reference/areas - Get all active areas
 * Query params: region (optional) - Filter by region ID
 * Query params: country (optional) - Filter by country ID
 */
router.get('/areas',
    authenticate,
    referenceController.getAreas
);

/**
 * GET /api/reference/industries - Get all active industries
 */
router.get('/industries',
    authenticate,
    referenceController.getIndustries
);

/**
 * GET /api/reference/building-types - Get all active building types
 */
router.get('/building-types',
    authenticate,
    referenceController.getBuildingTypes
);

module.exports = router;

