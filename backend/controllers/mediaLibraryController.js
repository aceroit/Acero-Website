const Media = require('../models/Media');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseFormatter');
const { extractYouTubeId, getYouTubeThumbnail, isValidYouTubeUrl, normalizeYouTubeUrl } = require('../utils/youtubeUtils');

/**
 * Get all media (with filtering and pagination)
 */
exports.getAllMedia = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            resourceType,
            folder,
            search,
            tags,
            uploadedBy,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (resourceType) {
            if (resourceType === 'youtube') {
                // Filter for YouTube links
                query.youtubeId = { $exists: true, $ne: null };
            } else {
                query.resourceType = resourceType;
            }
        }
        if (folder) query.folder = folder;
        if (uploadedBy) query.uploadedBy = uploadedBy;
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            query.tags = { $in: tagArray };
        }
        if (search) {
            query.$or = [
                { filename: new RegExp(search, 'i') },
                { originalName: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { altText: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [media, total] = await Promise.all([
            Media.find(query)
                .populate('uploadedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
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
        console.error('Error in getAllMedia:', error);
        return errorResponse(res, 500, 'Failed to retrieve media', error.message);
    }
};

/**
 * Get single media by ID
 */
exports.getMediaById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const media = await Media.findOne({ _id: id, isActive: true })
            .populate('uploadedBy', 'firstName lastName email')
            .lean();
        
        if (!media) {
            return errorResponse(res, 404, 'Media not found');
        }

        return successResponse(res, 200, 'Media retrieved successfully', { media });
    } catch (error) {
        console.error('Error in getMediaById:', error);
        return errorResponse(res, 500, 'Failed to retrieve media', error.message);
    }
};

/**
 * Create new media (file upload or YouTube link)
 */
exports.createMedia = async (req, res) => {
    try {
        const {
            filename,
            originalName,
            publicId,
            url,
            secureUrl,
            resourceType,
            format,
            size,
            width,
            height,
            duration,
            folder,
            tags,
            description,
            altText,
            youtubeUrl
        } = req.body;

        // Check if this is a YouTube link
        if (youtubeUrl) {
            if (!isValidYouTubeUrl(youtubeUrl)) {
                return errorResponse(res, 400, 'Invalid YouTube URL');
            }

            const videoId = extractYouTubeId(youtubeUrl);
            if (!videoId) {
                return errorResponse(res, 400, 'Could not extract YouTube video ID');
            }

            const thumbnailUrl = getYouTubeThumbnail(videoId);
            const normalizedUrl = normalizeYouTubeUrl(youtubeUrl);

            // Create media entry for YouTube link
            const media = new Media({
                filename: filename || `YouTube Video ${videoId}`,
                originalName: originalName || youtubeUrl,
                publicId: `youtube_${videoId}`, // Use video ID as publicId
                url: normalizedUrl,
                secureUrl: normalizedUrl,
                resourceType: 'video',
                format: 'youtube',
                size: 0, // YouTube videos don't have file size
                width: width || null,
                height: height || null,
                duration: duration || null,
                folder: folder || 'videos',
                tags: tags || [],
                description: description || '',
                altText: altText || '',
                youtubeUrl: normalizedUrl,
                youtubeId: videoId,
                youtubeThumbnail: thumbnailUrl,
                uploadedBy: req.user._id,
                isPublic: true,
                isActive: true
            });

            await media.save();

            const populatedMedia = await Media.findById(media._id)
                .populate('uploadedBy', 'firstName lastName email')
                .lean();

            return successResponse(
                res,
                201,
                'YouTube link added successfully',
                { media: populatedMedia }
            );
        }

        // Regular file upload
        if (!filename || !originalName || !publicId || !url || !secureUrl || !size) {
            return errorResponse(res, 400, 'Missing required fields for file upload');
        }

        const media = new Media({
            filename,
            originalName,
            publicId,
            url,
            secureUrl,
            resourceType: resourceType || 'image',
            format,
            size,
            width: width || null,
            height: height || null,
            duration: duration || null,
            folder: folder || 'media',
            tags: tags || [],
            description: description || '',
            altText: altText || '',
            uploadedBy: req.user._id,
            isPublic: true,
            isActive: true
        });

        await media.save();

        const populatedMedia = await Media.findById(media._id)
            .populate('uploadedBy', 'firstName lastName email')
            .lean();

        return successResponse(
            res,
            201,
            'Media created successfully',
            { media: populatedMedia }
        );
    } catch (error) {
        console.error('Error in createMedia:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Media with this publicId already exists');
        }
        return errorResponse(res, 500, 'Failed to create media', error.message);
    }
};

/**
 * Update media
 */
exports.updateMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            filename,
            description,
            altText,
            folder,
            tags,
            youtubeUrl
        } = req.body;

        const media = await Media.findById(id);
        if (!media) {
            return errorResponse(res, 404, 'Media not found');
        }

        if (!media.isActive) {
            return errorResponse(res, 404, 'Media not found');
        }

        // Update YouTube link if provided
        if (youtubeUrl && media.youtubeId) {
            if (!isValidYouTubeUrl(youtubeUrl)) {
                return errorResponse(res, 400, 'Invalid YouTube URL');
            }

            const videoId = extractYouTubeId(youtubeUrl);
            if (!videoId) {
                return errorResponse(res, 400, 'Could not extract YouTube video ID');
            }

            const thumbnailUrl = getYouTubeThumbnail(videoId);
            const normalizedUrl = normalizeYouTubeUrl(youtubeUrl);

            media.youtubeUrl = normalizedUrl;
            media.youtubeId = videoId;
            media.youtubeThumbnail = thumbnailUrl;
            media.url = normalizedUrl;
            media.secureUrl = normalizedUrl;
        }

        // Update other fields
        if (filename !== undefined) media.filename = filename;
        if (description !== undefined) media.description = description;
        if (altText !== undefined) media.altText = altText;
        if (folder !== undefined) media.folder = folder;
        if (tags !== undefined) media.tags = Array.isArray(tags) ? tags : [];

        await media.save();

        const populatedMedia = await Media.findById(media._id)
            .populate('uploadedBy', 'firstName lastName email')
            .lean();

        return successResponse(
            res,
            200,
            'Media updated successfully',
            { media: populatedMedia }
        );
    } catch (error) {
        console.error('Error in updateMedia:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update media', error.message);
    }
};

