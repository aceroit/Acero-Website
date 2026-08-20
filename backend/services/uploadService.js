const fs = require('fs');
const path = require('path');
const Media = require('../models/Media');
const { saveUploadedFile, getUploadRoot, getPublicUploadBase } = require('../utils/localFileStorage');

/**
 * Local media upload service.
 *
 * Admin uploads create both:
 * 1. A physical file under UPLOAD_ROOT.
 * 2. A Media document with publicId/url/secureUrl for admin previews and frontend rendering.
 *
 * Keep provider-specific URL handling out of components. New uploads should use
 * local Hostinger paths, while frontend/admin helpers handle old migrated values.
 */


function getStorageFolder(folder = 'media') {
    // Prefix all CMS-managed files so uploaded media, career CVs, and migrated
    // files can share one public /uploads folder without colliding.
    const prefix = process.env.MEDIA_FOLDER_PREFIX || 'acero-cms';
    const cleanFolder = String(folder || 'media')
        .replace(/^\/+|\/+$/g, '')
        .replace(/\\/g, '/')
        .split('/')
        .filter((part) => part && part !== '.' && part !== '..')
        .join('/');

    return [prefix, cleanFolder].filter(Boolean).join('/');
}

function getFileExt(file) {
    const name = file.originalname || file.name || '';
    return name.split('.').pop().toLowerCase();
}

function getFormatFromFilename(filename = '') {
    const ext = path.extname(filename).replace('.', '').toLowerCase();
    return ext || undefined;
}

function getLocalPathFromPublicId(publicId) {
    if (!publicId) return null;

    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
        return null;
    }

    const uploadRoot = getUploadRoot();
    const normalized = publicId.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
    const filePath = path.resolve(uploadRoot, normalized);
    const relative = path.relative(uploadRoot, filePath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return null;
    }

    return filePath;
}

function removeLocalFileIfExists(publicId) {
    const filePath = getLocalPathFromPublicId(publicId);

    if (!filePath) return false;

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
    } catch (error) {
        console.warn('Failed to delete local file:', filePath, error.message);
    }

    return false;
}

/**
 * Validate file before upload
 * @param {Object} file - File object
 * @param {Array} allowedTypes - Allowed file extensions
 * @param {Number} maxSize - Maximum file size in bytes
 * @returns {Object} - Validation result
 */
