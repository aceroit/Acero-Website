const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Region name is required'],
        trim: true,
        index: true
    },
    code: {
        type: String,
        required: [true, 'Region code is required'],
        trim: true,
        uppercase: true,
        index: true
    },
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: [true, 'Country is required'],
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

// Compound unique index: code must be unique within a country
regionSchema.index({ country: 1, code: 1 }, { unique: true });

// Indexes
regionSchema.index({ country: 1, isActive: 1 });
regionSchema.index({ isActive: 1, name: 1 });
regionSchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
regionSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get active regions by country
regionSchema.statics.getByCountry = async function(countryId) {
    return await this.find({ country: countryId, isActive: true }).sort({ name: 1 });
};

// Static method to get all active regions
regionSchema.statics.getActive = async function() {
    return await this.find({ isActive: true })
        .populate('country', 'name code')
        .sort({ name: 1 });
};

// Static method to find by code and country
regionSchema.statics.findByCodeAndCountry = async function(code, countryId) {
    return await this.findOne({ 
        code: code.toUpperCase(), 
        country: countryId, 
        isActive: true 
    });
};

// Static method to get published and featured regions
regionSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query)
        .populate('country', 'name code')
        .sort({ name: 1 });
};

const Region = mongoose.model('Region', regionSchema);

module.exports = Region;