/**
 * Delete media (soft delete)
 */
exports.deleteMedia = async (req, res) => {
    try {
        const { id } = req.params;

        const media = await Media.findById(id);
        if (!media) {
            return errorResponse(res, 404, 'Media not found');
        }

        if (!media.isActive) {
            return errorResponse(res, 404, 'Media not found');
        }

        // Check if media is in use
        const isInUse = await Media.isInUse(id);
        if (isInUse) {
            return errorResponse(res, 400, 'Cannot delete media that is currently in use');
        }

        // Soft delete
        media.isActive = false;
        await media.save();

        return successResponse(res, 200, 'Media deleted successfully');
    } catch (error) {
        console.error('Error in deleteMedia:', error);
        return errorResponse(res, 500, 'Failed to delete media', error.message);
    }
};

/**
 * Get folders list
 */
exports.getFolders = async (req, res) => {
    try {
        const folders = await Media.distinct('folder', { isActive: true, folder: { $ne: null, $ne: '' } });
        return successResponse(res, 200, 'Folders retrieved successfully', { folders });
    } catch (error) {
        console.error('Error in getFolders:', error);
        return errorResponse(res, 500, 'Failed to retrieve folders', error.message);
    }
};

/**
 * Bulk delete media
 */
exports.bulkDeleteMedia = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return errorResponse(res, 400, 'IDs array is required');
        }

        // Check if any media is in use
        const mediaInUse = [];
        for (const id of ids) {
            const isInUse = await Media.isInUse(id);
            if (isInUse) {
                const media = await Media.findById(id);
                if (media) {
                    mediaInUse.push(media.filename || media.originalName);
                }
            }
        }

        if (mediaInUse.length > 0) {
            return errorResponse(
                res,
                400,
                `Cannot delete media that is currently in use: ${mediaInUse.join(', ')}`
            );
        }

        // Soft delete all
        await Media.updateMany(
            { _id: { $in: ids }, isActive: true },
            { isActive: false }
        );

        return successResponse(res, 200, `${ids.length} media items deleted successfully`);
    } catch (error) {
        console.error('Error in bulkDeleteMedia:', error);
        return errorResponse(res, 500, 'Failed to delete media', error.message);
    }
};
