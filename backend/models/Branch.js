const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    // Basic Information
    branchName: {
        type: String,
        required: [true, 'Branch name is required'],
        trim: true,
        index: true
    },
    googleLink: {
        type: String,
        required: [true, 'Google link is required'],
        trim: true,
        validate: {
            validator: function(v) {
                // Basic URL validation
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Google link must be a valid URL'
        }
    },
    isHeadOffice: {
        type: Boolean,
        default: false,
        index: true
    },
    // Display order (lower numbers appear first; used in admin and public listing)
    order: {
        type: Number,
        default: 0,
        min: 0,
        index: true
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    
    // Logo
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
        // Minimum dimensions: 1000 x 500
    },
    
    // Contact Information
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true; // Optional field
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please provide a valid email address'
        }
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    alternatePhone: {
        type: String,
        trim: true,
        default: null
    },
    
    // Location Information
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: [true, 'Country is required'],
        index: true
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        index: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        index: true
    },
    address: {
        type: String,
        trim: true,
        default: null
    },
    workingHours: {
        type: String,
        trim: true,
        default: null
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
branchSchema.index({ country: 1, state: 1, city: 1 });
branchSchema.index({ isHeadOffice: 1, isActive: 1 });
branchSchema.index({ isActive: 1, order: 1, branchName: 1 });
branchSchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
branchSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get active branches (ordered by order, then isHeadOffice, then name)
branchSchema.statics.getActive = async function() {
    return await this.find({ isActive: true })
        .populate('country', 'name code')
        .populate('manager', 'firstName lastName email')
        .sort({ order: 1, isHeadOffice: -1, branchName: 1 });
};

// Static method to get published and featured branches (ordered by order, then isHeadOffice, then name)
branchSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query)
        .populate('country', 'name code')
        .populate('manager', 'firstName lastName email')
        .sort({ order: 1, isHeadOffice: -1, branchName: 1 });
};

// Static method to get head office
branchSchema.statics.getHeadOffice = async function() {
    return await this.findOne({ 
        isHeadOffice: true, 
        isActive: true 
    })
    .populate('country', 'name code')
    .populate('manager', 'firstName lastName email');
};

// Static method to get branches by country (ordered by order, then isHeadOffice, then name)
branchSchema.statics.getByCountry = async function(countryId) {
    return await this.find({ 
        country: countryId, 
        isActive: true 
    })
    .populate('country', 'name code')
    .populate('manager', 'firstName lastName email')
    .sort({ order: 1, isHeadOffice: -1, branchName: 1 });
};

// Static method to get branches by state (ordered by order, then name)
branchSchema.statics.getByState = async function(state) {
    return await this.find({ 
        state: state, 
        isActive: true 
    })
    .populate('country', 'name code')
    .populate('manager', 'firstName lastName email')
    .sort({ order: 1, branchName: 1 });
};

// Static method to reorder branches (bulk update order values)
branchSchema.statics.reorderBranches = async function(branchOrders) {
    const updatePromises = branchOrders.map(({ branchId, order }) =>
        this.findByIdAndUpdate(branchId, { order: Number(order) })
    );
    await Promise.all(updatePromises);
};

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;

