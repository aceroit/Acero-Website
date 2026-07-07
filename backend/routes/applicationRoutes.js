const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// GET /api/applications - list
router.get(
    '/',
    checkPermission('applications', 'read'),
    applicationController.getAllApplications
);


// GET /api/applications/filters - filter option values
router.get(
    '/filters',
    checkPermission('applications', 'read'),
    applicationController.getApplicationFilters
);

// GET /api/applications/export/excel - export filtered applications to Excel
router.get(
    '/export/excel',
    checkPermission('applications', 'read'),
    applicationController.exportApplicationsExcel
);

// GET /api/applications/export/pdf - export filtered applications to PDF
router.get(
    '/export/pdf',
    checkPermission('applications', 'read'),
    applicationController.exportApplicationsPdf
);

// GET /api/applications/export/zip - export filtered application CV files as ZIP
router.get(
    '/export/zip',
    checkPermission('applications', 'read'),
    applicationController.exportApplicationsZip
);
// GET /api/applications/:id - get by id
router.get(
    '/:id',
    checkPermission('applications', 'read'),
    validateId,
    applicationController.getApplicationById
);

// POST /api/applications - create
router.post(
    '/',
    checkPermission('applications', 'create'),
    applicationController.createApplication
);

// PUT /api/applications/:id - update
router.put(
    '/:id',
    checkPermission('applications', 'update'),
    validateId,
    applicationController.updateApplication
);

// DELETE /api/applications/:id - soft delete
router.delete(
    '/:id',
    checkPermission('applications', 'delete'),
    validateId,
    applicationController.deleteApplication
);

// PUT /api/applications/:id/mark-reviewing
router.put(
    '/:id/mark-reviewing',
    checkPermission('applications', 'update'),
    validateId,
    applicationController.markReviewing
);

// PUT /api/applications/:id/shortlist
router.put(
    '/:id/shortlist',
    checkPermission('applications', 'update'),
    validateId,
    applicationController.shortlistApplication
);

// PUT /api/applications/:id/reject
router.put(
    '/:id/reject',
    checkPermission('applications', 'update'),
    validateId,
    applicationController.rejectApplication
);

// PUT /api/applications/:id/archive
router.put(
    '/:id/archive',
    checkPermission('applications', 'update'),
    validateId,
    applicationController.archiveApplication
);

module.exports = router;


