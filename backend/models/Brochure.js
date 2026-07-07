const mongoose = require('mongoose');

const brochureSchema = new mongoose.Schema({
    // Basic Information
    title: {
        type: String,
        required: [true, 'Brochure title is required'],
        trim: true,
        index: true
    },
    
    // Brochure Image
    brochureImage: {
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
        // Minimum dimensions: 300 x 400px
    },
    
    // Optional: Order for display priority
    order: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Optional: Description
    description: {
        type: String,
        trim: true,
        default: null
    },
    
    // Optional: Legacy single download link (superseded by languages when present)
    downloadLink: {
        type: String,
        trim: true,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true; // Optional field
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Download link must be a valid URL'
        }
    },

    // PDFs by language: one URL per language (uploaded locally)
    languages: [{
        languageCode: { type: String, trim: true, required: true },
        languageName: { type: String, trim: true, required: true },
        fileUrl: { type: String, trim: true, required: true }
    }],

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
brochureSchema.index({ isActive: 1, order: 1 });
brochureSchema.index({ title: 1 });
brochureSchema.index({ title: 'text' }); // Text search index
brochureSchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
brochureSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get active brochures
brochureSchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ order: 1, title: 1 });
};

// Static method to get published and featured brochures
brochureSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query).sort({ order: 1, title: 1 });
};

// Static method to get brochures with pagination
brochureSchema.statics.getByFilters = async function(filters = {}, options = {}) {
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
    
    const [brochures, total] = await Promise.all([
        this.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);
    
    return { brochures, total, page, limit };
};

// Static method to search brochures
brochureSchema.statics.search = async function(query, options = {}) {
    const {
        page = 1,
        limit = 20
    } = options;
    
    const searchQuery = {
        isActive: true,
        $text: { $search: query }
    };
    
    const skip = (page - 1) * limit;
    
    const [brochures, total] = await Promise.all([
        this.find(searchQuery, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' }, order: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(searchQuery)
    ]);
    
    return { brochures, total, page, limit };
};

const Brochure = mongoose.model('Brochure', brochureSchema);

module.exports = Brochure;