exports.validateFile = (file, allowedTypes, maxSize) => {
    const errors = [];

    if (!file) {
        errors.push('No file provided');
        return { valid: false, errors };
    }

    const fileExt = getFileExt(file);

    if (!allowedTypes.includes(fileExt)) {
        errors.push(`File type .${fileExt} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    const fileSize = file.size || file.buffer?.length || file.data?.length || 0;
    if (fileSize > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
        errors.push(`File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Upload image to local storage
 */
exports.uploadImage = async (file, folder = 'media', options = {}, userId) => {
    try {
        const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,gif,webp,svg').split(',');
        const maxSize = parseInt(process.env.MAX_FILE_SIZE || 10485760); // 10MB

        const validation = exports.validateFile(file, allowedTypes, maxSize);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const saved = await saveUploadedFile(file, getStorageFolder(folder));

        const media = await Media.create({
            filename: saved.storedFilename || saved.filename,
            originalName: saved.originalName || file.originalname || file.name,
            publicId: saved.publicId,
            url: saved.url,
            secureUrl: saved.secureUrl || saved.url,
            resourceType: 'image',
            format: getFormatFromFilename(saved.filename),
            size: saved.size,
            width: options.width || undefined,
            height: options.height || undefined,
            folder: folder,
            uploadedBy: userId,
            tags: options.tags || [],
            description: options.description || '',
            altText: options.altText || ''
        });

        return media;
    } catch (error) {
        console.error('Upload image error:', error);
        throw error;
    }
};

/**
 * Upload multiple images
 */
exports.uploadMultipleImages = async (files, folder = 'media', options = {}, userId) => {
    try {
        if (!Array.isArray(files) || files.length === 0) {
            throw new Error('No files provided');
        }

        const uploadPromises = files.map(file =>
            exports.uploadImage(file, folder, options, userId)
        );

        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('Upload multiple images error:', error);
        throw error;
    }
};

/**
 * Upload video to local storage
 */
exports.uploadVideo = async (file, folder = 'media', options = {}, userId) => {
    try {
        const allowedTypes = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,webm,mov').split(',');
        const maxSize = parseInt(process.env.MAX_VIDEO_SIZE || 104857600); // 100MB

        const validation = exports.validateFile(file, allowedTypes, maxSize);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const saved = await saveUploadedFile(file, getStorageFolder(folder));

        const media = await Media.create({
            filename: saved.storedFilename || saved.filename,
            originalName: saved.originalName || file.originalname || file.name,
            publicId: saved.publicId,
            url: saved.url,
            secureUrl: saved.secureUrl || saved.url,
            resourceType: 'video',
            format: getFormatFromFilename(saved.filename),
            size: saved.size,
            duration: options.duration || undefined,
            folder: folder,
            uploadedBy: userId,
            tags: options.tags || [],
            description: options.description || ''
        });

        return media;
    } catch (error) {
        console.error('Upload video error:', error);
        throw error;
    }
};

/**
 * Delete file from local storage and database
 * @param {String} publicId - Local publicId or Media document ID
 */
exports.deleteFile = async (publicId) => {
    try {
        let media;

        if (publicId.match(/^[0-9a-fA-F]{24}$/)) {
            media = await Media.findById(publicId);
        } else {
            media = await Media.findOne({ publicId });
        }

        if (!media) {
            throw new Error('Media not found');
        }

        if (media.usedIn && media.usedIn.length > 0) {
            throw new Error('Cannot delete media that is currently in use');
        }

        // Delete local file only if publicId is a local relative path.
        // Old external records will be removed from DB only.
        removeLocalFileIfExists(media.publicId);

        await Media.findByIdAndDelete(media._id);

        return { success: true, message: 'Media deleted successfully' };
    } catch (error) {
        console.error('Delete file error:', error);
        throw error;
    }
};

/**
 * Get optimized/transformed image URL.
 * Local storage does not transform images, so return direct local URL.
 */
exports.getOptimizedUrl = (publicId, transformations = {}) => {
    try {
        if (!publicId) return null;

        if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
            return publicId;
        }

        const normalized = publicId.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
        return `${getPublicUploadBase()}/${normalized}`;
    } catch (error) {
        console.error('Get optimized URL error:', error);
        throw error;
    }
};

/**
 * Generate thumbnail URL.
 * Local storage does not generate thumbnails, so return direct local URL.
 */
exports.generateThumbnail = (publicId, width = 200, height = 200) => {
    try {
        return exports.getOptimizedUrl(publicId);
    } catch (error) {
        console.error('Generate thumbnail error:', error);
        throw error;
    }
};

/**
 * Get file details from local DB/file system
 */
exports.getFileDetails = async (publicId) => {
    try {
        let media;

        if (publicId.match(/^[0-9a-fA-F]{24}$/)) {
            media = await Media.findById(publicId);
        } else {
            media = await Media.findOne({ publicId });
        }

        if (!media) {
            throw new Error('Media not found');
        }

        const details = media.toObject ? media.toObject() : media;
        const filePath = getLocalPathFromPublicId(media.publicId);

        if (filePath && fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            details.localPath = filePath;
            details.size = details.size || stat.size;
            details.exists = true;
        } else {
            details.exists = false;
        }

        return details;
    } catch (error) {
        console.error('Get file details error:', error);
        throw error;
    }
};

/**
 * Upload raw file (PDFs, documents, etc.) to local storage
 */
exports.uploadRawFile = async (file, folder = 'media', options = {}, userId) => {
    try {
        const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
        const maxSize = parseInt(process.env.MAX_FILE_SIZE || 20971520); // 20MB

        const validation = exports.validateFile(file, allowedTypes, maxSize);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const saved = await saveUploadedFile(file, getStorageFolder(folder));

        const media = await Media.create({
            filename: saved.storedFilename || saved.filename,
            originalName: saved.originalName || file.originalname || file.name,
            publicId: saved.publicId,
            url: saved.url,
            secureUrl: saved.secureUrl || saved.url,
            resourceType: 'raw',
            format: getFormatFromFilename(saved.filename),
            size: saved.size,
            folder: folder,
            uploadedBy: userId,
            tags: options.tags || [],
            description: options.description || ''
        });

        return media;
    } catch (error) {
        console.error('Upload raw file error:', error);
        throw error;
    }
};
