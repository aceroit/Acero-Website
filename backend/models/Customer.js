const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        index: true
    },
    
    // Customer Image
    customerImage: {
        url: {
            type: String,
            default: null
        },
        publicId: {
            type: String,
            default: null
        },
        width: {
            type: Number,
            default: null
        },
        height: {
            type: Number,
            default: null
        }
        // Minimum dimensions: 208 x 104px
    },
    
    // Order for display priority
    order: {
        type: Number,
        required: [true, 'Order is required'],
        default: 0,
        min: 0
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
customerSchema.index({ isActive: 1, order: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ status: 1, isActive: 1 });
// Compound index for public queries (status, featured, isActive)
customerSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get active customers ordered by order field
customerSchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ order: 1, name: 1 });
};

// Static method to get published and featured customers
customerSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };
    
    return await this.find(query).sort({ order: 1, name: 1 });
};

// Static method to search customers
customerSchema.statics.search = async function(query, options = {}) {
    const {
        page = 1,
        limit = 20
    } = options;
    
    const searchQuery = {
        isActive: true,
        name: { $regex: query, $options: 'i' }
    };
    
    const skip = (page - 1) * limit;
    
    const [customers, total] = await Promise.all([
        this.find(searchQuery)
            .sort({ order: 1, name: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(searchQuery)
    ]);
    
    return { customers, total, page, limit };
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;

