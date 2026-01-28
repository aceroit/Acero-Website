const mongoose = require('mongoose');

const googleReCaptchaSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Google ReCaptcha',
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

    // ReCaptcha fields with activation flags
    siteKey: { value: { type: String, default: null }, isFieldActive: { type: Boolean, default: true } },
    secretKey: { value: { type: String, default: null }, isFieldActive: { type: Boolean, default: true } },
    version: { 
        value: { 
            type: String, 
            enum: ['v2-checkbox', 'v2-invisible', 'v3'], 
            default: 'v3' 
        }, 
        isFieldActive: { type: Boolean, default: true } 
    },
    enabled: { value: { type: Boolean, default: true }, isFieldActive: { type: Boolean, default: true } }
}, {
    timestamps: true
});

// Indexes
googleReCaptchaSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get published configuration
googleReCaptchaSchema.statics.getPublished = async function(filters = {}) {
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

const GoogleReCaptcha = mongoose.model('GoogleReCaptcha', googleReCaptchaSchema);

module.exports = GoogleReCaptcha;


