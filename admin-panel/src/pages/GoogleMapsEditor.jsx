import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Divider, Collapse, Space, Button, Form, Input, Switch, Alert } from 'antd';
import { HomeOutlined, HistoryOutlined, EnvironmentOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as googleMapsService from '../services/googleMapsService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const GoogleMapsEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [form] = Form.useForm();
  const isEdit = !!id;
  
  const [mapsConfig, setMapsConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: mapsConfig?.status || 'draft',
    resourceType: 'google-maps',
    createdBy: mapsConfig?.createdBy?._id || mapsConfig?.createdBy,
  });

  // Fetch Google Maps configuration data if editing
  useEffect(() => {
    if (isEdit) {
      fetchGoogleMaps();
    }
  }, [id]);

  const fetchGoogleMaps = async () => {
    setFetching(true);
    try {
      const response = await googleMapsService.getGoogleMaps(id);
      if (response.success) {
        setMapsConfig(response.data.googleMaps);
        form.setFieldsValue({
          title: response.data.googleMaps.title,
          featured: response.data.googleMaps.featured === true || response.data.googleMaps.featured === 'true',
          apiKey: {
            value: response.data.googleMaps.apiKey?.value || '',
            isFieldActive: response.data.googleMaps.apiKey?.isFieldActive !== false
          },
          enabled: {
            value: response.data.googleMaps.enabled?.value !== false,
            isFieldActive: response.data.googleMaps.enabled?.isFieldActive !== false
          }
        });
      } else {
        toast.error('Google Maps configuration not found');
        navigate('/website-configurations/maps');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch Google Maps configuration');
      navigate('/website-configurations/maps');
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
        toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this Google Maps configuration');
        setLoading(false);
        return;
      }

      // Transform form values to match backend schema
      const submitData = {
        title: values.title || 'Google Maps',
        featured: values.featured || false,
        apiKey: {
          value: values.apiKey?.value || null,
          isFieldActive: values.apiKey?.isFieldActive !== false
        },
        enabled: {
          value: values.enabled?.value !== false,
          isFieldActive: values.enabled?.isFieldActive !== false
        }
      };

      let response;
      if (isEdit) {
        response = await googleMapsService.updateGoogleMaps(id, submitData);
      } else {
        response = await googleMapsService.createGoogleMaps(submitData);
      }

      if (response.success) {
        toast.success(isEdit ? 'Google Maps configuration updated successfully' : 'Google Maps configuration created successfully');
        if (isEdit) {
          fetchGoogleMaps();
        } else {
          navigate(`/website-configurations/maps/${response.data.googleMaps._id}`);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || (isEdit ? 'Failed to update Google Maps configuration' : 'Failed to create Google Maps configuration');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/website-configurations/maps');
  };

  const handleWorkflowActionComplete = async () => {
    if (isEdit) {
      await fetchGoogleMaps();
      setTimeout(() => {
        fetchGoogleMaps();
      }, 500);
    }
  };

  const breadcrumbItems = [
    { title: <a href="/dashboard"><HomeOutlined /></a> },
    { title: <a href="/website-configurations"><span>Website Configurations</span></a> },
    { title: <a href="/website-configurations/maps"><span>Google Maps</span></a> },
    ...(isEdit && mapsConfig ? [{ title: <span>Edit</span> }] : [{ title: <span>Create New</span> }]),
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
  if (!hasPermission('google-maps', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} Google Maps configurations.</p>
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
              {isEdit ? `Edit Google Maps${mapsConfig?.title ? `: ${mapsConfig.title}` : ''}` : 'Create New Google Maps Configuration'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update Google Maps API key configuration and metadata'
                : 'Configure Google Maps API key for map pinpoints and reverse geocoding'
              }
            </p>
          </div>
          {isEdit && mapsConfig && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={mapsConfig.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="google-maps"
                  resourceId={id}
                  currentStatus={mapsConfig.status}
                  createdBy={mapsConfig.createdBy?._id || mapsConfig.createdBy}
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
          {isEdit && mapsConfig ? (
            <WorkflowStatusGuard
              status={mapsConfig.status}
              resourceType="google-maps"
              resourceId={id}
              createdBy={mapsConfig.createdBy?._id || mapsConfig.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <GoogleMapsForm
                form={form}
                initialValues={mapsConfig}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <GoogleMapsForm
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
        {isEdit && mapsConfig && (
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
                        navigate(`/versions/google-maps/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="google-maps"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('google-maps', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchGoogleMaps();
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

// Google Maps Form Component
const GoogleMapsForm = ({ form, initialValues, onSubmit, onCancel, loading, isEdit }) => {
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0 && form) {
      form.setFieldsValue({
        title: initialValues.title || 'Google Maps',
        featured: initialValues.featured === true || initialValues.featured === 'true',
        apiKey: {
          value: initialValues.apiKey?.value || '',
          isFieldActive: initialValues.apiKey?.isFieldActive !== false
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
        title: initialValues.title || 'Google Maps',
        featured: initialValues.featured || false,
        apiKey: {
          value: initialValues.apiKey?.value || '',
          isFieldActive: initialValues.apiKey?.isFieldActive !== false
        },
        enabled: {
          value: initialValues.enabled?.value !== false,
          isFieldActive: initialValues.enabled?.isFieldActive !== false
        }
      }}
    >
      <Alert
        message="Google Maps API Setup"
        description="To use Google Maps, you need to create an API key in the Google Cloud Console. Enable the Maps JavaScript API and Geocoding API for your project. The API key will be used on the frontend for map pinpoints and reverse geocoding."
        type="info"
        showIcon
        icon={<EnvironmentOutlined />}
        className="mb-6"
      />

      <Form.Item name="title" label="Title">
        <Input placeholder="Google Maps" />
      </Form.Item>

      <Form.Item name="featured" label="Featured" valuePropName="checked" tooltip="Mark as featured to publish (required for public site)">
        <Switch />
      </Form.Item>

      <Divider>Maps Configuration</Divider>

      <Form.Item name={['enabled', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Enabled Field Active" unCheckedChildren="Enabled Field Inactive" />
      </Form.Item>

      <Form.Item name={['enabled', 'value']} valuePropName="checked">
        <Switch checkedChildren="Maps Enabled" unCheckedChildren="Maps Disabled" />
        <span className="ml-2 text-sm text-gray-600">Enable or disable Google Maps functionality</span>
      </Form.Item>

      <Divider>API Key</Divider>

      <Form.Item name={['apiKey', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="API Key Active" unCheckedChildren="API Key Inactive" />
      </Form.Item>

      <Form.Item 
        name={['apiKey', 'value']} 
        label="Google Maps API Key"
        rules={[
          { required: true, message: 'Please enter Google Maps API Key' }
        ]}
        help="This API key will be used on the frontend for map pinpoints and reverse geocoding. Make sure to restrict the API key to your domain in Google Cloud Console for security."
      >
        <Input.Password 
          placeholder="AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
          visibilityToggle={true}
        />
      </Form.Item>

      <Alert
        message="Security Best Practices"
        description="For production use, restrict your API key in Google Cloud Console by: 1) Setting HTTP referrer restrictions to your domain, 2) Limiting the key to only required APIs (Maps JavaScript API, Geocoding API), and 3) Monitoring usage to detect any unauthorized access."
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

export default GoogleMapsEditor;

