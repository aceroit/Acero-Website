const Media = require('../models/Media');
const uploadService = require('../services/uploadService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseFormatter');

/**
 * Upload single or multiple media files
 */
exports.uploadMedia = async (req, res) => {
    try {
        const { folder = 'media', tags, description, altText } = req.body;

        // Check if files were uploaded
        if (!req.files || (Array.isArray(req.files) && req.files.length === 0) || 
            (!Array.isArray(req.files) && Object.keys(req.files).length === 0)) {
            return errorResponse(res, 400, 'No files uploaded');
        }

        const options = {
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            description: description || '',
            altText: altText || ''
        };

        let uploadedMedia;

        // Handle multiple files
        if (req.files.files) {
            // express-fileupload with multiple files
            const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
            
            const results = [];
            for (const file of files) {
                const fileExt = file.name.split('.').pop().toLowerCase();
                const videoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,webm,mov').split(',');
                
                let media;
                if (videoTypes.includes(fileExt)) {
                    media = await uploadService.uploadVideo(file, folder, options, req.user.id);
                } else {
                    media = await uploadService.uploadImage(file, folder, options, req.user.id);
                }
                results.push(media);
            }
            uploadedMedia = results;
        } else if (Array.isArray(req.files)) {
            // multer with multiple files
            const results = [];
            for (const file of req.files) {
                const fileExt = file.originalname.split('.').pop().toLowerCase();
                const videoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,webm,mov').split(',');
                
                let media;
                if (videoTypes.includes(fileExt)) {
                    media = await uploadService.uploadVideo(file, folder, options, req.user.id);
                } else {
                    media = await uploadService.uploadImage(file, folder, options, req.user.id);
                }
                results.push(media);
            }
            uploadedMedia = results;
        } else {
            // Single file
            const file = req.files.file || req.files[Object.keys(req.files)[0]];
            const fileExt = (file.name || file.originalname).split('.').pop().toLowerCase();
            const videoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,webm,mov').split(',');
            
            if (videoTypes.includes(fileExt)) {
                uploadedMedia = await uploadService.uploadVideo(file, folder, options, req.user.id);
            } else {
                uploadedMedia = await uploadService.uploadImage(file, folder, options, req.user.id);
            }
        }

        return successResponse(
            res,
            201,
            'Media uploaded successfully',
            { media: uploadedMedia }
        );
    } catch (error) {
        console.error('Upload media error:', error);
        return errorResponse(res, 500, 'Failed to upload media', error.message);
    }
};

/**
 * Get all media with filters and pagination
 */
exports.getAllMedia = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            resourceType,
            folder,
            uploadedBy,
            tags,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { isActive: true };

        if (resourceType) query.resourceType = resourceType;
        if (folder) query.folder = folder;
        if (uploadedBy) query.uploadedBy = uploadedBy;
        if (tags) {
            const tagArray = tags.split(',').map(t => t.trim());
            query.tags = { $in: tagArray };
        }

        // Non-admin users can only see their own media
        if (!['super_admin', 'admin'].includes(req.user.role)) {
            query.uploadedBy = req.user.id;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [media, total] = await Promise.all([
            Media.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('uploadedBy', 'firstName lastName email')
                .lean(),
            Media.countDocuments(query)
        ]);

        return paginatedResponse(
            res,
            media,
            page,
            limit,
            total,
            'Media retrieved successfully'
        );
    } catch (error) {
        console.error('Get all media error:', error);
        return errorResponse(res, 500, 'Failed to retrieve media', error.message);
    }
};

/**
 * Get single media by ID
 */
exports.getMediaById = async (req, res) => {
    try {
        const { id } = req.params;

        const media = await Media.findById(id)
            .populate('uploadedBy', 'firstName lastName email role');

        if (!media) {
            return errorResponse(res, 404, 'Media not found');
        }

        // Check permission - users can only view their own unless admin
        if (!['super_admin', 'admin'].includes(req.user.role) && 
            media.uploadedBy._id.toString() !== req.user.id) {
            return errorResponse(res, 403, 'You do not have permission to view this media');
        }

        return successResponse(res, 200, 'Media retrieved successfully', { media });
    } catch (error) {
        console.error('Get media by ID error:', error);
        return errorResponse(res, 500, 'Failed to retrieve media', error.message);
    }
};

/**
 * Update media metadata
 */
exports.updateMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const { filename, tags, description, altText, isPublic } = req.body;

        const media = await Media.findById(id);

        if (!media) {
            return errorResponse(res, 404, 'Media not found');
        }

        // Check permission - only uploader or admin can update
        if (!['super_admin', 'admin'].includes(req.user.role) && 
            media.uploadedBy.toString() !== req.user.id) {
            return errorResponse(res, 403, 'You do not have permission to update this media');
        }

        // Update fields
        if (filename) media.filename = filename;
        if (tags) media.tags = tags.split(',').map(t => t.trim());
        if (description !== undefined) media.description = description;
        if (altText !== undefined) media.altText = altText;
        if (isPublic !== undefined) media.isPublic = isPublic;

        await media.save();

        return successResponse(res, 200, 'Media updated successfully', { media });
    } catch (error) {
        console.error('Update media error:', error);
        return errorResponse(res, 500, 'Failed to update media', error.message);
    }
};

/**
 * Delete media
 */
