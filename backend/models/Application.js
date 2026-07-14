const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
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
        enum: ['new', 'reviewing', 'shortlisted', 'rejected', 'archived'],
        default: 'new',
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // Reference to vacancy
    vacancyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vacancy',
        required: [true, 'Vacancy ID is required'],
        index: true
    },
    
    // Career form fields (from career-application-form.tsx)
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
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
    mobileNumber: {
        type: String,
        trim: true,
        default: null
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true
    },
    experienceLevel: {
        type: String,
        required: [true, 'Experience level is required'],
        trim: true
    },
    educationLevel: {
        type: String,
        required: [true, 'Education level is required'],
        trim: true
    },
    hasEngineeringDegree: {
        type: String,
        enum: ['yes', 'no'],
        required: [true, 'Engineering degree information is required']
    },
    languages: {
        type: [String],
        default: [],
        required: [true, 'At least one language must be selected']
    },
    coverLetter: {
        type: String,
        required: [true, 'Cover letter is required'],
        trim: true
    },
    cvFile: {
        url: {
            type: String,
            required: [true, 'CV file URL is required']
        },
        publicId: {
            type: String,
            required: [true, 'CV file public ID is required']
        },
        filename: {
            type: String,
            required: [true, 'CV file filename is required']
        },
        size: {
            type: Number,
            default: null
        },
        mimeType: {
            type: String,
            default: null
        }
    },
    
    // Admin tracking
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        trim: true,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
applicationSchema.index({ status: 1, isActive: 1 });
applicationSchema.index({ vacancyId: 1, status: 1 });
applicationSchema.index({ email: 1, submittedAt: -1 });
applicationSchema.index({ submittedAt: -1 });
applicationSchema.index({ vacancyId: 1, submittedAt: -1 });

// Static method to get applications by filters
applicationSchema.statics.getByFilters = async function(filters = {}, options = {}) {
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
    
    const [applications, total] = await Promise.all([
        this.find(query)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);
    
    return { applications, total, page, limit };
};

// Static method to get applications by vacancy
applicationSchema.statics.getByVacancy = async function(vacancyId, options = {}) {
    const {
        page = 1,
        limit = 20,
        sortBy = 'submittedAt',
        sortOrder = 'desc'
    } = options;
    
    const query = {
        vacancyId: vacancyId,
        isActive: true
    };
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const [applications, total] = await Promise.all([
        this.find(query)
            .populate('reviewedBy', 'firstName lastName email')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);
    
    return { applications, total, page, limit };
};

// Static method to get applications by status
applicationSchema.statics.getByStatus = async function(status) {
    return await this.find({
        status: status,
        isActive: true
    })
    .populate('vacancyId', 'title department location type')
    .populate('reviewedBy', 'firstName lastName email')
    .sort({ submittedAt: -1 });
};

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;


