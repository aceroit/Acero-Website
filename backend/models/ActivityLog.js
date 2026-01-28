const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'publish', 'login', 'logout'],
        index: true
    },
    resource: {
        type: String,
        required: [true, 'Resource is required'],
        trim: true,
        index: true
        // e.g., 'page', 'section', 'user', 'permission'
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        index: true
    },
    changes: {
        before: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        after: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success'
    },
    errorMessage: {
        type: String,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'timestamp', updatedAt: false } // Only track creation time
});

// Compound indexes for efficient querying
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

// Static method to log an activity
activityLogSchema.statics.logActivity = async function(data) {
    try {
        const log = new this(data);
        await log.save();
        return log;
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw error to prevent disrupting main operations
        return null;
    }
};

// Static method to get user's activity history
activityLogSchema.statics.getUserActivity = async function(userId, limit = 50) {
    return await this.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName email');
};

// Static method to get resource history
activityLogSchema.statics.getResourceHistory = async function(resource, resourceId, limit = 50) {
    return await this.find({ resource, resourceId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName email');
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;

