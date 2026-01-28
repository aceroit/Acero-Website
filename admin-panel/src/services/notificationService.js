import API from './api';

/**
 * Notification Service
 * Handles all notification-related API calls
 */

/**
 * Get user's notifications (paginated)
 * @param {Object} params - Query parameters (page, limit, unreadOnly)
 * @returns {Promise} - Response with notifications array
 */
export const getUserNotifications = async (params = {}) => {
  const response = await API.get('/notifications', { params });
  return response.data;
};

/**
 * Get unread notifications
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Promise} - Response with unread notifications
 */
export const getUnreadNotifications = async (limit = 50) => {
  const response = await API.get('/notifications/unread', {
    params: { limit }
  });
  return response.data;
};

/**
 * Get unread notification count
 * @returns {Promise} - Response with unread count
 */
export const getUnreadCount = async () => {
  const response = await API.get('/notifications/unread/count');
  return response.data;
};

/**
 * Mark a notification as read
 * @param {string} id - Notification ID
 * @returns {Promise} - Response
 */
export const markAsRead = async (id) => {
  const response = await API.put(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 * @returns {Promise} - Response with count of marked notifications
 */
export const markAllAsRead = async () => {
  const response = await API.put('/notifications/read-all');
  return response.data;
};

/**
 * Delete a notification
 * @param {string} id - Notification ID
 * @returns {Promise} - Response
 */
export const deleteNotification = async (id) => {
  const response = await API.delete(`/notifications/${id}`);
  return response.data;
};

