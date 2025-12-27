const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: [true, 'Filename is required'],
        trim: true
    },
    originalName: {
        type: String,
        required: [true, 'Original filename is required'],
        trim: true
    },
    publicId: {
        type: String,
        required: [true, 'Cloudinary public ID is required'],
        unique: true,
        index: true
    },
    url: {
        type: String,
        required: [true, 'URL is required']
    },
    secureUrl: {
        type: String,
        required: [true, 'Secure URL is required']
    },
    resourceType: {
        type: String,
        enum: ['image', 'video', 'raw', 'auto'],
        default: 'image',
        index: true
    },
    format: {
        type: String,
        trim: true,
        lowercase: true
        // e.g., jpg, png, mp4, pdf, etc.
    },
    size: {
        type: Number,
        required: [true, 'File size is required']
        // Size in bytes
    },
    width: {
        type: Number,
        default: null
    },
    height: {
        type: Number,
        default: null
    },
    duration: {
        type: Number,
        default: null
        // For videos, duration in seconds
    },
    folder: {
        type: String,
        trim: true,
        index: true
        // Cloudinary folder path (e.g., 'pages', 'sections', 'users', 'media')
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    description: {
        type: String,
        trim: true,
        default: ''
    },
    altText: {
        type: String,
        trim: true,
        default: ''
        // For accessibility
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploader is required'],
        index: true
    },
    usedIn: [{
        resource: {
            type: String,
            enum: ['page', 'section', 'user', 'other'],
            required: true
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    }],
    isPublic: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ folder: 1, createdAt: -1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ resourceType: 1, isActive: 1 });

// Virtual for usage count
mediaSchema.virtual('usageCount').get(function() {
    return this.usedIn ? this.usedIn.length : 0;
});

// Ensure virtuals are included in JSON
mediaSchema.set('toJSON', { virtuals: true });
mediaSchema.set('toObject', { virtuals: true });

// Static method to check if media is in use
mediaSchema.statics.isInUse = async function(mediaId) {
    const media = await this.findById(mediaId);
    return media && media.usedIn && media.usedIn.length > 0;
};

// Static method to add usage reference
mediaSchema.statics.addUsage = async function(mediaId, resource, resourceId) {
    return await this.findByIdAndUpdate(
        mediaId,
        {
            $addToSet: {
                usedIn: { resource, resourceId }
            }
        },
        { new: true }
    );
};

// Static method to remove usage reference
mediaSchema.statics.removeUsage = async function(mediaId, resource, resourceId) {
    return await this.findByIdAndUpdate(
        mediaId,
        {
            $pull: {
                usedIn: { 
                    resource, 
                    resourceId: mongoose.Types.ObjectId(resourceId) 
                }
            }
        },
        { new: true }
    );
};

// Static method to get media by folder
mediaSchema.statics.getByFolder = async function(folder, options = {}) {
    const {
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [media, total] = await Promise.all([
        this.find({ folder, isActive: true })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('uploadedBy', 'firstName lastName email')
            .lean(),
        this.countDocuments({ folder, isActive: true })
    ]);

    return { media, total, page, limit };
};

// Static method to search media
mediaSchema.statics.searchMedia = async function(query, options = {}) {
    const {
        page = 1,
        limit = 50,
        resourceType,
        uploadedBy,
        folder
    } = options;

    const searchQuery = {
        isActive: true,
        $or: [
            { filename: { $regex: query, $options: 'i' } },
            { originalName: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
        ]
    };

    if (resourceType) searchQuery.resourceType = resourceType;
    if (uploadedBy) searchQuery.uploadedBy = uploadedBy;
    if (folder) searchQuery.folder = folder;

    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
        this.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('uploadedBy', 'firstName lastName email')
            .lean(),
        this.countDocuments(searchQuery)
    ]);

    return { media, total, page, limit };
};

// Method to get formatted file size
mediaSchema.methods.getFormattedSize = function() {
    const bytes = this.size;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

// Pre-remove hook to prevent deletion of media in use
mediaSchema.pre('remove', async function(next) {
    if (this.usedIn && this.usedIn.length > 0) {
        throw new Error('Cannot delete media that is currently in use');
    }
    next();
});

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;

