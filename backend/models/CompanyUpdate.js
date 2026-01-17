const mongoose = require('mongoose');

const companyUpdateSchema = new mongoose.Schema({
    // Basic Information
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        index: true
    },
    heading: {
        type: String,
        required: [true, 'Heading is required'],
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyUpdateCategory',
        required: [true, 'Category is required'],
        index: true
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
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
    
    // Images
    banner: {
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
        // Minimum dimensions: 1280 × 960px
    },
    featureImage: {
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
        // Minimum dimensions: 550 x 444px
    },
    gallery: [{
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        width: {
            type: Number,
            default: null
        },
        height: {
            type: Number,
            default: null
        },
        altText: {
            type: String,
            default: ''
        },
        order: {
            type: Number,
            default: 0
        }
        // Minimum dimensions: 550 x 500px
    }],
    
    // Content
    shortDescription: {
        type: String,
        trim: true,
        default: null
    },
    description: {
        type: String,
        trim: true,
        default: null
    },
    eventDate: {
        type: Date,
        default: null,
        index: true
    },
    
    // SEO Fields
    metaTitle: {
        type: String,
        trim: true,
        default: null
    },
    metaImage: {
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
        // Dimensions: 150x150
    },
    metaDescription: {
        type: String,
        trim: true,
        default: null
    },
    metaKeywords: {
        type: [String],
        default: []
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
companyUpdateSchema.index({ status: 1, isActive: 1 });
companyUpdateSchema.index({ category: 1, isActive: 1 });
companyUpdateSchema.index({ slug: 1 }, { unique: true });
companyUpdateSchema.index({ eventDate: -1, createdAt: -1 });
// Compound index for public queries (status, featured, isActive)
companyUpdateSchema.index({ status: 1, featured: 1, isActive: 1 });
companyUpdateSchema.index({ title: 'text', heading: 'text', description: 'text' }); // Text search index

// Compound index for filtering
companyUpdateSchema.index({ category: 1, status: 1, isActive: 1, eventDate: -1 });

// Pre-save middleware to generate slug from title if not provided
companyUpdateSchema.pre('save', async function() {
    if (!this.slug && this.title) {
        // Generate slug from title
        this.slug = this.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
        
        // Ensure uniqueness by appending timestamp if needed
        const existing = await this.constructor.findOne({ slug: this.slug });
        if (existing && existing._id.toString() !== this._id.toString()) {
            this.slug = `${this.slug}-${Date.now()}`;
        }
    }
});

// Static method to get published company updates
companyUpdateSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query)
        .populate('category', 'name slug')
        .sort({ eventDate: -1, createdAt: -1 });
};

// Static method to get company updates by filters
companyUpdateSchema.statics.getByFilters = async function(filters = {}, options = {}) {
    const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;
    
    const query = {
        isActive: true,
        ...filters
    };
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const [updates, total] = await Promise.all([
        this.find(query)
            .populate('category', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);
    
    return { updates, total, page, limit };
};

// Static method to find by slug
companyUpdateSchema.statics.findBySlug = async function(slug) {
    return await this.findOne({ 
        slug: slug, 
        isActive: true 
    })
    .populate('category', 'name slug');
};

// Static method to get updates by category
companyUpdateSchema.statics.getByCategory = async function(categoryId, options = {}) {
    const {
        page = 1,
        limit = 20,
        status = 'published'
    } = options;
    
    const query = {
        category: categoryId,
        isActive: true,
        status: status
    };
    
    const skip = (page - 1) * limit;
    
    const [updates, total] = await Promise.all([
        this.find(query)
            .populate('category', 'name slug')
            .sort({ eventDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);
    
    return { updates, total, page, limit };
};

// Static method to search company updates
companyUpdateSchema.statics.search = async function(query, options = {}) {
    const {
        page = 1,
        limit = 20,
        category,
        status = 'published'
    } = options;
    
    const searchQuery = {
        isActive: true,
        status: status,
        $text: { $search: query }
    };
    
    if (category) {
        searchQuery.category = category;
    }
    
    const skip = (page - 1) * limit;
    
    const [updates, total] = await Promise.all([
        this.find(searchQuery, { score: { $meta: 'textScore' } })
            .populate('category', 'name slug')
            .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(searchQuery)
    ]);
    
    return { updates, total, page, limit };
};

// Method to get formatted event date
companyUpdateSchema.methods.getFormattedEventDate = function() {
    if (!this.eventDate) return null;
    return this.eventDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const CompanyUpdate = mongoose.model('CompanyUpdate', companyUpdateSchema);

module.exports = CompanyUpdate;

