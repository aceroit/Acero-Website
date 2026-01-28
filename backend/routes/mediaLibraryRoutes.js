const express = require('express');
const router = express.Router();
const mediaLibraryController = require('../controllers/mediaLibraryController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/media-library - Get all media (with filters and pagination)
 */
router.get('/',
    checkPermission('media-library', 'read'),
    mediaLibraryController.getAllMedia
);

/**
 * GET /api/media-library/folders - Get list of folders
 */
router.get('/folders',
    checkPermission('media-library', 'read'),
    mediaLibraryController.getFolders
);

/**
 * GET /api/media-library/:id - Get single media by ID
 */
router.get('/:id',
    checkPermission('media-library', 'read'),
    validateId,
    mediaLibraryController.getMediaById
);

/**
 * POST /api/media-library - Create new media (file upload or YouTube link)
 */
router.post('/',
    checkPermission('media-library', 'create'),
    mediaLibraryController.createMedia
);

/**
 * PUT /api/media-library/:id - Update media
 */
router.put('/:id',
    checkPermission('media-library', 'update'),
    validateId,
    mediaLibraryController.updateMedia
);

/**
 * DELETE /api/media-library/:id - Delete media (soft delete)
 */
router.delete('/:id',
    checkPermission('media-library', 'delete'),
    validateId,
    mediaLibraryController.deleteMedia
);

/**
 * POST /api/media-library/bulk-delete - Bulk delete media
 */
router.post('/bulk-delete',
    checkPermission('media-library', 'delete'),
    mediaLibraryController.bulkDeleteMedia
);

module.exports = router;
