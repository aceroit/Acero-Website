import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await notificationService.getUserNotifications({
        page: 1,
        limit: 50,
        unreadOnly: unreadOnly,
      });
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count only (lightweight)
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      const response = await notificationService.markAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === id ? { ...notif, isRead: true, readAt: new Date() } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return response.success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
      return response.success;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    try {
      const response = await notificationService.deleteNotification(id);
      if (response.success) {
        setNotifications((prev) => {
          const deleted = prev.find((n) => n._id === id);
          if (deleted && !deleted.isRead) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((notif) => notif._id !== id);
        });
      }
      return response.success;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, []);

  // Initial fetch and setup polling
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Poll for unread count every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000); // 30 seconds
      
      setPollingInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  // Refresh notifications manually
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

