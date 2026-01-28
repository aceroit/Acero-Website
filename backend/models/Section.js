const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    pageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Page',
        required: [true, 'Page ID is required'],
        index: true
    },
    sectionTypeSlug: {
        type: String,
        required: [true, 'Section type is required'],
        trim: true,
        lowercase: true,
        index: true
        // e.g., 'hero', 'text_block', 'image_gallery'
    },
    order: {
        type: Number,
        required: true,
        default: 0,
        min: 0
        // Order within the page
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: {}
        // Dynamic content based on section type
        // e.g., { title: "Welcome", subtitle: "...", backgroundImage: "..." }
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    cssClasses: {
        type: String,
        trim: true,
        default: ''
    },
    customStyles: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['draft', 'in_review', 'pending_approval', 'pending_publish', 'published', 'changes_requested'],
        default: 'draft',
        index: true
    },
    version: {
        type: Number,
        default: 1,
        min: 1
    },
    publishedAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes
sectionSchema.index({ pageId: 1, order: 1 });
sectionSchema.index({ pageId: 1, status: 1 });
sectionSchema.index({ sectionTypeSlug: 1, status: 1 });

// Method to duplicate section
sectionSchema.methods.duplicate = async function(newPageId = null) {
    const sectionData = this.toObject();
    delete sectionData._id;
    delete sectionData.createdAt;
    delete sectionData.updatedAt;
    
    if (newPageId) {
        sectionData.pageId = newPageId;
    }
    
    // Increment order to place after original
    sectionData.order = sectionData.order + 1;
    sectionData.status = 'draft';
    
    const newSection = new this.constructor(sectionData);
    await newSection.save();
    
    return newSection;
};

// Static method to get all sections for a page
sectionSchema.statics.getPageSections = async function(pageId, includeHidden = false) {
    const query = { pageId };
    if (!includeHidden) {
        query.isVisible = true;
    }
    
    return await this.find(query)
        .sort({ order: 1 })
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');
};

// Static method to get published sections for public site
sectionSchema.statics.getPublishedSections = async function(pageId) {
    return await this.find({ 
        pageId, 
        status: 'published',
        isVisible: true 
    }).sort({ order: 1 }).select('-createdBy -updatedBy -version');
};

// Static method to reorder sections
sectionSchema.statics.reorderSections = async function(pageId, sectionOrders) {
    // sectionOrders is an array like [{ sectionId: '...', order: 0 }, ...]
    const updatePromises = sectionOrders.map(({ sectionId, order }) => 
        this.findByIdAndUpdate(sectionId, { order })
    );
    
    await Promise.all(updatePromises);
};

const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;

