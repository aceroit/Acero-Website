const mongoose = require('mongoose');

const buildingTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Building type name is required'],
        trim: true,
        unique: true,
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
buildingTypeSchema.index({ isActive: 1, name: 1 });
buildingTypeSchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
buildingTypeSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get active building types
buildingTypeSchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to get published and featured building types
buildingTypeSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query).sort({ name: 1 });
};

const BuildingType = mongoose.model('BuildingType', buildingTypeSchema);

module.exports = BuildingType;

