const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    // Basic Information
    buildingType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BuildingType',
        required: [true, 'Building type is required'],
        index: true
    },
    jobNumber: {
        type: String,
        required: [true, 'Job number is required'],
        trim: true,
        index: true
    },
    jobNumberSlug: {
        type: String,
        required: [true, 'Job number slug is required'],
        lowercase: true,
        trim: true,
        unique: true,
        index: true,
        validate: {
            validator: function(v) {
                // Slug should not contain spaces or special characters except hyphens
                return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
            },
            message: 'Job number slug must be unique, lowercase, and contain only alphanumeric characters and hyphens'
        }
    },
    typeSlug: {
        type: String,
        required: [true, 'Type slug is required'],
        lowercase: true,
        trim: true,
        index: true,
        validate: {
            validator: function(v) {
                // Slug should not contain spaces or special characters except hyphens
                return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
            },
            message: 'Type slug must be lowercase and contain only alphanumeric characters and hyphens'
        }
    },
    order: {
        type: Number,
        required: [true, 'Order is required'],
        default: 0,
        min: 0
    },
    
    // Images
    thumbnailImage: {
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
        // Minimum dimensions: 1000 x 500
    },
    projectImages: [{
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
        // Minimum dimensions: 736 × 368px or 546 × 273px
    }],
    
    // Location Information
    region: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Region',
        required: [true, 'Region is required'],
        index: true
    },
    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area',
        required: [true, 'Area is required'],
        index: true
    },
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: [true, 'Country is required'],
        index: true
    },
    industry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Industry',
        required: [true, 'Industry is required'],
        index: true
    },
    
    // Project Details
    specialFeatures: {
        type: [String],
        default: []
    },
    totalArea: {
        type: String,
        trim: true,
        default: null
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
    showOnHomePage: {
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
projectSchema.index({ status: 1, isActive: 1 });
projectSchema.index({ buildingType: 1, isActive: 1 });
projectSchema.index({ country: 1, region: 1, area: 1 });
projectSchema.index({ industry: 1, isActive: 1 });
projectSchema.index({ order: 1, createdAt: -1 });
projectSchema.index({ jobNumberSlug: 1 }, { unique: true });
// Compound index for public queries (status, featured, isActive)
projectSchema.index({ status: 1, featured: 1, isActive: 1 });
// Compound index for home page projects (status, showOnHomePage, isActive)
projectSchema.index({ status: 1, showOnHomePage: 1, isActive: 1 });

// Compound index for filtering
projectSchema.index({ country: 1, region: 1, area: 1, industry: 1, buildingType: 1, status: 1, isActive: 1 });

// Pre-save middleware to generate jobNumberSlug from jobNumber if not provided
projectSchema.pre('save', async function() {
    if (!this.jobNumberSlug && this.jobNumber) {
        // Generate slug from job number
        this.jobNumberSlug = this.jobNumber
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    }
});

// Pre-save middleware to validate projectImages when status is 'published'
projectSchema.pre('save', async function() {
    // Only validate if status is being set to 'published' or is already 'published'
    if (this.status === 'published' && (!this.projectImages || this.projectImages.length < 5)) {
        // Don't throw error, just log warning - allow saving but warn user
        console.warn(`Warning: Project ${this.jobNumber || this._id} has less than 5 images but status is 'published'. Consider adding more images.`);
    }
});

// Static method to get published projects (used for Projects listing page; featured only)
projectSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query)
        .populate('buildingType', 'name slug image')
        .populate('country', 'name code')
        .populate('region', 'name code')
        .populate('area', 'name code')
        .populate('industry', 'name slug logo')
        .sort({ order: 1, createdAt: -1 });
};

// Static method to get projects shown on home page (max 6; showOnHomePage only)
projectSchema.statics.getHomePageProjects = async function() {
    const query = {
        status: 'published',
        showOnHomePage: true,
        isActive: true
    };
    return await this.find(query)
        .populate('buildingType', 'name slug image')
        .populate('country', 'name code')
        .populate('region', 'name code')
        .populate('area', 'name code')
        .populate('industry', 'name slug logo')
        .sort({ order: 1, createdAt: -1 })
        .limit(6)
        .lean();
};

// Static method to get projects by filters
projectSchema.statics.getByFilters = async function(filters = {}, options = {}) {
    const {
        page = 1,
        limit = 20,
        sortBy = 'order',
        sortOrder = 'asc'
    } = options;
    
    const query = {
        isActive: true,
        ...filters
    };
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const [projects, total] = await Promise.all([
        this.find(query)
            .populate('buildingType', 'name')
            .populate('country', 'name code')
            .populate('region', 'name code')
            .populate('area', 'name code')
            .populate('industry', 'name slug logo')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);
    
    return { projects, total, page, limit };
};

// Static method to find by slug
projectSchema.statics.findBySlug = async function(slug) {
    return await this.findOne({ 
        jobNumberSlug: slug, 
        isActive: true 
    })
    .populate('buildingType', 'name')
    .populate('country', 'name code')
    .populate('region', 'name code')
    .populate('area', 'name code')
    .populate('industry', 'name slug logo');
};

// Method to get full location path
projectSchema.methods.getLocationPath = async function() {
    await this.populate([
        { path: 'country', select: 'name' },
        { path: 'region', select: 'name' },
        { path: 'area', select: 'name' }
    ]);
    
    return {
        country: this.country?.name || '',
        region: this.region?.name || '',
        area: this.area?.name || ''
    };
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;

