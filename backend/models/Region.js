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

// Code is globally unique (regions are standalone)
regionSchema.index({ code: 1 }, { unique: true });

// Indexes
regionSchema.index({ isActive: 1, name: 1 });
regionSchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
regionSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get all active regions
regionSchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find by code (globally unique)
regionSchema.statics.findByCode = async function(code) {
    return await this.findOne({
        code: code.toUpperCase(),
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

    return await this.find(query).sort({ name: 1 });
};

const Region = mongoose.model('Region', regionSchema);

module.exports = Region;
