const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    type: {
        type: String,
        required: [true, 'Notification type is required'],
        enum: [
            'workflow_submitted',
            'workflow_reviewed',
            'workflow_approved',
            'workflow_rejected',
            'workflow_published',
            'workflow_changes_requested',
            'workflow_archived',
            'workflow_restored',
            'workflow_unpublished'
        ],
        index: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true
    },
    icon: {
        type: String,
        default: 'bell',
        trim: true
    },
    resource: {
        type: String,
        required: [true, 'Resource type is required'],
        enum: [
            'page', 
            'section', 
            'user', 
            'system',
            'project',
            'branch',
            'customer',
            'certification',
            'company-update',
            'company-update-category',
            'brochure',
            'building-type',
            'industry',
            'country',
            'region',
            'area',
            'header-configuration',
            'footer-configuration',
            'website-appearance',
            'smtp-settings',
            'google-recaptcha',
            'google-maps',
            'vacancy'
        ],
        index: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        index: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // Can store: actorName, actionType, previousStatus, newStatus, etc.
    }
}, {
    timestamps: true
});

// Compound indexes for efficient querying
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Static method to create a notification
notificationSchema.statics.createNotification = async function(data) {
    try {
        const notification = new this(data);
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};

// Static method to get user's notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
    const {
        limit = 50,
        skip = 0,
        unreadOnly = false
    } = options;
    
    const query = { userId };
    if (unreadOnly) {
        query.isRead = false;
    }
    
    const notifications = await this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    
    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({ userId, isRead: false });
    
    return {
        notifications,
        total,
        unreadCount
    };
};

// Static method to mark notification as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
    return await this.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true, readAt: new Date() },
        { new: true }
    );
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = async function(userId) {
    const result = await this.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
    );
    
    return result.modifiedCount;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({ userId, isRead: false });
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await this.deleteMany({
        isRead: true,
        createdAt: { $lt: cutoffDate }
    });
    
    return result.deletedCount;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

