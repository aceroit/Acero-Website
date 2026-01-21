const mongoose = require('mongoose');

const headerConfigurationSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Header Configuration',
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

    // Header specific fields with activation flags
    logo: {
        imageUrl: { type: String, default: null },
        altText: { type: String, default: null },
        isFieldActive: { type: Boolean, default: true }
    },
    brandName: {
        text: { type: String, default: 'ACERO' },
        isFieldActive: { type: Boolean, default: true }
    },
    navigationLinks: [{
        label: { type: String, required: true, trim: true },
        href: { type: String, required: true, trim: true },
        order: { type: Number, default: 0 },
        dropdown: [{
            label: { type: String, required: true, trim: true },
            href: { type: String, required: true, trim: true },
            order: { type: Number, default: 0 }
        }],
        isFieldActive: { type: Boolean, default: true }
    }],
    themeToggle: {
        enabled: { type: Boolean, default: true },
        isFieldActive: { type: Boolean, default: true }
    },
    ctaButton: {
        text: { type: String, default: 'Get Quote' },
        href: { type: String, default: '/contact-us' },
        isFieldActive: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Indexes
headerConfigurationSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get published configuration
headerConfigurationSchema.statics.getPublished = async function(filters = {}) {
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

const HeaderConfiguration = mongoose.model('HeaderConfiguration', headerConfigurationSchema);

module.exports = HeaderConfiguration;


