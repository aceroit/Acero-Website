const express = require('express');
const router = express.Router();
const formConfigurationController = require('../controllers/formConfigurationController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// GET /api/form-configurations - list
router.get(
    '/',
    checkPermission('form-configurations', 'read'),
    formConfigurationController.getAllConfigs
);

// GET /api/form-configurations/active - get active config
router.get(
    '/active',
    checkPermission('form-configurations', 'read'),
    formConfigurationController.getActiveConfig
);

// POST /api/form-configurations - create
router.post(
    '/',
    checkPermission('form-configurations', 'create'),
    formConfigurationController.createConfig
);

// PUT /api/form-configurations/:id - update
router.put(
    '/:id',
    checkPermission('form-configurations', 'update'),
    validateId,
    formConfigurationController.updateConfig
);

// DELETE /api/form-configurations/:id - delete
router.delete(
    '/:id',
    checkPermission('form-configurations', 'delete'),
    validateId,
    formConfigurationController.deleteConfig
);

module.exports = router;


