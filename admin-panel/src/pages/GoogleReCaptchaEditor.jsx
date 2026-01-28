import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Divider, Collapse, Space, Button, Form, Input, Switch, Select, Alert } from 'antd';
import { HomeOutlined, HistoryOutlined, SafetyOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as googleReCaptchaService from '../services/googleReCaptchaService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;
const { Option } = Select;

const GoogleReCaptchaEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [form] = Form.useForm();
  const isEdit = !!id;
  
  const [recaptchaConfig, setRecaptchaConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: recaptchaConfig?.status || 'draft',
    resourceType: 'google-recaptcha',
    createdBy: recaptchaConfig?.createdBy?._id || recaptchaConfig?.createdBy,
  });

  // Fetch Google ReCaptcha configuration data if editing
  useEffect(() => {
    if (isEdit) {
      fetchGoogleReCaptcha();
    }
  }, [id]);

  const fetchGoogleReCaptcha = async () => {
    setFetching(true);
    try {
      const response = await googleReCaptchaService.getGoogleReCaptcha(id);
      if (response.success) {
        setRecaptchaConfig(response.data.googleReCaptcha);
        form.setFieldsValue({
          title: response.data.googleReCaptcha.title,
          featured: response.data.googleReCaptcha.featured === true || response.data.googleReCaptcha.featured === 'true',
          siteKey: {
            value: response.data.googleReCaptcha.siteKey?.value || '',
            isFieldActive: response.data.googleReCaptcha.siteKey?.isFieldActive !== false
          },
          secretKey: {
            value: response.data.googleReCaptcha.secretKey?.value || '',
            isFieldActive: response.data.googleReCaptcha.secretKey?.isFieldActive !== false
          },
          version: {
            value: response.data.googleReCaptcha.version?.value || 'v3',
            isFieldActive: response.data.googleReCaptcha.version?.isFieldActive !== false
          },
          enabled: {
            value: response.data.googleReCaptcha.enabled?.value !== false,
            isFieldActive: response.data.googleReCaptcha.enabled?.isFieldActive !== false
          }
        });
      } else {
        toast.error('Google ReCaptcha configuration not found');
        navigate('/website-configurations/recaptcha');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch Google ReCaptcha configuration');
      navigate('/website-configurations/recaptcha');
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
        toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this Google ReCaptcha configuration');
        setLoading(false);
        return;
      }

      // Transform form values to match backend schema
      const submitData = {
        title: values.title || 'Google ReCaptcha',
        featured: values.featured || false,
        siteKey: {
          value: values.siteKey?.value || null,
          isFieldActive: values.siteKey?.isFieldActive !== false
        },
        secretKey: {
          value: values.secretKey?.value || null,
          isFieldActive: values.secretKey?.isFieldActive !== false
        },
        version: {
          value: values.version?.value || 'v3',
          isFieldActive: values.version?.isFieldActive !== false
        },
        enabled: {
          value: values.enabled?.value !== false,
          isFieldActive: values.enabled?.isFieldActive !== false
        }
      };

      let response;
      if (isEdit) {
        response = await googleReCaptchaService.updateGoogleReCaptcha(id, submitData);
      } else {
        response = await googleReCaptchaService.createGoogleReCaptcha(submitData);
      }

      if (response.success) {
        toast.success(isEdit ? 'Google ReCaptcha configuration updated successfully' : 'Google ReCaptcha configuration created successfully');
        if (isEdit) {
          fetchGoogleReCaptcha();
        } else {
          navigate(`/website-configurations/recaptcha/${response.data.googleReCaptcha._id}`);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || (isEdit ? 'Failed to update Google ReCaptcha configuration' : 'Failed to create Google ReCaptcha configuration');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/website-configurations/recaptcha');
  };

  const handleWorkflowActionComplete = async () => {
    if (isEdit) {
      await fetchGoogleReCaptcha();
      setTimeout(() => {
        fetchGoogleReCaptcha();
      }, 500);
    }
  };

  const breadcrumbItems = [
    { title: <a href="/dashboard"><HomeOutlined /></a> },
    { title: <a href="/website-configurations"><span>Website Configurations</span></a> },
    { title: <a href="/website-configurations/recaptcha"><span>Google ReCaptcha</span></a> },
    ...(isEdit && recaptchaConfig ? [{ title: <span>Edit</span> }] : [{ title: <span>Create New</span> }]),
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
  if (!hasPermission('google-recaptcha', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} Google ReCaptcha configurations.</p>
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
              {isEdit ? `Edit Google ReCaptcha${recaptchaConfig?.title ? `: ${recaptchaConfig.title}` : ''}` : 'Create New Google ReCaptcha Configuration'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update Google ReCaptcha configuration and metadata'
                : 'Configure Google ReCaptcha to protect your forms from bots'
              }
            </p>
          </div>
          {isEdit && recaptchaConfig && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={recaptchaConfig.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="google-recaptcha"
                  resourceId={id}
                  currentStatus={recaptchaConfig.status}
                  createdBy={recaptchaConfig.createdBy?._id || recaptchaConfig.createdBy}
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
          {isEdit && recaptchaConfig ? (
            <WorkflowStatusGuard
              status={recaptchaConfig.status}
              resourceType="google-recaptcha"
              resourceId={id}
              createdBy={recaptchaConfig.createdBy?._id || recaptchaConfig.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <GoogleReCaptchaForm
                form={form}
                initialValues={recaptchaConfig}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <GoogleReCaptchaForm
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
        {isEdit && recaptchaConfig && (
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
                        navigate(`/versions/google-recaptcha/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="google-recaptcha"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('google-recaptcha', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchGoogleReCaptcha();
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

// Google ReCaptcha Form Component
const GoogleReCaptchaForm = ({ form, initialValues, onSubmit, onCancel, loading, isEdit }) => {
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0 && form) {
      form.setFieldsValue({
        title: initialValues.title || 'Google ReCaptcha',
        featured: initialValues.featured === true || initialValues.featured === 'true',
        siteKey: {
          value: initialValues.siteKey?.value || '',
          isFieldActive: initialValues.siteKey?.isFieldActive !== false
        },
        secretKey: {
          value: initialValues.secretKey?.value || '',
          isFieldActive: initialValues.secretKey?.isFieldActive !== false
        },
        version: {
          value: initialValues.version?.value || 'v3',
          isFieldActive: initialValues.version?.isFieldActive !== false
        },
        enabled: {
          value: initialValues.enabled?.value !== false,
          isFieldActive: initialValues.enabled?.isFieldActive !== false
        }
      });
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{
        title: initialValues.title || 'Google ReCaptcha',
        featured: initialValues.featured || false,
        siteKey: {
          value: initialValues.siteKey?.value || '',
          isFieldActive: initialValues.siteKey?.isFieldActive !== false
        },
        secretKey: {
          value: initialValues.secretKey?.value || '',
          isFieldActive: initialValues.secretKey?.isFieldActive !== false
        },
        version: {
          value: initialValues.version?.value || 'v3',
          isFieldActive: initialValues.version?.isFieldActive !== false
        },
        enabled: {
          value: initialValues.enabled?.value !== false,
          isFieldActive: initialValues.enabled?.isFieldActive !== false
        }
      }}
    >
      <Alert
        message="Google ReCaptcha Setup"
        description="To use Google ReCaptcha, you need to register your site at https://www.google.com/recaptcha/admin. You'll receive a Site Key (public) and Secret Key (private). The Site Key is used on the frontend, while the Secret Key is used for server-side verification."
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        className="mb-6"
      />

      <Form.Item name="title" label="Title">
        <Input placeholder="Google ReCaptcha" />
      </Form.Item>

      <Form.Item name="featured" label="Featured" valuePropName="checked" tooltip="Mark as featured to publish (required for public site)">
        <Switch />
      </Form.Item>

      <Divider>ReCaptcha Configuration</Divider>

      <Form.Item name={['enabled', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Enabled Field Active" unCheckedChildren="Enabled Field Inactive" />
      </Form.Item>

      <Form.Item name={['enabled', 'value']} valuePropName="checked">
        <Switch checkedChildren="ReCaptcha Enabled" unCheckedChildren="ReCaptcha Disabled" />
        <span className="ml-2 text-sm text-gray-600">Enable or disable ReCaptcha protection</span>
      </Form.Item>

      <Form.Item name={['version', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Version Field Active" unCheckedChildren="Version Field Inactive" />
      </Form.Item>

      <Form.Item 
        name={['version', 'value']} 
        label="ReCaptcha Version"
        rules={[
          { required: true, message: 'Please select ReCaptcha version' }
        ]}
      >
        <Select placeholder="Select ReCaptcha version">
          <Option value="v3">v3 (Recommended - Invisible, score-based)</Option>
          <Option value="v2-checkbox">v2 Checkbox (User clicks checkbox)</Option>
          <Option value="v2-invisible">v2 Invisible (No user interaction)</Option>
        </Select>
      </Form.Item>

      <Divider>API Keys</Divider>

      <Form.Item name={['siteKey', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Site Key Active" unCheckedChildren="Site Key Inactive" />
      </Form.Item>

      <Form.Item 
        name={['siteKey', 'value']} 
        label="Site Key (Public Key)"
        rules={[
          { required: true, message: 'Please enter ReCaptcha Site Key' }
        ]}
        help="This is the public key that will be used on the frontend. It's safe to expose in client-side code."
      >
        <Input placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" />
      </Form.Item>

      <Form.Item name={['secretKey', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Secret Key Active" unCheckedChildren="Secret Key Inactive" />
      </Form.Item>

      <Form.Item 
        name={['secretKey', 'value']} 
        label="Secret Key (Private Key)"
        rules={[
          { required: true, message: 'Please enter ReCaptcha Secret Key' }
        ]}
        help="This is the private key used for server-side verification. Keep it secure and never expose it in client-side code."
      >
        <Input.Password placeholder="6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJes" />
      </Form.Item>

      <Alert
        message="Security Note"
        description="The Secret Key should never be exposed in frontend code. It's only used on the server side to verify ReCaptcha responses. Make sure to keep it secure."
        type="warning"
        showIcon
        className="mb-6"
      />

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
            {isEdit ? 'Update Configuration' : 'Create Configuration'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default GoogleReCaptchaEditor;

