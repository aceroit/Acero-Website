const mongoose = require('mongoose');

const smtpSettingsSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'SMTP Settings',
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

    // SMTP configuration with activation flags
    host: { value: { type: String, default: null }, isFieldActive: { type: Boolean, default: true } },
    port: { value: { type: Number, default: null }, isFieldActive: { type: Boolean, default: true } },
    secure: { value: { type: Boolean, default: false }, isFieldActive: { type: Boolean, default: true } },
    username: { value: { type: String, default: null }, isFieldActive: { type: Boolean, default: true } },
    password: { value: { type: String, default: null }, isFieldActive: { type: Boolean, default: true } },
    fromEmail: { value: { type: String, default: null }, isFieldActive: { type: Boolean, default: true } },
    fromName: { value: { type: String, default: null }, isFieldActive: { type: Boolean, default: true } }
}, {
    timestamps: true
});

// Indexes
smtpSettingsSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get published configuration
smtpSettingsSchema.statics.getPublished = async function(filters = {}) {
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

const SMTPSettings = mongoose.model('SMTPSettings', smtpSettingsSchema);

module.exports = SMTPSettings;


