import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dropdown,
  Badge,
  List,
  Button,
  Empty,
  Spin,
  Typography,
  Space,
  Divider,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RocketOutlined,
  EditOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNotifications } from '../contexts/NotificationContext';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      window.addEventListener('mousedown', handleClickOutside);
      return () => window.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const iconMap = {
      workflow_submitted: <FileTextOutlined style={{ color: '#1890ff' }} />,
      workflow_reviewed: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      workflow_approved: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      workflow_rejected: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      workflow_published: <RocketOutlined style={{ color: '#722ed1' }} />,
      workflow_changes_requested: <EditOutlined style={{ color: '#fa8c16' }} />,
      workflow_archived: <InboxOutlined style={{ color: '#8c8c8c' }} />,
      workflow_restored: <ReloadOutlined style={{ color: '#13c2c2' }} />,
      workflow_unpublished: <RocketOutlined style={{ color: '#8c8c8c' }} />,
    };
    return iconMap[type] || <BellOutlined />;
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate to resource if available
    if (notification.resourceId && notification.resource) {
      if (notification.resource === 'page') {
        navigate(`/pages/${notification.resourceId}`);
      } else if (notification.resource === 'section') {
        // For sections, we need the pageId - this might be in metadata
        const pageId = notification.metadata?.pageId;
        if (pageId) {
          navigate(`/pages/${pageId}/sections/${notification.resourceId}`);
        }
      }
    }

    setOpen(false);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      toast.success('All notifications marked as read');
    } else {
      toast.error('Failed to mark all as read');
    }
  };

  // Handle delete
  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    const success = await deleteNotification(notificationId);
    if (success) {
      toast.success('Notification deleted');
    } else {
      toast.error('Failed to delete notification');
    }
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={{
        width: '380px',
        maxHeight: '500px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text strong>Notifications</Text>
        <Space>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={refresh}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Notifications List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading && notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="No notifications"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '40px 20px' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: notification.isRead ? 'white' : '#e6f7ff',
                  borderLeft: notification.isRead ? 'none' : '3px solid #1890ff',
                }}
                onClick={() => handleNotificationClick(notification)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = notification.isRead
                    ? '#fafafa'
                    : '#bae7ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notification.isRead
                    ? 'white'
                    : '#e6f7ff';
                }}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type)}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text strong={!notification.isRead} style={{ fontSize: '14px' }}>
                        {notification.title}
                      </Text>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={(e) => handleDelete(e, notification._id)}
                        style={{ marginLeft: '8px' }}
                      />
                    </div>
                  }
                  description={
                    <div>
                      <Text
                        type="secondary"
                        style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}
                      >
                        {notification.message}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {dayjs(notification.createdAt).fromNow()}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Divider style={{ margin: 0 }} />
          <div style={{ padding: '8px 16px', textAlign: 'center' }}>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setOpen(false);
                // Navigate to a full notifications page if it exists
                // navigate('/notifications');
              }}
            >
              View all notifications
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      getPopupContainer={(trigger) => trigger.parentElement}
    >
      <button
        className="relative p-2 rounded hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 cursor-pointer"
        style={{ border: 'none', background: 'transparent' }}
      >
        <BellOutlined className="text-gray-500 text-lg" />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0px',
              right: '0px',
            }}
          >
            <Badge
              count={unreadCount}
              overflowCount={99}
              size="small"
              style={{
                fontSize: '10px',
              }}
            />
          </span>
        )}
      </button>
    </Dropdown>
  );
};

export default NotificationDropdown;

