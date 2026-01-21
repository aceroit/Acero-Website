const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const googleReCaptchaController = require('../controllers/googleReCaptchaController');

// Apply authentication to all routes
router.use(authenticate);

// List
router.get(
    '/',
    checkPermission('google-recaptcha', 'read'),
    googleReCaptchaController.getAllReCaptcha
);

// Get by id
router.get(
    '/:id',
    checkPermission('google-recaptcha', 'read'),
    googleReCaptchaController.getReCaptchaById
);

// Create
router.post(
    '/',
    checkPermission('google-recaptcha', 'create'),
    googleReCaptchaController.createReCaptcha
);

// Update
router.put(
    '/:id',
    checkPermission('google-recaptcha', 'update'),
    googleReCaptchaController.updateReCaptcha
);

// Delete (soft)
router.delete(
    '/:id',
    checkPermission('google-recaptcha', 'delete'),
    googleReCaptchaController.deleteReCaptcha
);

module.exports = router;


