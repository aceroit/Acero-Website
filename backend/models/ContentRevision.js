const mongoose = require('mongoose');

const workflowStatuses = ['draft', 'in_review', 'pending_approval', 'pending_publish', 'published', 'changes_requested', 'archived'];

const contentRevisionSchema = new mongoose.Schema({
    resource: {
        type: String,
        required: [true, 'Resource type is required'],
        enum: ['project', 'vacancy'],
        index: true,
        trim: true
    },
    liveResourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Live resource ID is required'],
        index: true
    },
    revisionNumber: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    status: {
        type: String,
        enum: workflowStatuses,
        required: true,
        default: 'draft',
        index: true
    },
    draftData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    liveSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    changeSummary: {
        type: String,
        trim: true,
        default: ''
    },
    feedback: {
        type: String,
        trim: true,
        default: ''
    },
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
    publishedAt: {
        type: Date,
        default: null
    },
    closedAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

contentRevisionSchema.index(
    { resource: 1, liveResourceId: 1, isActive: 1 },
    {
        unique: true,
        partialFilterExpression: { isActive: true }
    }
);
contentRevisionSchema.index({ resource: 1, liveResourceId: 1, revisionNumber: -1 });
contentRevisionSchema.index({ resource: 1, status: 1, isActive: 1 });
contentRevisionSchema.index({ createdBy: 1, updatedAt: -1 });

contentRevisionSchema.statics.getNextRevisionNumber = async function(resource, liveResourceId) {
    const latest = await this.findOne({ resource, liveResourceId }).sort({ revisionNumber: -1 }).select('revisionNumber');
    return latest ? latest.revisionNumber + 1 : 1;
};

contentRevisionSchema.statics.getActiveRevision = async function(resource, liveResourceId) {
    return this.findOne({ resource, liveResourceId, isActive: true }).sort({ updatedAt: -1 });
};

module.exports = mongoose.model('ContentRevision', contentRevisionSchema);
