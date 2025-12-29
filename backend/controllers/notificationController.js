const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// Get user's notifications (paginated)
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 50, unreadOnly = false } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const result = await Notification.getUserNotifications(userId, {
            limit: parseInt(limit),
            skip,
            unreadOnly: unreadOnly === 'true'
        });

        return successResponse(
            res,
            {
                notifications: result.notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    totalPages: Math.ceil(result.total / parseInt(limit))
                },
                unreadCount: result.unreadCount
            },
            'Notifications retrieved successfully'
        );
    } catch (error) {
        console.error('Get notifications error:', error);
        return errorResponse(res, 'Failed to retrieve notifications', 500);
    }
};

// Get unread notifications
exports.getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 50 } = req.query;

        const result = await Notification.getUserNotifications(userId, {
            limit: parseInt(limit),
            skip: 0,
            unreadOnly: true
        });

        return successResponse(
            res,
            {
                notifications: result.notifications,
                unreadCount: result.unreadCount
            },
            'Unread notifications retrieved successfully'
        );
    } catch (error) {
        console.error('Get unread notifications error:', error);
        return errorResponse(res, 'Failed to retrieve unread notifications', 500);
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.markAsRead(id, userId);

        if (!notification) {
            return errorResponse(res, 'Notification not found', 404);
        }

        return successResponse(
            res,
            { notification },
            'Notification marked as read'
        );
    } catch (error) {
        console.error('Mark as read error:', error);
        return errorResponse(res, 'Failed to mark notification as read', 500);
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Notification.markAllAsRead(userId);

        return successResponse(
            res,
            { markedCount: count },
            `${count} notification(s) marked as read`
        );
    } catch (error) {
        console.error('Mark all as read error:', error);
        return errorResponse(res, 'Failed to mark all notifications as read', 500);
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            userId
        });

        if (!notification) {
            return errorResponse(res, 'Notification not found', 404);
        }

        return successResponse(
            res,
            { message: 'Notification deleted' },
            'Notification deleted successfully'
        );
    } catch (error) {
        console.error('Delete notification error:', error);
        return errorResponse(res, 'Failed to delete notification', 500);
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.getUnreadCount(userId);

        return successResponse(
            res,
            { unreadCount: count },
            'Unread count retrieved successfully'
        );
    } catch (error) {
        console.error('Get unread count error:', error);
        return errorResponse(res, 'Failed to get unread count', 500);
    }
};

module.exports = exports;