exports.deleteMedia = async (req, res) => {
    try {
        const { id } = req.params;

        const media = await Media.findById(id);

        if (!media) {
            return errorResponse(res, 404, 'Media not found');
        }

        // Check permission - only uploader or admin can delete
        if (!['super_admin', 'admin'].includes(req.user.role) && 
            media.uploadedBy.toString() !== req.user.id) {
            return errorResponse(res, 403, 'You do not have permission to delete this media');
        }

        // Check if media is in use
        if (media.usedIn && media.usedIn.length > 0) {
            return errorResponse(
                res,
                400,
                'Cannot delete media that is currently in use',
                { usedIn: media.usedIn }
            );
        }

        // Delete from Cloudinary and database
        await uploadService.deleteFile(id);

        return successResponse(res, 200, 'Media deleted successfully');
    } catch (error) {
        console.error('Delete media error:', error);
        return errorResponse(res, 500, 'Failed to delete media', error.message);
    }
};

/**
 * Get media usage information
 */
exports.getMediaUsage = async (req, res) => {
    try {
        const { id } = req.params;

        const media = await Media.findById(id).select('usedIn filename');

        if (!media) {
            return errorResponse(res, 404, 'Media not found');
        }

        return successResponse(res, 200, 'Media usage retrieved successfully', {
            filename: media.filename,
            usageCount: media.usedIn.length,
            usedIn: media.usedIn
        });
    } catch (error) {
        console.error('Get media usage error:', error);
        return errorResponse(res, 500, 'Failed to retrieve media usage', error.message);
    }
};

/**
 * Search media
 */
exports.searchMedia = async (req, res) => {
    try {
        const {
            query,
            page = 1,
            limit = 50,
            resourceType,
            folder
        } = req.query;

        if (!query) {
            return errorResponse(res, 400, 'Search query is required');
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            resourceType,
            folder
        };

        // Non-admin users can only search their own media
        if (!['super_admin', 'admin'].includes(req.user.role)) {
            options.uploadedBy = req.user.id;
        }

        const result = await Media.searchMedia(query, options);

        return paginatedResponse(
            res,
            result.media,
            result.page,
            result.limit,
            result.total,
            'Media search completed'
        );
    } catch (error) {
        console.error('Search media error:', error);
        return errorResponse(res, 500, 'Failed to search media', error.message);
    }
};

/**
 * Get media by folder
 */
exports.getMediaByFolder = async (req, res) => {
    try {
        const { folder } = req.params;
        const {
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder
        };

        const result = await Media.getByFolder(folder, options);

        return paginatedResponse(
            res,
            result.media,
            result.page,
            result.limit,
            result.total,
            `Media from folder '${folder}' retrieved successfully`
        );
    } catch (error) {
        console.error('Get media by folder error:', error);
        return errorResponse(res, 500, 'Failed to retrieve media by folder', error.message);
    }
};

/**
 * Bulk delete media
 */
exports.bulkDeleteMedia = async (req, res) => {
    try {
        const { mediaIds } = req.body;

        if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
            return errorResponse(res, 400, 'Media IDs array is required');
        }

        const results = {
            deleted: [],
            failed: [],
            inUse: []
        };

        for (const id of mediaIds) {
            try {
                const media = await Media.findById(id);

                if (!media) {
                    results.failed.push({ id, reason: 'Media not found' });
                    continue;
                }

                // Check if media is in use
                if (media.usedIn && media.usedIn.length > 0) {
                    results.inUse.push({ id, usedIn: media.usedIn });
                    continue;
                }

                // Delete from Cloudinary and database
                await uploadService.deleteFile(id);
                results.deleted.push(id);
            } catch (error) {
                results.failed.push({ id, reason: error.message });
            }
        }

        return successResponse(res, 200, 'Bulk delete completed', results);
    } catch (error) {
        console.error('Bulk delete media error:', error);
        return errorResponse(res, 500, 'Failed to bulk delete media', error.message);
    }
};

/**
 * Get media library statistics
 */
exports.getMediaStats = async (req, res) => {
    try {
        const query = { isActive: true };

        // Non-admin users can only see their own stats
        if (!['super_admin', 'admin'].includes(req.user.role)) {
            query.uploadedBy = req.user.id;
        }

        const [
            totalMedia,
            totalSize,
            byResourceType,
            byFolder,
            recentUploads
        ] = await Promise.all([
            Media.countDocuments(query),
            Media.aggregate([
                { $match: query },
                { $group: { _id: null, total: { $sum: '$size' } } }
            ]),
            Media.aggregate([
                { $match: query },
                { $group: { _id: '$resourceType', count: { $sum: 1 } } }
            ]),
            Media.aggregate([
                { $match: query },
                { $group: { _id: '$folder', count: { $sum: 1 } } }
            ]),
            Media.find(query)
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('uploadedBy', 'firstName lastName email')
                .lean()
        ]);

        const stats = {
            totalMedia,
            totalSize: totalSize[0]?.total || 0,
            totalSizeFormatted: formatBytes(totalSize[0]?.total || 0),
            byResourceType,
            byFolder,
            recentUploads
        };

        return successResponse(res, 200, 'Media statistics retrieved successfully', stats);
    } catch (error) {
        console.error('Get media stats error:', error);
        return errorResponse(res, 500, 'Failed to retrieve media statistics', error.message);
    }
};

/**
 * Helper function to format bytes
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

