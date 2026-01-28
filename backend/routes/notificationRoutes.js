const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get user's notifications (paginated)
router.get(
    '/',
    notificationController.getUserNotifications
);

// Get unread notifications
router.get(
    '/unread',
    notificationController.getUnreadNotifications
);

// Get unread count
router.get(
    '/unread/count',
    notificationController.getUnreadCount
);

// Mark notification as read
router.put(
    '/:id/read',
    notificationController.markAsRead
);

// Mark all notifications as read
router.put(
    '/read-all',
    notificationController.markAllAsRead
);

// Delete notification
router.delete(
    '/:id',
    notificationController.deleteNotification
);

module.exports = router;

