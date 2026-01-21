const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const smtpSettingsController = require('../controllers/smtpSettingsController');

// Apply authentication to all routes
router.use(authenticate);

// List
router.get(
    '/',
    checkPermission('smtp-settings', 'read'),
    smtpSettingsController.getAllSMTPSettings
);

// Get by id
router.get(
    '/:id',
    checkPermission('smtp-settings', 'read'),
    smtpSettingsController.getSMTPSettingsById
);

// Create
router.post(
    '/',
    checkPermission('smtp-settings', 'create'),
    smtpSettingsController.createSMTPSettings
);

// Update
router.put(
    '/:id',
    checkPermission('smtp-settings', 'update'),
    smtpSettingsController.updateSMTPSettings
);

// Delete (soft)
router.delete(
    '/:id',
    checkPermission('smtp-settings', 'delete'),
    smtpSettingsController.deleteSMTPSettings
);

module.exports = router;


