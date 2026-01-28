const mongoose = require('mongoose');

const buildingTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Building type name is required'],
        trim: true,
        unique: true,
        index: true
    },
    slug: {
        type: String,
        required: [true, 'Building type slug is required'],
        lowercase: true,
        trim: true,
        unique: true,
        index: true,
        validate: {
            validator: function(v) {
                // Slug should not contain spaces or special characters except hyphens
                return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
            },
            message: 'Slug must be unique, lowercase, and contain only alphanumeric characters and hyphens'
        }
    },
    image: {
        url: {
            type: String,
            default: null
        },
        publicId: {
            type: String,
            default: null
        },
        width: {
            type: Number,
            default: null
        },
        height: {
            type: Number,
            default: null
        }
        // Minimum dimensions: 126px width X 100px height (similar to Industry logo)
    },
    // Workflow Status (following CMS pattern)
    status: {
        type: String,
        enum: ['draft', 'in_review', 'pending_approval', 'pending_publish', 'published', 'changes_requested', 'archived'],
        default: 'draft',
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    publishedAt: {
        type: Date,
        default: null
    },
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    // Creator and Updater tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Indexes
buildingTypeSchema.index({ isActive: 1, name: 1 });
buildingTypeSchema.index({ slug: 1 }, { unique: true });
buildingTypeSchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
buildingTypeSchema.index({ status: 1, featured: 1, isActive: 1 });

// Pre-save middleware to generate slug from name if not provided
buildingTypeSchema.pre('save', async function() {
    if (!this.slug && this.name) {
        // Generate slug from name
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    }
});

// Static method to get active building types
buildingTypeSchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find by slug
buildingTypeSchema.statics.findBySlug = async function(slug) {
    return await this.findOne({ slug, isActive: true });
};

// Static method to get published and featured building types
buildingTypeSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query).sort({ name: 1 });
};

const BuildingType = mongoose.model('BuildingType', buildingTypeSchema);

module.exports = BuildingType;

