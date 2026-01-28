const cloudinary = require('cloudinary').v2;
const Media = require('../models/Media');

/**
 * Upload Service
 * Centralized file upload service using Cloudinary
 */

/**
 * Validate file before upload
 * @param {Object} file - File object
 * @param {Array} allowedTypes - Allowed file extensions
 * @param {Number} maxSize - Maximum file size in bytes
 * @returns {Object} - Validation result
 */
exports.validateFile = (file, allowedTypes, maxSize) => {
    const errors = [];

    // Check if file exists
    if (!file) {
        errors.push('No file provided');
        return { valid: false, errors };
    }

    // Get file extension
    const fileExt = file.originalname ? 
        file.originalname.split('.').pop().toLowerCase() : 
        file.name.split('.').pop().toLowerCase();

    // Check file type
    if (!allowedTypes.includes(fileExt)) {
        errors.push(`File type .${fileExt} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    const fileSize = file.size || file.buffer?.length || 0;
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
 * Upload image to Cloudinary
 * @param {Object} file - File object (from multer or express-fileupload)
 * @param {String} folder - Cloudinary folder path
 * @param {Object} options - Upload options
 * @param {String} userId - ID of user uploading
 * @returns {Object} - Uploaded media details
 */
exports.uploadImage = async (file, folder = 'media', options = {}, userId) => {
    try {
        // Validate file
        const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,gif,webp,svg').split(',');
        const maxSize = parseInt(process.env.MAX_FILE_SIZE || 10485760); // 10MB default

        const validation = exports.validateFile(file, allowedTypes, maxSize);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Prepare upload options
        const uploadOptions = {
            folder: `${process.env.MEDIA_FOLDER_PREFIX || 'acero-cms'}/${folder}`,
            resource_type: 'image',
            transformation: options.transformation || [
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ],
            ...options
        };

        // Upload to Cloudinary
        let result;
        if (file.buffer) {
            // If file has buffer (from multer memory storage)
            result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
            });
        } else if (file.path || file.tempFilePath) {
            // If file has path (from multer disk storage or express-fileupload)
            result = await cloudinary.uploader.upload(
                file.path || file.tempFilePath,
                uploadOptions
            );
        } else {
            throw new Error('Invalid file object');
        }

        // Save media record to database
        const media = await Media.create({
            filename: result.original_filename || file.originalname || file.name,
            originalName: file.originalname || file.name,
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height,
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
 * @param {Array} files - Array of file objects
 * @param {String} folder - Cloudinary folder path
 * @param {Object} options - Upload options
 * @param {String} userId - ID of user uploading
 * @returns {Array} - Array of uploaded media details
 */
exports.uploadMultipleImages = async (files, folder = 'media', options = {}, userId) => {
    try {
        if (!Array.isArray(files) || files.length === 0) {
            throw new Error('No files provided');
        }

        // Upload all files in parallel
        const uploadPromises = files.map(file => 
            exports.uploadImage(file, folder, options, userId)
        );

        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error('Upload multiple images error:', error);
        throw error;
    }
};

/**
 * Upload video to Cloudinary
 * @param {Object} file - File object
 * @param {String} folder - Cloudinary folder path
 * @param {Object} options - Upload options
 * @param {String} userId - ID of user uploading
 * @returns {Object} - Uploaded media details
 */
exports.uploadVideo = async (file, folder = 'media', options = {}, userId) => {
    try {
        // Validate file
        const allowedTypes = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,webm,mov').split(',');
        const maxSize = parseInt(process.env.MAX_VIDEO_SIZE || 104857600); // 100MB default

        const validation = exports.validateFile(file, allowedTypes, maxSize);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Prepare upload options
        const uploadOptions = {
            folder: `${process.env.MEDIA_FOLDER_PREFIX || 'acero-cms'}/${folder}`,
            resource_type: 'video',
            ...options
        };

        // Upload to Cloudinary
        let result;
        if (file.buffer) {
            result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
            });
        } else if (file.path || file.tempFilePath) {
            result = await cloudinary.uploader.upload(
                file.path || file.tempFilePath,
                uploadOptions
            );
        } else {
            throw new Error('Invalid file object');
        }

        // Save media record to database
        const media = await Media.create({
            filename: result.original_filename || file.originalname || file.name,
            originalName: file.originalname || file.name,
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height,
            duration: result.duration,
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
 * Delete file from Cloudinary and database
 * @param {String} publicId - Cloudinary public ID or Media document ID
 * @returns {Object} - Deletion result
 */
exports.deleteFile = async (publicId) => {
    try {
        // Check if it's a MongoDB ID or Cloudinary public ID
        let media;
        if (publicId.match(/^[0-9a-fA-F]{24}$/)) {
            // MongoDB ObjectId
            media = await Media.findById(publicId);
        } else {
            // Cloudinary public ID
            media = await Media.findOne({ publicId });
        }

        if (!media) {
            throw new Error('Media not found');
        }

        // Check if media is in use
        if (media.usedIn && media.usedIn.length > 0) {
            throw new Error('Cannot delete media that is currently in use');
        }

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(media.publicId, {
            resource_type: media.resourceType
        });

        // Delete from database
        await Media.findByIdAndDelete(media._id);

        return { success: true, message: 'Media deleted successfully' };
    } catch (error) {
        console.error('Delete file error:', error);
        throw error;
    }
};

/**
 * Get optimized/transformed image URL
 * @param {String} publicId - Cloudinary public ID
 * @param {Object} transformations - Transformation options
 * @returns {String} - Transformed image URL
 */
exports.getOptimizedUrl = (publicId, transformations = {}) => {
    try {
        const url = cloudinary.url(publicId, {
            quality: transformations.quality || 'auto',
            fetch_format: transformations.format || 'auto',
            width: transformations.width,
            height: transformations.height,
            crop: transformations.crop || 'limit',
            ...transformations
        });

        return url;
    } catch (error) {
        console.error('Get optimized URL error:', error);
        throw error;
    }
};

/**
 * Generate thumbnail URL
 * @param {String} publicId - Cloudinary public ID
 * @param {Number} width - Thumbnail width
 * @param {Number} height - Thumbnail height
 * @returns {String} - Thumbnail URL
 */
exports.generateThumbnail = (publicId, width = 200, height = 200) => {
    try {
        return cloudinary.url(publicId, {
            width,
            height,
            crop: 'fill',
            quality: 'auto',
            fetch_format: 'auto'
        });
    } catch (error) {
        console.error('Generate thumbnail error:', error);
        throw error;
    }
};

/**
 * Get file details from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Object} - File details
 */
exports.getFileDetails = async (publicId) => {
    try {
        const result = await cloudinary.api.resource(publicId);
        return result;
    } catch (error) {
        console.error('Get file details error:', error);
        throw error;
    }
};

/**
 * Upload raw file (PDFs, documents, etc.)
 * @param {Object} file - File object
 * @param {String} folder - Cloudinary folder path
 * @param {Object} options - Upload options
 * @param {String} userId - ID of user uploading
 * @returns {Object} - Uploaded media details
 */
exports.uploadRawFile = async (file, folder = 'media', options = {}, userId) => {
    try {
        // Validate file
        const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
        const maxSize = parseInt(process.env.MAX_FILE_SIZE || 20971520); // 20MB default

        const validation = exports.validateFile(file, allowedTypes, maxSize);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Prepare upload options
        const uploadOptions = {
            folder: `${process.env.MEDIA_FOLDER_PREFIX || 'acero-cms'}/${folder}`,
            resource_type: 'raw',
            ...options
        };

        // Upload to Cloudinary
        let result;
        if (file.buffer) {
            result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
            });
        } else if (file.path || file.tempFilePath) {
            result = await cloudinary.uploader.upload(
                file.path || file.tempFilePath,
                uploadOptions
            );
        } else {
            throw new Error('Invalid file object');
        }

        // Save media record to database
        const media = await Media.create({
            filename: result.original_filename || file.originalname || file.name,
            originalName: file.originalname || file.name,
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            format: result.format,
            size: result.bytes,
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

