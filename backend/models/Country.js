const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Country name is required'],
        trim: true,
        unique: true,
        index: true
    },
    code: {
        type: String,
        required: [true, 'Country code is required'],
        trim: true,
        uppercase: true,
        unique: true,
        index: true,
        minlength: [2, 'Country code must be at least 2 characters'],
        maxlength: [3, 'Country code must be at most 3 characters']
        // ISO 3166-1 alpha-2 (2 letters) or alpha-3 (3 letters)
    },
    isVisible: {
        type: Boolean,
        default: true,
        index: true
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
countrySchema.index({ isActive: 1, isVisible: 1 });
countrySchema.index({ code: 1 }, { unique: true });
countrySchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
countrySchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get visible countries
countrySchema.statics.getVisible = async function() {
    return await this.find({ isActive: true, isVisible: true }).sort({ name: 1 });
};

// Static method to get all active countries
countrySchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find by code
countrySchema.statics.findByCode = async function(code) {
    return await this.findOne({ code: code.toUpperCase(), isActive: true });
};

// Static method to get published and featured countries
countrySchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        isVisible: true,
        ...filters
    };
    
    return await this.find(query).sort({ name: 1 });
};

const Country = mongoose.model('Country', countrySchema);

module.exports = Country;

