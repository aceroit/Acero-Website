const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Industry name is required'],
        trim: true,
        unique: true,
        index: true
    },
    slug: {
        type: String,
        required: [true, 'Industry slug is required'],
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
    order: {
        type: Number,
        required: [true, 'Order is required'],
        default: 0,
        min: 0
    },
    logo: {
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
        // Minimum dimensions: 126px width X 100px height
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
industrySchema.index({ isActive: 1, order: 1 });
industrySchema.index({ slug: 1 }, { unique: true });
industrySchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
industrySchema.index({ status: 1, featured: 1, isActive: 1 });

// Pre-save middleware to generate slug from name if not provided
industrySchema.pre('save', async function() {
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

// Static method to get active industries ordered by order field
industrySchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ order: 1, name: 1 });
};

// Static method to find by slug
industrySchema.statics.findBySlug = async function(slug) {
    return await this.findOne({ slug, isActive: true });
};

// Static method to get published and featured industries
industrySchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query).sort({ order: 1, name: 1 });
};

const Industry = mongoose.model('Industry', industrySchema);

module.exports = Industry;

