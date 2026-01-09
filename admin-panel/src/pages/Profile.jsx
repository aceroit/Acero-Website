import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Divider, Space, Tag } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/authService';
import { formatRole, getUserFullName } from '../utils/roleHelpers';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, getCurrentUser } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  }, [user, profileForm]);

  // Handle profile update
  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      const response = await authService.updateProfile(values);
      if (response.success) {
        toast.success('Profile updated successfully');
        // Update user from response or refresh
        if (response.data?.user) {
          // User is updated via getCurrentUser which will refresh the context
          await getCurrentUser();
        } else {
          await getCurrentUser();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (values) => {
    setPasswordLoading(true);
    try {
      const response = await authService.changePassword(values);
      if (response.success) {
        toast.success('Password changed successfully');
        passwordForm.resetFields();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0 w-full">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-500 text-sm md:text-base">Manage your account settings and preferences</p>
        </div>

        {/* User Info Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1f2937' }}>
              <UserOutlined style={{ fontSize: '32px', color: '#ffffff' }} />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">{getUserFullName(user)}</h2>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start gap-2 mb-2">
                <MailOutlined /> {user?.email}
              </p>
              <Tag color="default" className="bg-gray-800 text-white border-0">
                {formatRole(user?.role)}
              </Tag>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Update Profile Form */}
          <Card 
            title={<span className="text-gray-900 font-semibold">Update Profile</span>}
            className="border border-gray-200 shadow-md bg-white"
          >
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileUpdate}
          >
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[
                { required: true, message: 'Please enter your first name' },
                { min: 2, message: 'First name must be at least 2 characters' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your first name"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[
                { required: true, message: 'Please enter your last name' },
                { min: 2, message: 'Last name must be at least 2 characters' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your last name"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email"
                size="large"
                disabled
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="w-full sm:w-auto"
                style={{ 
                  backgroundColor: '#1f2937',
                  borderColor: '#1f2937',
                  fontWeight: '600'
                }}
              >
                Update Profile
              </Button>
            </Form.Item>
          </Form>
          </Card>

          {/* Change Password Form */}
          <Card 
            title={<span className="text-gray-900 font-semibold">Change Password</span>}
            className="border border-gray-200 shadow-md bg-white"
          >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
          >
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[
                { required: true, message: 'Please enter current password' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter current password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter new password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter new password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('Passwords do not match')
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm new password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={passwordLoading}
                size="large"
                className="w-full sm:w-auto"
                style={{ 
                  backgroundColor: '#1f2937',
                  borderColor: '#1f2937',
                  fontWeight: '600'
                }}
              >
                Change Password
              </Button>
            </Form.Item>
          </Form>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;

