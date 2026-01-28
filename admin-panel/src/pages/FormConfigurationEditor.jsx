import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Divider, Space, Button, Form, Input, InputNumber, Alert } from 'antd';
import { HomeOutlined, SaveOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import * as formConfigurationService from '../services/formConfigurationService';
import { toast } from 'react-toastify';

const FormConfigurationEditor = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [form] = Form.useForm();
  
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch active configuration
  useEffect(() => {
    fetchActiveConfiguration();
  }, []);

  const fetchActiveConfiguration = async () => {
    setFetching(true);
    try {
      const response = await formConfigurationService.getActiveFormConfiguration();
      if (response.success) {
        const configData = response.data.formConfiguration || response.data;
        setConfig(configData);
        form.setFieldsValue({
          career: {
            thankYouTimeout: configData.career?.thankYouTimeout || 5,
            thankYouRedirectUrl: configData.career?.thankYouRedirectUrl || '/'
          },
          contact: {
            thankYouTimeout: configData.contact?.thankYouTimeout || 5,
            thankYouRedirectUrl: configData.contact?.thankYouRedirectUrl || '/'
          },
          defaultEnquiryEmail: configData.defaultEnquiryEmail || '',
          defaultApplicationEmail: configData.defaultApplicationEmail || ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch form configuration');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (values) => {
    if (!hasPermission('form-configurations', 'update')) {
      toast.error('You do not have permission to update form configuration');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (config?._id) {
        // Update existing configuration
        response = await formConfigurationService.updateFormConfiguration(config._id, {
          ...values,
          isActive: true
        });
      } else {
        // Create new configuration (shouldn't happen, but handle it)
        response = await formConfigurationService.createFormConfiguration({
          ...values,
          isActive: true
        });
      }

      if (response.success) {
        toast.success('Form configuration updated successfully');
        await fetchActiveConfiguration();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update form configuration');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            {
              title: (
                <a href="/dashboard">
                  <HomeOutlined />
                </a>
              ),
            },
            {
              title: (
                <a href="/enquiries-applications">
                  <span>Enquiries and Applications</span>
                </a>
              ),
            },
            {
              title: <span>Form Configuration</span>,
            },
          ]}
          className="text-sm"
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Form Configuration
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Configure thank you page settings and default notification emails
            </p>
          </div>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/enquiries-applications')}
              size="large"
            >
              Back
            </Button>
          </Space>
        </div>

        {/* Info Alert */}
        <Alert
          message="Form Configuration"
          description="This configuration applies to both Career and Contact Us forms. The thank you page settings control how long the thank you message is displayed and where users are redirected after submission."
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
        />

        {/* Form Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              career: {
                thankYouTimeout: 5,
                thankYouRedirectUrl: '/'
              },
              contact: {
                thankYouTimeout: 5,
                thankYouRedirectUrl: '/'
              },
              defaultEnquiryEmail: '',
              defaultApplicationEmail: ''
            }}
          >
            {/* Career Form Configuration */}
            <Divider orientation="left" className="text-lg font-semibold text-gray-900">
              Career Form Settings
            </Divider>

            <Form.Item
              label="Thank You Page Timeout (seconds)"
              name={['career', 'thankYouTimeout']}
              rules={[
                { required: true, message: 'Timeout is required' },
                { type: 'number', min: 1, max: 300, message: 'Timeout must be between 1 and 300 seconds' }
              ]}
              tooltip="How many seconds the thank you page should be visible before redirecting"
            >
              <InputNumber
                min={1}
                max={300}
                style={{ width: '100%' }}
                placeholder="5"
                className="border-gray-300"
              />
            </Form.Item>

            <Form.Item
              label="Thank You Page Redirect URL"
              name={['career', 'thankYouRedirectUrl']}
              rules={[
                { required: true, message: 'Redirect URL is required' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.reject(new Error('Redirect URL is required'));
                    if (value.startsWith('/') || /^https?:\/\//.test(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('URL must start with / or be a valid URL (http:// or https://)'));
                  }
                }
              ]}
              tooltip="Where users should be redirected after the thank you page timeout. Use a relative path (e.g., /) or a full URL."
            >
              <Input
                placeholder="/ or https://example.com"
                className="border-gray-300"
              />
            </Form.Item>

            {/* Contact Form Configuration */}
            <Divider orientation="left" className="text-lg font-semibold text-gray-900">
              Contact Form Settings
            </Divider>

            <Form.Item
              label="Thank You Page Timeout (seconds)"
              name={['contact', 'thankYouTimeout']}
              rules={[
                { required: true, message: 'Timeout is required' },
                { type: 'number', min: 1, max: 300, message: 'Timeout must be between 1 and 300 seconds' }
              ]}
              tooltip="How many seconds the thank you page should be visible before redirecting"
            >
              <InputNumber
                min={1}
                max={300}
                style={{ width: '100%' }}
                placeholder="5"
                className="border-gray-300"
              />
            </Form.Item>

            <Form.Item
              label="Thank You Page Redirect URL"
              name={['contact', 'thankYouRedirectUrl']}
              rules={[
                { required: true, message: 'Redirect URL is required' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.reject(new Error('Redirect URL is required'));
                    if (value.startsWith('/') || /^https?:\/\//.test(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('URL must start with / or be a valid URL (http:// or https://)'));
                  }
                }
              ]}
              tooltip="Where users should be redirected after the thank you page timeout. Use a relative path (e.g., /) or a full URL."
            >
              <Input
                placeholder="/ or https://example.com"
                className="border-gray-300"
              />
            </Form.Item>

            {/* Default Notification Emails */}
            <Divider orientation="left" className="text-lg font-semibold text-gray-900">
              Default Notification Emails
            </Divider>

            <Alert
              message="Default Email Addresses"
              description="These email addresses will be used when no specific notification email is configured for individual vacancies or enquiries. Leave empty to require email configuration for each item."
              type="info"
              showIcon
              className="mb-4"
            />

            <Form.Item
              label="Default Enquiry Email"
              name="defaultEnquiryEmail"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.trim() === '') {
                      return Promise.resolve(); // Optional field
                    }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (emailRegex.test(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Please enter a valid email address'));
                  }
                }
              ]}
              tooltip="Default email address for enquiry notifications. Used when no specific email is configured for an enquiry."
            >
              <Input
                type="email"
                placeholder="enquiries@example.com"
                className="border-gray-300"
              />
            </Form.Item>

            <Form.Item
              label="Default Application Email"
              name="defaultApplicationEmail"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.trim() === '') {
                      return Promise.resolve(); // Optional field
                    }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (emailRegex.test(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Please enter a valid email address'));
                  }
                }
              ]}
              tooltip="Default email address for application notifications. Used when no specific email is configured for a vacancy."
            >
              <Input
                type="email"
                placeholder="applications@example.com"
                className="border-gray-300"
              />
            </Form.Item>

            {/* Submit Button */}
            <Form.Item className="mb-0 mt-6">
              <div className="flex justify-end gap-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  size="large"
                  className="text-white"
                  style={{
                    backgroundColor: '#1f2937',
                    borderColor: '#1f2937',
                    height: '44px',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
                >
                  Save Configuration
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default FormConfigurationEditor;

