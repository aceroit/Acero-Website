const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const headerConfigurationController = require('../controllers/headerConfigurationController');

// Apply authentication to all routes
router.use(authenticate);

// List
router.get(
    '/',
    checkPermission('header-configurations', 'read'),
    headerConfigurationController.getAllHeaders
);

// Get by id
router.get(
    '/:id',
    checkPermission('header-configurations', 'read'),
    headerConfigurationController.getHeaderById
);

// Create
router.post(
    '/',
    checkPermission('header-configurations', 'create'),
    headerConfigurationController.createHeader
);

// Update
router.put(
    '/:id',
    checkPermission('header-configurations', 'update'),
    headerConfigurationController.updateHeader
);

// Delete (soft)
router.delete(
    '/:id',
    checkPermission('header-configurations', 'delete'),
    headerConfigurationController.deleteHeader
);

module.exports = router;

