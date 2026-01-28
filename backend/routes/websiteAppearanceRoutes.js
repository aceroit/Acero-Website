const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const websiteAppearanceController = require('../controllers/websiteAppearanceController');

// Apply authentication to all routes
router.use(authenticate);

// List
router.get(
    '/',
    checkPermission('website-appearance', 'read'),
    websiteAppearanceController.getAllAppearances
);

// Get by id
router.get(
    '/:id',
    checkPermission('website-appearance', 'read'),
    websiteAppearanceController.getAppearanceById
);

// Create
router.post(
    '/',
    checkPermission('website-appearance', 'create'),
    websiteAppearanceController.createAppearance
);

// Update
router.put(
    '/:id',
    checkPermission('website-appearance', 'update'),
    websiteAppearanceController.updateAppearance
);

// Delete (soft)
router.delete(
    '/:id',
    checkPermission('website-appearance', 'delete'),
    websiteAppearanceController.deleteAppearance
);

module.exports = router;

