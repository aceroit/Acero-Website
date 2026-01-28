const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const footerConfigurationController = require('../controllers/footerConfigurationController');

// Apply authentication to all routes
router.use(authenticate);

// List
router.get(
    '/',
    checkPermission('footer-configurations', 'read'),
    footerConfigurationController.getAllFooters
);

// Get by id
router.get(
    '/:id',
    checkPermission('footer-configurations', 'read'),
    footerConfigurationController.getFooterById
);

// Create
router.post(
    '/',
    checkPermission('footer-configurations', 'create'),
    footerConfigurationController.createFooter
);

// Update
router.put(
    '/:id',
    checkPermission('footer-configurations', 'update'),
    footerConfigurationController.updateFooter
);

// Delete (soft)
router.delete(
    '/:id',
    checkPermission('footer-configurations', 'delete'),
    footerConfigurationController.deleteFooter
);

module.exports = router;

