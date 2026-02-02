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

// Code is globally unique (areas are standalone)
areaSchema.index({ code: 1 }, { unique: true });

// Indexes
areaSchema.index({ isActive: 1, name: 1 });
areaSchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
areaSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get all active areas
areaSchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find by code (globally unique)
areaSchema.statics.findByCode = async function(code) {
    return await this.findOne({
        code: code.toUpperCase(),
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

    return await this.find(query).sort({ name: 1 });
};

const Area = mongoose.model('Area', areaSchema);

module.exports = Area;
