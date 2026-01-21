const mongoose = require('mongoose');

const footerConfigurationSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Footer Configuration',
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

    // Footer specific fields with activation flags
    brandInfo: {
        logo: {
            imageUrl: { type: String, default: null },
            altText: { type: String, default: null }
        },
        description: { type: String, default: null },
        isFieldActive: { type: Boolean, default: true }
    },
    contactInfo: {
        phone: { type: String, default: null, trim: true },
        email: { type: String, default: null, trim: true, lowercase: true },
        address: { type: String, default: null },
        isFieldActive: { type: Boolean, default: true }
    },
    socialLinks: [{
        platform: { type: String, required: true, trim: true },
        href: { type: String, required: true, trim: true },
        icon: { type: String, default: null },
        isFieldActive: { type: Boolean, default: true }
    }],
    quickLinks: [{
        label: { type: String, required: true, trim: true },
        href: { type: String, required: true, trim: true },
        isFieldActive: { type: Boolean, default: true }
    }],
    productsLinks: [{
        label: { type: String, required: true, trim: true },
        href: { type: String, required: true, trim: true },
        isFieldActive: { type: Boolean, default: true }
    }],
    mediaLinks: [{
        label: { type: String, required: true, trim: true },
        href: { type: String, required: true, trim: true },
        isFieldActive: { type: Boolean, default: true }
    }],
    copyright: {
        text: { type: String, default: null },
        year: { type: Number, default: new Date().getFullYear() },
        isFieldActive: { type: Boolean, default: true }
    },
    legalLinks: [{
        label: { type: String, required: true, trim: true },
        href: { type: String, required: true, trim: true },
        isFieldActive: { type: Boolean, default: true }
    }]
}, {
    timestamps: true
});

// Indexes
footerConfigurationSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get published configuration
footerConfigurationSchema.statics.getPublished = async function(filters = {}) {
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

const FooterConfiguration = mongoose.model('FooterConfiguration', footerConfigurationSchema);

module.exports = FooterConfiguration;


