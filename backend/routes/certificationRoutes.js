const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certificationController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/certifications - Get all certifications (with filters and pagination)
 */
router.get('/',
    checkPermission('certifications', 'read'),
    certificationController.getAllCertifications
);

/**
 * POST /api/certifications - Create new certification
 */
router.post('/',
    checkPermission('certifications', 'create'),
    certificationController.createCertification
);

/**
 * GET /api/certifications/:id - Get certification by ID
 */
router.get('/:id',
    checkPermission('certifications', 'read'),
    validateId,
    certificationController.getCertificationById
);

/**
 * PUT /api/certifications/:id - Update certification
 */
router.put('/:id',
    checkPermission('certifications', 'update'),
    validateId,
    certificationController.updateCertification
);

/**
 * DELETE /api/certifications/:id - Delete certification (soft delete)
 */
router.delete('/:id',
    checkPermission('certifications', 'delete'),
    validateId,
    certificationController.deleteCertification
);

module.exports = router;

