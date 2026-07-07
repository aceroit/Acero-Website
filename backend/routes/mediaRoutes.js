const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate, authorize } = require('../middleware/auth');
const fileUpload = require('express-fileupload');
const { getUploadTempDir } = require('../utils/localFileStorage');

// Configure file upload middleware
const uploadMiddleware = fileUpload({
    useTempFiles: true,
    tempFileDir: getUploadTempDir(),
    limits: {
        fileSize: parseInt(process.env.MAX_VIDEO_SIZE || 104857600) // 100MB max
    },
    abortOnLimit: true,
    createParentPath: true
});

/**
 * Media Routes
 * All routes require authentication
 */

// Upload media (editor+)
router.post(
    '/upload',
    authenticate,
    authorize('super_admin', 'admin', 'approver', 'reviewer', 'editor'),
    uploadMiddleware,
    mediaController.uploadMedia
);

// Get all media (paginated, filtered)
router.get(
    '/',
    authenticate,
    mediaController.getAllMedia
);

// Get media statistics (admin+)
router.get(
    '/stats',
    authenticate,
    authorize('super_admin', 'admin', 'approver'),
    mediaController.getMediaStats
);

// Search media
router.get(
    '/search',
    authenticate,
    mediaController.searchMedia
);

// Get media by folder
router.get(
    '/folder/:folder',
    authenticate,
    mediaController.getMediaByFolder
);

// Get single media by ID
router.get(
    '/:id',
    authenticate,
    mediaController.getMediaById
);

// Update media metadata (uploader or admin)
router.put(
    '/:id',
    authenticate,
    mediaController.updateMedia
);

// Delete media (uploader or admin)
router.delete(
    '/:id',
    authenticate,
    mediaController.deleteMedia
);

// Get media usage info
router.get(
    '/:id/usage',
    authenticate,
    mediaController.getMediaUsage
);

// Bulk delete media (admin+)
router.post(
    '/bulk-delete',
    authenticate,
    authorize('super_admin', 'admin'),
    mediaController.bulkDeleteMedia
);

module.exports = router;

