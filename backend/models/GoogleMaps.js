const mongoose = require('mongoose');

const googleMapsSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Google Maps',
        trim: true
    },

    // Workflow fields
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

    // Creator and updater
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
    },

    // Google Maps configuration
    apiKey: { value: { type: String, default: null }, isFieldActive: { type: Boolean, default: true } },
    enabled: { value: { type: Boolean, default: true }, isFieldActive: { type: Boolean, default: true } }
}, {
    timestamps: true
});

// Indexes
googleMapsSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get published configuration
googleMapsSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };

    return this.findOne(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');
};

const GoogleMaps = mongoose.model('GoogleMaps', googleMapsSchema);

module.exports = GoogleMaps;


