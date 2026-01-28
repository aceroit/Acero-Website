const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Area name is required'],
        trim: true,
        index: true
    },
    code: {
        type: String,
        required: [true, 'Area code is required'],
        trim: true,
        uppercase: true,
        index: true
    },
    region: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Region',
        required: [true, 'Region is required'],
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

// Compound unique index: code must be unique within a region
areaSchema.index({ region: 1, code: 1 }, { unique: true });

// Indexes
areaSchema.index({ region: 1, isActive: 1 });
areaSchema.index({ isActive: 1, name: 1 });
areaSchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
areaSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get active areas by region
areaSchema.statics.getByRegion = async function(regionId) {
    return await this.find({ region: regionId, isActive: true }).sort({ name: 1 });
};

// Static method to get active areas by country (through region)
areaSchema.statics.getByCountry = async function(countryId) {
    const Region = mongoose.model('Region');
    const regions = await Region.find({ country: countryId, isActive: true }).select('_id');
    const regionIds = regions.map(r => r._id);
    
    return await this.find({ 
        region: { $in: regionIds }, 
        isActive: true 
    })
    .populate('region', 'name code')
    .sort({ name: 1 });
};

// Static method to get all active areas
areaSchema.statics.getActive = async function() {
    return await this.find({ isActive: true })
        .populate({
            path: 'region',
            select: 'name code',
            populate: {
                path: 'country',
                select: 'name code'
            }
        })
        .sort({ name: 1 });
};

// Static method to find by code and region
areaSchema.statics.findByCodeAndRegion = async function(code, regionId) {
    return await this.findOne({ 
        code: code.toUpperCase(), 
        region: regionId, 
        isActive: true 
    });
};

// Static method to get published and featured areas
areaSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query)
        .populate({
            path: 'region',
            select: 'name code',
            populate: {
                path: 'country',
                select: 'name code'
            }
        })
        .sort({ name: 1 });
};

const Area = mongoose.model('Area', areaSchema);

module.exports = Area;

