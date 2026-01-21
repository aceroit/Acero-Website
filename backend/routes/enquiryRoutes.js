const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// GET /api/enquiries - list
router.get(
    '/',
    checkPermission('enquiries', 'read'),
    enquiryController.getAllEnquiries
);

// GET /api/enquiries/:id - get by id
router.get(
    '/:id',
    checkPermission('enquiries', 'read'),
    validateId,
    enquiryController.getEnquiryById
);

// POST /api/enquiries - create
router.post(
    '/',
    checkPermission('enquiries', 'create'),
    enquiryController.createEnquiry
);

// PUT /api/enquiries/:id - update
router.put(
    '/:id',
    checkPermission('enquiries', 'update'),
    validateId,
    enquiryController.updateEnquiry
);

// DELETE /api/enquiries/:id - soft delete
router.delete(
    '/:id',
    checkPermission('enquiries', 'delete'),
    validateId,
    enquiryController.deleteEnquiry
);

// PUT /api/enquiries/:id/mark-read
router.put(
    '/:id/mark-read',
    checkPermission('enquiries', 'update'),
    validateId,
    enquiryController.markRead
);

// PUT /api/enquiries/:id/mark-replied
router.put(
    '/:id/mark-replied',
    checkPermission('enquiries', 'update'),
    validateId,
    enquiryController.markReplied
);

// PUT /api/enquiries/:id/archive
router.put(
    '/:id/archive',
    checkPermission('enquiries', 'update'),
    validateId,
    enquiryController.archiveEnquiry
);

module.exports = router;


