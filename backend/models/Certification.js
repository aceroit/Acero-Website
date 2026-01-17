const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Certification name is required'],
        trim: true,
        index: true
    },
    
    // Certification Image
    certificationImage: {
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
        // Minimum dimensions: 150px width X 150px height
    },
    
    // Link to certification details or verification
    link: {
        type: String,
        trim: true,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true; // Optional field
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Link must be a valid URL'
        }
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
certificationSchema.index({ isActive: 1, name: 1 });
certificationSchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
certificationSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get active certifications
certificationSchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to get published and featured certifications
certificationSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query).sort({ name: 1 });
};

// Static method to search certifications
certificationSchema.statics.search = async function(query, options = {}) {
    const {
        page = 1,
        limit = 20
    } = options;
    
    const searchQuery = {
        isActive: true,
        name: { $regex: query, $options: 'i' }
    };
    
    const skip = (page - 1) * limit;
    
    const [certifications, total] = await Promise.all([
        this.find(searchQuery)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(searchQuery)
    ]);
    
    return { certifications, total, page, limit };
};

const Certification = mongoose.model('Certification', certificationSchema);

module.exports = Certification;

