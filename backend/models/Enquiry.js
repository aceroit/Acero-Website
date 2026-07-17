const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    // Submission tracking
    submittedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    ipAddress: {
        type: String,
        trim: true,
        default: null
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new',
        index: true
    },
    submissionType: {
        type: String,
        enum: ['contact', 'get_quote'],
        default: 'contact',
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // Contact form fields (from contact-form.tsx)
    purpose: {
        type: String,
        enum: ['general', 'sales', 'support', 'partnership', 'other'],
        required: [true, 'Purpose is required'],
        index: true
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    companyName: {
        type: String,
        trim: true,
        default: null
    },
    mobileNumber: {
        type: String,
        trim: true,
        default: null
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        index: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    country: {
        type: String,
        trim: true,
        default: null
    },
    countryCode: {
        type: String,
        trim: true,
        default: null
    },
    telephoneNumber: {
        type: String,
        trim: true,
        default: null
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true
    },
    
    // Email configuration
    notificationEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true;
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    
    // Admin tracking
    readBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    readAt: {
        type: Date,
        default: null
    },
    repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    repliedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
enquirySchema.index({ status: 1, isActive: 1 });
enquirySchema.index({ email: 1, submittedAt: -1 });
enquirySchema.index({ purpose: 1, status: 1 });
enquirySchema.index({ submittedAt: -1 });

// Static method to get enquiries by filters
enquirySchema.statics.getByFilters = async function(filters = {}, options = {}) {
    const {
        page = 1,
        limit = 20,
        sortBy = 'submittedAt',
        sortOrder = 'desc'
    } = options;
    
    const query = {
        isActive: true,
        ...filters
    };
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const [enquiries, total] = await Promise.all([
        this.find(query)
            .populate('readBy', 'firstName lastName email')
            .populate('repliedBy', 'firstName lastName email')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);
    
    return { enquiries, total, page, limit };
};

// Static method to get enquiries by status
enquirySchema.statics.getByStatus = async function(status) {
    return await this.find({
        status: status,
        isActive: true
    })
    .populate('readBy', 'firstName lastName email')
    .populate('repliedBy', 'firstName lastName email')
    .sort({ submittedAt: -1 });
};

const Enquiry = mongoose.model('Enquiry', enquirySchema);

module.exports = Enquiry;
