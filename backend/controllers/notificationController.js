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
            200,
            'Notifications retrieved successfully',
            {
                notifications: result.notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    totalPages: Math.ceil(result.total / parseInt(limit))
                },
                unreadCount: result.unreadCount
            }
        );
    } catch (error) {
        console.error('Get notifications error:', error);
        return errorResponse(res, 500, 'Failed to retrieve notifications', error.message);
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
            200,
            'Unread notifications retrieved successfully',
            {
                notifications: result.notifications,
                unreadCount: result.unreadCount
            }
        );
    } catch (error) {
        console.error('Get unread notifications error:', error);
        return errorResponse(res, 500, 'Failed to retrieve unread notifications', error.message);
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.markAsRead(id, userId);

        if (!notification) {
            return errorResponse(res, 404, 'Notification not found');
        }

        return successResponse(
            res,
            200,
            'Notification marked as read',
            { notification }
        );
    } catch (error) {
        console.error('Mark as read error:', error);
        return errorResponse(res, 500, 'Failed to mark notification as read', error.message);
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Notification.markAllAsRead(userId);

        return successResponse(
            res,
            200,
            `${count} notification(s) marked as read`,
            { markedCount: count }
        );
    } catch (error) {
        console.error('Mark all as read error:', error);
        return errorResponse(res, 500, 'Failed to mark all notifications as read', error.message);
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
            return errorResponse(res, 404, 'Notification not found');
        }

        return successResponse(
            res,
            200,
            'Notification deleted successfully',
            { message: 'Notification deleted' }
        );
    } catch (error) {
        console.error('Delete notification error:', error);
        return errorResponse(res, 500, 'Failed to delete notification', error.message);
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.getUnreadCount(userId);

        return successResponse(
            res,
            200,
            'Unread count retrieved successfully',
            { unreadCount: count }
        );
    } catch (error) {
        console.error('Get unread count error:', error);
        return errorResponse(res, 500, 'Failed to get unread count', error.message);
    }
};

module.exports = exports;

