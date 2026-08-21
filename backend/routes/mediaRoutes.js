const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate, authorize } = require('../middleware/auth');
const fileUpload = require('express-fileupload');
const { getUploadTempDir } = require('../utils/localFileStorage');

function formatBytes(bytes) {
    if (!bytes) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${Math.round((bytes / Math.pow(1024, index)) * 100) / 100} ${units[index]}`;
}

const maxMediaUploadSize = parseInt(
    process.env.MAX_MEDIA_UPLOAD_SIZE || process.env.MAX_VIDEO_SIZE || 104857600,
    10
);

// Configure file upload middleware
const uploadMiddleware = fileUpload({
    useTempFiles: true,
    tempFileDir: getUploadTempDir(),
    limits: {
        fileSize: maxMediaUploadSize
    },
    abortOnLimit: true,
    createParentPath: true,
    limitHandler: (req, res) => res.status(413).json({
        success: false,
        message: `File upload too large. Maximum upload request size is ${formatBytes(maxMediaUploadSize)}.`
    })
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

