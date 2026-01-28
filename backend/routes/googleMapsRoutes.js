const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const googleMapsController = require('../controllers/googleMapsController');

// Apply authentication to all routes
router.use(authenticate);

// List
router.get(
    '/',
    checkPermission('google-maps', 'read'),
    googleMapsController.getAllMaps
);

// Get by id
router.get(
    '/:id',
    checkPermission('google-maps', 'read'),
    googleMapsController.getMapById
);

// Create
router.post(
    '/',
    checkPermission('google-maps', 'create'),
    googleMapsController.createMap
);

// Update
router.put(
    '/:id',
    checkPermission('google-maps', 'update'),
    googleMapsController.updateMap
);

// Delete (soft)
router.delete(
    '/:id',
    checkPermission('google-maps', 'delete'),
    googleMapsController.deleteMap
);

module.exports = router;


