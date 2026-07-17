const mongoose = require('mongoose');

const vacancySchema = new mongoose.Schema({
    // Basic Information
    title: {
        type: String,
        required: [true, 'Vacancy title is required'],
        trim: true,
        index: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        index: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract'],
        required: [true, 'Job type is required'],
        index: true
    },
    description: {
        type: String,
        trim: true,
        default: null
    },
    requirements: {
        type: [String],
        default: []
    },
    responsibilities: {
        type: [String],
        default: []
    },
    
    // Experience and Education Levels (from career-data.ts)
    experienceLevels: [{
        value: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        }
    }],
    educationLevels: [{
        value: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        }
    }],
    languages: [{
        value: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        }
    }],
    
    // Email configuration
    notificationEmail: {
        type: String,
        required: [true, 'Notification email is required'],
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    
    // SEO Fields
    metaTitle: {
        type: String,
        trim: true,
        default: null
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
vacancySchema.index({ status: 1, isActive: 1 });
vacancySchema.index({ department: 1, isActive: 1 });
vacancySchema.index({ type: 1, isActive: 1 });
vacancySchema.index({ title: 1, department: 1 });
// Compound index for public queries (status, featured, isActive)
vacancySchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get published active vacancies
vacancySchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        isActive: true,
        ...filters
    };
    
    return await this.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });
};

// Static method to get vacancies by filters
vacancySchema.statics.getByFilters = async function(filters = {}, options = {}) {
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
    
    const [vacancies, total] = await Promise.all([
        this.find(query)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);
    
    return { vacancies, total, page, limit };
};

const Vacancy = mongoose.model('Vacancy', vacancySchema);

module.exports = Vacancy;

