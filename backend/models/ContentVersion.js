const mongoose = require('mongoose');

const contentVersionSchema = new mongoose.Schema({
    resource: {
        type: String,
        required: [true, 'Resource type is required'],
        trim: true,
        index: true
        // e.g., 'page', 'section', 'product', 'project'
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Resource ID is required'],
        index: true
    },
    version: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
        // Full content snapshot at this version
    },
    status: {
        type: String,
        enum: ['draft', 'in_review', 'pending_approval', 'pending_publish', 'published', 'changes_requested', 'archived'],
        required: true,
        index: true
    },
    changeType: {
        type: String,
        enum: ['created', 'updated', 'status_changed', 'deleted'],
        default: 'updated'
    },
    changeSummary: {
        type: String,
        trim: true,
        default: ''
        // Brief description of what changed
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    publishedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    feedback: {
        type: String,
        trim: true,
        default: ''
        // Reviewer/approver feedback
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false } // Only track creation
});

// Compound indexes for efficient querying
contentVersionSchema.index({ resource: 1, resourceId: 1, version: -1 });
contentVersionSchema.index({ resource: 1, resourceId: 1, status: 1 });
contentVersionSchema.index({ createdBy: 1, createdAt: -1 });

// Static method to create a new version
contentVersionSchema.statics.createVersion = async function(resourceType, resourceId, data, userId, status = 'draft', changeSummary = '') {
    // Get the latest version number
    const latestVersion = await this.findOne({ 
        resource: resourceType, 
        resourceId 
    }).sort({ version: -1 });
    
    const versionNumber = latestVersion ? latestVersion.version + 1 : 1;
    
    const version = new this({
        resource: resourceType,
        resourceId,
        version: versionNumber,
        data,
        status,
        changeSummary,
        changeType: versionNumber === 1 ? 'created' : 'updated',
        createdBy: userId
    });
    
    await version.save();
    return version;
};

// Static method to get version history
contentVersionSchema.statics.getHistory = async function(resourceType, resourceId, limit = 50) {
    return await this.find({ 
        resource: resourceType, 
        resourceId 
    })
    .sort({ version: -1 })
    .limit(limit)
    .populate('createdBy', 'firstName lastName email')
    .populate('reviewedBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .populate('publishedBy', 'firstName lastName email');
};

// Static method to get latest version
contentVersionSchema.statics.getLatestVersion = async function(resourceType, resourceId) {
    return await this.findOne({ 
        resource: resourceType, 
        resourceId 
    }).sort({ version: -1 });
};

// Static method to get published version
contentVersionSchema.statics.getPublishedVersion = async function(resourceType, resourceId) {
    return await this.findOne({ 
        resource: resourceType, 
        resourceId,
        status: 'published' 
    }).sort({ version: -1 });
};

// Static method to compare two versions
contentVersionSchema.statics.compareVersions = async function(resourceType, resourceId, version1, version2) {
    const [v1, v2] = await Promise.all([
        this.findOne({ resource: resourceType, resourceId, version: version1 }),
        this.findOne({ resource: resourceType, resourceId, version: version2 })
    ]);
    
    if (!v1 || !v2) {
        throw new Error('One or both versions not found');
    }
    
    return {
        version1: { version: v1.version, data: v1.data, createdAt: v1.createdAt },
        version2: { version: v2.version, data: v2.data, createdAt: v2.createdAt },
        // You can add more sophisticated diff logic here
    };
};

// Method to restore this version
contentVersionSchema.methods.restore = async function(userId) {
    // Create a new version with this version's data
    const restoredVersion = await this.constructor.createVersion(
        this.resource,
        this.resourceId,
        this.data,
        userId,
        'draft',
        `Restored from version ${this.version}`
    );
    
    return restoredVersion;
};

const ContentVersion = mongoose.model('ContentVersion', contentVersionSchema);

module.exports = ContentVersion;

