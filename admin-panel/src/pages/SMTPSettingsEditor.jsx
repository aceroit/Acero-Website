import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Divider, Collapse, Space, Button, Form, Input, Switch, InputNumber } from 'antd';
import { HomeOutlined, HistoryOutlined, MailOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as smtpSettingsService from '../services/smtpSettingsService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const SMTPSettingsEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [form] = Form.useForm();
  const isEdit = !!id;
  
  const [smtpSettings, setSmtpSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: smtpSettings?.status || 'draft',
    resourceType: 'smtp-settings',
    createdBy: smtpSettings?.createdBy?._id || smtpSettings?.createdBy,
  });

  // Fetch SMTP settings data if editing
  useEffect(() => {
    if (isEdit) {
      fetchSMTPSettings();
    }
  }, [id]);

  const fetchSMTPSettings = async () => {
    setFetching(true);
    try {
      const response = await smtpSettingsService.getSMTPSettings(id);
      if (response.success) {
        setSmtpSettings(response.data.smtpSettings);
        form.setFieldsValue({
          title: response.data.smtpSettings.title,
          featured: response.data.smtpSettings.featured === true || response.data.smtpSettings.featured === 'true',
          host: {
            value: response.data.smtpSettings.host?.value || '',
            isFieldActive: response.data.smtpSettings.host?.isFieldActive !== false
          },
          port: {
            value: response.data.smtpSettings.port?.value || null,
            isFieldActive: response.data.smtpSettings.port?.isFieldActive !== false
          },
          secure: {
            value: response.data.smtpSettings.secure?.value || false,
            isFieldActive: response.data.smtpSettings.secure?.isFieldActive !== false
          },
          username: {
            value: response.data.smtpSettings.username?.value || '',
            isFieldActive: response.data.smtpSettings.username?.isFieldActive !== false
          },
          password: {
            value: response.data.smtpSettings.password?.value || '',
            isFieldActive: response.data.smtpSettings.password?.isFieldActive !== false
          },
          fromEmail: {
            value: response.data.smtpSettings.fromEmail?.value || '',
            isFieldActive: response.data.smtpSettings.fromEmail?.isFieldActive !== false
          },
          fromName: {
            value: response.data.smtpSettings.fromName?.value || '',
            isFieldActive: response.data.smtpSettings.fromName?.isFieldActive !== false
          }
        });
      } else {
        toast.error('SMTP settings not found');
        navigate('/website-configurations/smtp');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch SMTP settings');
      navigate('/website-configurations/smtp');
    } finally {
      setFetching(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Check workflow status permissions before submitting
      if (isEdit && !workflowStatus.canEdit.canEdit) {
        toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this SMTP settings');
        setLoading(false);
        return;
      }

      // Transform form values to match backend schema
      const submitData = {
        title: values.title || 'SMTP Settings',
        featured: values.featured || false,
        host: {
          value: values.host?.value || null,
          isFieldActive: values.host?.isFieldActive !== false
        },
        port: {
          value: values.port?.value || null,
          isFieldActive: values.port?.isFieldActive !== false
        },
        secure: {
          value: values.secure?.value || false,
          isFieldActive: values.secure?.isFieldActive !== false
        },
        username: {
          value: values.username?.value || null,
          isFieldActive: values.username?.isFieldActive !== false
        },
        password: {
          value: values.password?.value || null,
          isFieldActive: values.password?.isFieldActive !== false
        },
        fromEmail: {
          value: values.fromEmail?.value || null,
          isFieldActive: values.fromEmail?.isFieldActive !== false
        },
        fromName: {
          value: values.fromName?.value || null,
          isFieldActive: values.fromName?.isFieldActive !== false
        }
      };

      let response;
      if (isEdit) {
        response = await smtpSettingsService.updateSMTPSettings(id, submitData);
      } else {
        response = await smtpSettingsService.createSMTPSettings(submitData);
      }

      if (response.success) {
        toast.success(isEdit ? 'SMTP settings updated successfully' : 'SMTP settings created successfully');
        if (isEdit) {
          fetchSMTPSettings();
        } else {
          navigate(`/website-configurations/smtp/${response.data.smtpSettings._id}`);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || (isEdit ? 'Failed to update SMTP settings' : 'Failed to create SMTP settings');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/website-configurations/smtp');
  };

  const handleWorkflowActionComplete = async () => {
    if (isEdit) {
      await fetchSMTPSettings();
      setTimeout(() => {
        fetchSMTPSettings();
      }, 500);
    }
  };

  const breadcrumbItems = [
    { title: <a href="/dashboard"><HomeOutlined /></a> },
    { title: <a href="/website-configurations"><span>Website Configurations</span></a> },
    { title: <a href="/website-configurations/smtp"><span>SMTP Settings</span></a> },
    ...(isEdit && smtpSettings ? [{ title: <span>Edit</span> }] : [{ title: <span>Create New</span> }]),
  ];

  if (fetching) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  const requiredPermission = isEdit ? 'update' : 'create';
  if (!hasPermission('smtp-settings', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} SMTP settings.</p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Breadcrumb */}
        <Breadcrumb
          items={breadcrumbItems}
          className="text-sm"
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              {isEdit ? `Edit SMTP Settings${smtpSettings?.title ? `: ${smtpSettings.title}` : ''}` : 'Create New SMTP Settings'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update SMTP email server configuration and metadata'
                : 'Configure SMTP settings for sending emails from your website'
              }
            </p>
          </div>
          {isEdit && smtpSettings && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={smtpSettings.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="smtp-settings"
                  resourceId={id}
                  currentStatus={smtpSettings.status}
                  createdBy={smtpSettings.createdBy?._id || smtpSettings.createdBy}
                  onActionComplete={handleWorkflowActionComplete}
                  showLabels={true}
                  size="middle"
                />
              </Space>
            </div>
          )}
        </div>

        {/* Form Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          {isEdit && smtpSettings ? (
            <WorkflowStatusGuard
              status={smtpSettings.status}
              resourceType="smtp-settings"
              resourceId={id}
              createdBy={smtpSettings.createdBy?._id || smtpSettings.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <SMTPSettingsForm
                form={form}
                initialValues={smtpSettings}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <SMTPSettingsForm
              form={form}
              initialValues={{}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && smtpSettings && (
          <Card className="border border-gray-200 shadow-md bg-white">
            <Collapse
              items={[
                {
                  key: 'timeline',
                  label: (
                    <Space>
                      <HistoryOutlined />
                      <span>Version History & Workflow Timeline</span>
                    </Space>
                  ),
                  extra: (
                    <Button
                      type="link"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/versions/smtp-settings/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="smtp-settings"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('smtp-settings', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchSMTPSettings();
                          }
                        } catch (error) {
                          toast.error(error.response?.data?.message || 'Failed to restore version');
                        }
                      }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

// SMTP Settings Form Component
const SMTPSettingsForm = ({ form, initialValues, onSubmit, onCancel, loading, isEdit }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{
        title: initialValues.title || 'SMTP Settings',
        featured: initialValues.featured || false,
        host: {
          value: initialValues.host?.value || '',
          isFieldActive: initialValues.host?.isFieldActive !== false
        },
        port: {
          value: initialValues.port?.value || null,
          isFieldActive: initialValues.port?.isFieldActive !== false
        },
        secure: {
          value: initialValues.secure?.value || false,
          isFieldActive: initialValues.secure?.isFieldActive !== false
        },
        username: {
          value: initialValues.username?.value || '',
          isFieldActive: initialValues.username?.isFieldActive !== false
        },
        password: {
          value: initialValues.password?.value || '',
          isFieldActive: initialValues.password?.isFieldActive !== false
        },
        fromEmail: {
          value: initialValues.fromEmail?.value || '',
          isFieldActive: initialValues.fromEmail?.isFieldActive !== false
        },
        fromName: {
          value: initialValues.fromName?.value || '',
          isFieldActive: initialValues.fromName?.isFieldActive !== false
        }
      }}
    >
      <Form.Item name="title" label="Title">
        <Input placeholder="SMTP Settings" />
      </Form.Item>

      <Form.Item name="featured" label="Featured" valuePropName="checked" tooltip="Mark as featured to publish (required for public site)">
        <Switch />
      </Form.Item>

      <Divider>SMTP Server Configuration</Divider>

      <Form.Item name={['host', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Host Active" unCheckedChildren="Host Inactive" />
      </Form.Item>

      <Form.Item 
        name={['host', 'value']} 
        label="SMTP Host"
        rules={[
          { required: true, message: 'Please enter SMTP host' }
        ]}
      >
        <Input placeholder="smtp.gmail.com" />
      </Form.Item>

      <Form.Item name={['port', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Port Active" unCheckedChildren="Port Inactive" />
      </Form.Item>

      <Form.Item 
        name={['port', 'value']} 
        label="SMTP Port"
        rules={[
          { required: true, message: 'Please enter SMTP port' },
          { type: 'number', min: 1, max: 65535, message: 'Port must be between 1 and 65535' }
        ]}
      >
        <InputNumber 
          placeholder="587" 
          style={{ width: '100%' }}
          min={1}
          max={65535}
        />
      </Form.Item>

      <Form.Item name={['secure', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Secure Active" unCheckedChildren="Secure Inactive" />
      </Form.Item>

      <Form.Item name={['secure', 'value']} valuePropName="checked">
        <Switch checkedChildren="Use TLS/SSL" unCheckedChildren="No Encryption" />
        <span className="ml-2 text-sm text-gray-600">Enable for secure connections (TLS/SSL)</span>
      </Form.Item>

      <Divider>Authentication</Divider>

      <Form.Item name={['username', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Username Active" unCheckedChildren="Username Inactive" />
      </Form.Item>

      <Form.Item 
        name={['username', 'value']} 
        label="SMTP Username"
        rules={[
          { required: true, message: 'Please enter SMTP username' }
        ]}
      >
        <Input placeholder="your-email@gmail.com" />
      </Form.Item>

      <Form.Item name={['password', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Password Active" unCheckedChildren="Password Inactive" />
      </Form.Item>

      <Form.Item 
        name={['password', 'value']} 
        label="SMTP Password"
        rules={[
          { required: true, message: 'Please enter SMTP password' }
        ]}
      >
        <Input.Password placeholder="Enter SMTP password" />
      </Form.Item>

      <Divider>Email Settings</Divider>

      <Form.Item name={['fromEmail', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="From Email Active" unCheckedChildren="From Email Inactive" />
      </Form.Item>

      <Form.Item 
        name={['fromEmail', 'value']} 
        label="From Email Address"
        rules={[
          { required: true, message: 'Please enter from email address' },
          { type: 'email', message: 'Please enter a valid email address' }
        ]}
      >
        <Input placeholder="noreply@example.com" />
      </Form.Item>

      <Form.Item name={['fromName', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="From Name Active" unCheckedChildren="From Name Inactive" />
      </Form.Item>

      <Form.Item 
        name={['fromName', 'value']} 
        label="From Name"
        rules={[
          { required: true, message: 'Please enter from name' }
        ]}
      >
        <Input placeholder="Your Company Name" />
      </Form.Item>

      <Form.Item className="mb-0 mt-6">
        <div className="flex justify-end gap-2">
          <Button 
            onClick={onCancel} 
            disabled={loading}
            size="large"
            style={{
              height: '44px',
              borderRadius: '8px'
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
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
            {isEdit ? 'Update Settings' : 'Create Settings'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default SMTPSettingsEditor;

