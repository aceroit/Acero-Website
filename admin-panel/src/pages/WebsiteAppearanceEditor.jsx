import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Divider, Collapse, Space, Button, Form, Input, Switch } from 'antd';
import { HomeOutlined, HistoryOutlined, BgColorsOutlined, FontSizeOutlined, BorderOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as websiteAppearanceService from '../services/websiteAppearanceService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const WebsiteAppearanceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [form] = Form.useForm();
  const isEdit = !!id;
  
  const [appearance, setAppearance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: appearance?.status || 'draft',
    resourceType: 'website-appearance',
    createdBy: appearance?.createdBy?._id || appearance?.createdBy,
  });

  // Fetch appearance data if editing
  useEffect(() => {
    if (isEdit) {
      fetchAppearance();
    }
  }, [id]);

  const fetchAppearance = async () => {
    setFetching(true);
    try {
      const response = await websiteAppearanceService.getWebsiteAppearance(id);
      if (response.success) {
        // Backend returns 'appearance', but admin panel expects 'websiteAppearance'
        const appearanceData = response.data.websiteAppearance || response.data.appearance;
        if (!appearanceData) {
          toast.error('Website appearance data not found in response');
          navigate('/website-configurations/appearance');
          return;
        }
        
        setAppearance(appearanceData);
        // Set form values with defaults
        const data = appearanceData;
        form.setFieldsValue({
          title: data.title,
          featured: data.featured === true || data.featured === 'true',
          colorPalette: {
            lightMode: {
              background: { value: data.colorPalette?.lightMode?.background?.value || '#F7F7F7', isFieldActive: data.colorPalette?.lightMode?.background?.isFieldActive !== false },
              foreground: { value: data.colorPalette?.lightMode?.foreground?.value || '#0B0D0E', isFieldActive: data.colorPalette?.lightMode?.foreground?.isFieldActive !== false },
              card: { value: data.colorPalette?.lightMode?.card?.value || '#FFFFFF', isFieldActive: data.colorPalette?.lightMode?.card?.isFieldActive !== false },
              primary: { value: data.colorPalette?.lightMode?.primary?.value || '#E10600', isFieldActive: data.colorPalette?.lightMode?.primary?.isFieldActive !== false },
              secondary: { value: data.colorPalette?.lightMode?.secondary?.value || '#E5E5E5', isFieldActive: data.colorPalette?.lightMode?.secondary?.isFieldActive !== false },
              muted: { value: data.colorPalette?.lightMode?.muted?.value || '#E5E5E5', isFieldActive: data.colorPalette?.lightMode?.muted?.isFieldActive !== false },
              accent: { value: data.colorPalette?.lightMode?.accent?.value || '#E10600', isFieldActive: data.colorPalette?.lightMode?.accent?.isFieldActive !== false },
              border: { value: data.colorPalette?.lightMode?.border?.value || '#CCCCCC', isFieldActive: data.colorPalette?.lightMode?.border?.isFieldActive !== false },
              ring: { value: data.colorPalette?.lightMode?.ring?.value || '#E10600', isFieldActive: data.colorPalette?.lightMode?.ring?.isFieldActive !== false }
            },
            darkMode: {
              background: { value: data.colorPalette?.darkMode?.background?.value || '#0B0D0E', isFieldActive: data.colorPalette?.darkMode?.background?.isFieldActive !== false },
              foreground: { value: data.colorPalette?.darkMode?.foreground?.value || '#F7F7F7', isFieldActive: data.colorPalette?.darkMode?.foreground?.isFieldActive !== false },
              card: { value: data.colorPalette?.darkMode?.card?.value || '#111315', isFieldActive: data.colorPalette?.darkMode?.card?.isFieldActive !== false },
              primary: { value: data.colorPalette?.darkMode?.primary?.value || '#E10600', isFieldActive: data.colorPalette?.darkMode?.primary?.isFieldActive !== false },
              secondary: { value: data.colorPalette?.darkMode?.secondary?.value || '#1A1D1F', isFieldActive: data.colorPalette?.darkMode?.secondary?.isFieldActive !== false },
              muted: { value: data.colorPalette?.darkMode?.muted?.value || '#1A1D1F', isFieldActive: data.colorPalette?.darkMode?.muted?.isFieldActive !== false },
              accent: { value: data.colorPalette?.darkMode?.accent?.value || '#E10600', isFieldActive: data.colorPalette?.darkMode?.accent?.isFieldActive !== false },
              border: { value: data.colorPalette?.darkMode?.border?.value || '#2E2E2E', isFieldActive: data.colorPalette?.darkMode?.border?.isFieldActive !== false },
              ring: { value: data.colorPalette?.darkMode?.ring?.value || '#E10600', isFieldActive: data.colorPalette?.darkMode?.ring?.isFieldActive !== false }
            },
            steelColors: {
              steelBlack: { value: data.colorPalette?.steelColors?.steelBlack?.value || '#0B0D0E', isFieldActive: data.colorPalette?.steelColors?.steelBlack?.isFieldActive !== false },
              steelWhite: { value: data.colorPalette?.steelColors?.steelWhite?.value || '#F7F7F7', isFieldActive: data.colorPalette?.steelColors?.steelWhite?.isFieldActive !== false },
              steelGray: { value: data.colorPalette?.steelColors?.steelGray?.value || '#2E2E2E', isFieldActive: data.colorPalette?.steelColors?.steelGray?.isFieldActive !== false },
              steelRed: { value: data.colorPalette?.steelColors?.steelRed?.value || '#E10600', isFieldActive: data.colorPalette?.steelColors?.steelRed?.isFieldActive !== false },
              steelDark: { value: data.colorPalette?.steelColors?.steelDark?.value || '#111315', isFieldActive: data.colorPalette?.steelColors?.steelDark?.isFieldActive !== false },
              steelMuted: { value: data.colorPalette?.steelColors?.steelMuted?.value || '#6B7280', isFieldActive: data.colorPalette?.steelColors?.steelMuted?.isFieldActive !== false }
            }
          },
          typography: {
            fontFamily: {
              primary: { value: data.typography?.fontFamily?.primary?.value || 'Inter', isFieldActive: data.typography?.fontFamily?.primary?.isFieldActive !== false },
              monospace: { value: data.typography?.fontFamily?.monospace?.value || 'Geist Mono', isFieldActive: data.typography?.fontFamily?.monospace?.isFieldActive !== false }
            },
            fontScale: {
              h1: { value: data.typography?.fontScale?.h1?.value || 'text-5xl md:text-6xl lg:text-7xl', isFieldActive: data.typography?.fontScale?.h1?.isFieldActive !== false },
              h2: { value: data.typography?.fontScale?.h2?.value || 'text-4xl md:text-5xl', isFieldActive: data.typography?.fontScale?.h2?.isFieldActive !== false },
              h3: { value: data.typography?.fontScale?.h3?.value || 'text-2xl md:text-3xl', isFieldActive: data.typography?.fontScale?.h3?.isFieldActive !== false },
              h4: { value: data.typography?.fontScale?.h4?.value || 'text-xl md:text-2xl', isFieldActive: data.typography?.fontScale?.h4?.isFieldActive !== false },
              body: { value: data.typography?.fontScale?.body?.value || 'leading-relaxed', isFieldActive: data.typography?.fontScale?.body?.isFieldActive !== false }
            }
          },
          spacing: {
            containerMaxWidth: { value: data.spacing?.containerMaxWidth?.value || 'max-w-7xl', isFieldActive: data.spacing?.containerMaxWidth?.isFieldActive !== false },
            sectionPadding: { value: data.spacing?.sectionPadding?.value || 'px-6 py-24', isFieldActive: data.spacing?.sectionPadding?.isFieldActive !== false },
            gridGap: { value: data.spacing?.gridGap?.value || 'gap-8', isFieldActive: data.spacing?.gridGap?.isFieldActive !== false }
          },
          borderRadius: {
            defaultRadius: { value: data.borderRadius?.defaultRadius?.value || '0.5rem', isFieldActive: data.borderRadius?.defaultRadius?.isFieldActive !== false }
          }
        });
      } else {
        toast.error('Website appearance not found');
        navigate('/website-configurations/appearance');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch website appearance');
      navigate('/website-configurations/appearance');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isEdit && !workflowStatus.canEdit.canEdit) {
        toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this website appearance');
        setLoading(false);
        return;
      }

      // Transform form values to match backend schema
      const submitData = {
        title: values.title || 'Website Appearance',
        featured: values.featured === true || values.featured === 'true',
        colorPalette: {
          lightMode: {
            background: { value: values.colorPalette?.lightMode?.background?.value || '#F7F7F7', isFieldActive: values.colorPalette?.lightMode?.background?.isFieldActive !== false },
            foreground: { value: values.colorPalette?.lightMode?.foreground?.value || '#0B0D0E', isFieldActive: values.colorPalette?.lightMode?.foreground?.isFieldActive !== false },
            card: { value: values.colorPalette?.lightMode?.card?.value || '#FFFFFF', isFieldActive: values.colorPalette?.lightMode?.card?.isFieldActive !== false },
            primary: { value: values.colorPalette?.lightMode?.primary?.value || '#E10600', isFieldActive: values.colorPalette?.lightMode?.primary?.isFieldActive !== false },
            secondary: { value: values.colorPalette?.lightMode?.secondary?.value || '#E5E5E5', isFieldActive: values.colorPalette?.lightMode?.secondary?.isFieldActive !== false },
            muted: { value: values.colorPalette?.lightMode?.muted?.value || '#E5E5E5', isFieldActive: values.colorPalette?.lightMode?.muted?.isFieldActive !== false },
            accent: { value: values.colorPalette?.lightMode?.accent?.value || '#E10600', isFieldActive: values.colorPalette?.lightMode?.accent?.isFieldActive !== false },
            border: { value: values.colorPalette?.lightMode?.border?.value || '#CCCCCC', isFieldActive: values.colorPalette?.lightMode?.border?.isFieldActive !== false },
            ring: { value: values.colorPalette?.lightMode?.ring?.value || '#E10600', isFieldActive: values.colorPalette?.lightMode?.ring?.isFieldActive !== false }
          },
          darkMode: {
            background: { value: values.colorPalette?.darkMode?.background?.value || '#0B0D0E', isFieldActive: values.colorPalette?.darkMode?.background?.isFieldActive !== false },
            foreground: { value: values.colorPalette?.darkMode?.foreground?.value || '#F7F7F7', isFieldActive: values.colorPalette?.darkMode?.foreground?.isFieldActive !== false },
            card: { value: values.colorPalette?.darkMode?.card?.value || '#111315', isFieldActive: values.colorPalette?.darkMode?.card?.isFieldActive !== false },
            primary: { value: values.colorPalette?.darkMode?.primary?.value || '#E10600', isFieldActive: values.colorPalette?.darkMode?.primary?.isFieldActive !== false },
            secondary: { value: values.colorPalette?.darkMode?.secondary?.value || '#1A1D1F', isFieldActive: values.colorPalette?.darkMode?.secondary?.isFieldActive !== false },
            muted: { value: values.colorPalette?.darkMode?.muted?.value || '#1A1D1F', isFieldActive: values.colorPalette?.darkMode?.muted?.isFieldActive !== false },
            accent: { value: values.colorPalette?.darkMode?.accent?.value || '#E10600', isFieldActive: values.colorPalette?.darkMode?.accent?.isFieldActive !== false },
            border: { value: values.colorPalette?.darkMode?.border?.value || '#2E2E2E', isFieldActive: values.colorPalette?.darkMode?.border?.isFieldActive !== false },
            ring: { value: values.colorPalette?.darkMode?.ring?.value || '#E10600', isFieldActive: values.colorPalette?.darkMode?.ring?.isFieldActive !== false }
          },
          steelColors: {
            steelBlack: { value: values.colorPalette?.steelColors?.steelBlack?.value || '#0B0D0E', isFieldActive: values.colorPalette?.steelColors?.steelBlack?.isFieldActive !== false },
            steelWhite: { value: values.colorPalette?.steelColors?.steelWhite?.value || '#F7F7F7', isFieldActive: values.colorPalette?.steelColors?.steelWhite?.isFieldActive !== false },
            steelGray: { value: values.colorPalette?.steelColors?.steelGray?.value || '#2E2E2E', isFieldActive: values.colorPalette?.steelColors?.steelGray?.isFieldActive !== false },
            steelRed: { value: values.colorPalette?.steelColors?.steelRed?.value || '#E10600', isFieldActive: values.colorPalette?.steelColors?.steelRed?.isFieldActive !== false },
            steelDark: { value: values.colorPalette?.steelColors?.steelDark?.value || '#111315', isFieldActive: values.colorPalette?.steelColors?.steelDark?.isFieldActive !== false },
            steelMuted: { value: values.colorPalette?.steelColors?.steelMuted?.value || '#6B7280', isFieldActive: values.colorPalette?.steelColors?.steelMuted?.isFieldActive !== false }
          }
        },
        typography: {
          fontFamily: {
            primary: { value: values.typography?.fontFamily?.primary?.value || 'Inter', isFieldActive: values.typography?.fontFamily?.primary?.isFieldActive !== false },
            monospace: { value: values.typography?.fontFamily?.monospace?.value || 'Geist Mono', isFieldActive: values.typography?.fontFamily?.monospace?.isFieldActive !== false }
          },
          fontScale: {
            h1: { value: values.typography?.fontScale?.h1?.value || 'text-5xl md:text-6xl lg:text-7xl', isFieldActive: values.typography?.fontScale?.h1?.isFieldActive !== false },
            h2: { value: values.typography?.fontScale?.h2?.value || 'text-4xl md:text-5xl', isFieldActive: values.typography?.fontScale?.h2?.isFieldActive !== false },
            h3: { value: values.typography?.fontScale?.h3?.value || 'text-2xl md:text-3xl', isFieldActive: values.typography?.fontScale?.h3?.isFieldActive !== false },
            h4: { value: values.typography?.fontScale?.h4?.value || 'text-xl md:text-2xl', isFieldActive: values.typography?.fontScale?.h4?.isFieldActive !== false },
            body: { value: values.typography?.fontScale?.body?.value || 'leading-relaxed', isFieldActive: values.typography?.fontScale?.body?.isFieldActive !== false }
          }
        },
        spacing: {
          containerMaxWidth: { value: values.spacing?.containerMaxWidth?.value || 'max-w-7xl', isFieldActive: values.spacing?.containerMaxWidth?.isFieldActive !== false },
          sectionPadding: { value: values.spacing?.sectionPadding?.value || 'px-6 py-24', isFieldActive: values.spacing?.sectionPadding?.isFieldActive !== false },
          gridGap: { value: values.spacing?.gridGap?.value || 'gap-8', isFieldActive: values.spacing?.gridGap?.isFieldActive !== false }
        },
        borderRadius: {
          defaultRadius: { value: values.borderRadius?.defaultRadius?.value || '0.5rem', isFieldActive: values.borderRadius?.defaultRadius?.isFieldActive !== false }
        }
      };

      let response;
      if (isEdit) {
        response = await websiteAppearanceService.updateWebsiteAppearance(id, submitData);
      } else {
        response = await websiteAppearanceService.createWebsiteAppearance(submitData);
      }

      if (response.success) {
        toast.success(isEdit ? 'Website appearance updated successfully' : 'Website appearance created successfully');
        
        if (isEdit) {
          await fetchAppearance();
        } else {
          // Backend returns 'appearance', but admin panel expects 'websiteAppearance'
          const newAppearance = response.data?.websiteAppearance || response.data?.appearance;
          const newId = newAppearance?._id || newAppearance?.id;
          if (newId) {
            navigate(`/website-configurations/appearance/${newId}`);
          } else {
            navigate('/website-configurations/appearance');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update website appearance' : 'Failed to create website appearance');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/website-configurations/appearance');
  };

  const handleWorkflowActionComplete = async () => {
    if (isEdit) {
      await fetchAppearance();
      setTimeout(() => {
        fetchAppearance();
      }, 500);
    }
  };

  const breadcrumbItems = [
    {
      title: (
        <a href="/dashboard">
          <HomeOutlined />
        </a>
      ),
    },
    {
      title: (
        <a href="/website-configurations/appearance">
          <span>Website Appearance</span>
        </a>
      ),
    },
    {
      title: <span>{isEdit ? 'Edit' : 'Create New'}</span>,
    },
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
  if (!hasPermission('website-appearance', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} website appearances.</p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        <Breadcrumb items={breadcrumbItems} className="text-sm" />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              {isEdit ? `Edit Website Appearance${appearance?.title ? `: ${appearance.title}` : ''}` : 'Create New Website Appearance'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update website appearance settings and metadata'
                : 'Configure website appearance settings for your website'
              }
            </p>
          </div>
          {isEdit && appearance && (
            <div className="flex flex-col items-start md:items-end gap-3">
              <WorkflowStatusBadge status={appearance.status} size="large" />
              <Space size="middle" align="center" style={{ flexWrap: 'nowrap' }}>
                <WorkflowActions
                  resource="website-appearance"
                  resourceId={id}
                  currentStatus={appearance.status}
                  createdBy={appearance.createdBy?._id || appearance.createdBy}
                  onActionComplete={handleWorkflowActionComplete}
                  showLabels={true}
                  size="middle"
                />
              </Space>
            </div>
          )}
        </div>

        <Card className="border border-gray-200 shadow-md bg-white">
          {isEdit && appearance ? (
            <WorkflowStatusGuard
              status={appearance.status}
              resourceType="website-appearance"
              resourceId={id}
              createdBy={appearance.createdBy?._id || appearance.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <WebsiteAppearanceForm
                form={form}
                initialValues={appearance}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <WebsiteAppearanceForm
              form={form}
              initialValues={{}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {isEdit && appearance && (
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
                        navigate(`/versions/website-appearance/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="website-appearance"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('website-appearance', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchAppearance();
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

// Website Appearance Form Component
const WebsiteAppearanceForm = ({ form, initialValues, onSubmit, onCancel, loading, isEdit }) => {
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      form.setFieldsValue({
        title: initialValues.title || 'Website Appearance',
        featured: initialValues.featured === true || initialValues.featured === 'true',
        ...(initialValues.colorPalette && { colorPalette: initialValues.colorPalette }),
        ...(initialValues.typography && { typography: initialValues.typography }),
        ...(initialValues.spacing && { spacing: initialValues.spacing }),
        ...(initialValues.borderRadius && { borderRadius: initialValues.borderRadius })
      });
    }
  }, [initialValues, form]);

  const renderColorField = (path, label, defaultValue) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <Form.Item name={[...path, 'isFieldActive']} valuePropName="checked" className="mb-0">
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" size="small" />
        </Form.Item>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex gap-2">
        <Form.Item name={[...path, 'value']} className="flex-1 mb-0">
          <Input placeholder={defaultValue} />
        </Form.Item>
        <Form.Item shouldUpdate={(prevValues, curValues) => {
          const prevVal = path.reduce((obj, key) => obj?.[key], prevValues);
          const curVal = path.reduce((obj, key) => obj?.[key], curValues);
          return prevVal?.value !== curVal?.value;
        }} className="mb-0">
          {({ getFieldValue }) => {
            const colorValue = getFieldValue([...path, 'value']) || defaultValue;
            return (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: colorValue,
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              />
            );
          }}
        </Form.Item>
      </div>
    </div>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{
        title: initialValues.title || 'Website Appearance',
        featured: initialValues?.featured === true || initialValues?.featured === 'true' || false,
        colorPalette: {
          lightMode: {
            background: { value: '#F7F7F7', isFieldActive: true },
            foreground: { value: '#0B0D0E', isFieldActive: true },
            card: { value: '#FFFFFF', isFieldActive: true },
            primary: { value: '#E10600', isFieldActive: true },
            secondary: { value: '#E5E5E5', isFieldActive: true },
            muted: { value: '#E5E5E5', isFieldActive: true },
            accent: { value: '#E10600', isFieldActive: true },
            border: { value: '#CCCCCC', isFieldActive: true },
            ring: { value: '#E10600', isFieldActive: true }
          },
          darkMode: {
            background: { value: '#0B0D0E', isFieldActive: true },
            foreground: { value: '#F7F7F7', isFieldActive: true },
            card: { value: '#111315', isFieldActive: true },
            primary: { value: '#E10600', isFieldActive: true },
            secondary: { value: '#1A1D1F', isFieldActive: true },
            muted: { value: '#1A1D1F', isFieldActive: true },
            accent: { value: '#E10600', isFieldActive: true },
            border: { value: '#2E2E2E', isFieldActive: true },
            ring: { value: '#E10600', isFieldActive: true }
          },
          steelColors: {
            steelBlack: { value: '#0B0D0E', isFieldActive: true },
            steelWhite: { value: '#F7F7F7', isFieldActive: true },
            steelGray: { value: '#2E2E2E', isFieldActive: true },
            steelRed: { value: '#E10600', isFieldActive: true },
            steelDark: { value: '#111315', isFieldActive: true },
            steelMuted: { value: '#6B7280', isFieldActive: true }
          }
        },
        typography: {
          fontFamily: {
            primary: { value: 'Inter', isFieldActive: true },
            monospace: { value: 'Geist Mono', isFieldActive: true }
          },
          fontScale: {
            h1: { value: 'text-5xl md:text-6xl lg:text-7xl', isFieldActive: true },
            h2: { value: 'text-4xl md:text-5xl', isFieldActive: true },
            h3: { value: 'text-2xl md:text-3xl', isFieldActive: true },
            h4: { value: 'text-xl md:text-2xl', isFieldActive: true },
            body: { value: 'leading-relaxed', isFieldActive: true }
          }
        },
        spacing: {
          containerMaxWidth: { value: 'max-w-7xl', isFieldActive: true },
          sectionPadding: { value: 'px-6 py-24', isFieldActive: true },
          gridGap: { value: 'gap-8', isFieldActive: true }
        },
        borderRadius: {
          defaultRadius: { value: '0.5rem', isFieldActive: true }
        }
      }}
    >
      <Form.Item name="title" label="Title">
        <Input placeholder="Website Appearance" />
      </Form.Item>

      <Form.Item
        name="featured"
        label="Featured"
        valuePropName="checked"
        tooltip="Mark as featured to publish (required for public site)"
      >
        <Switch />
      </Form.Item>

      <Collapse
        items={[
          {
            key: 'colors',
            label: (
              <Space>
                <BgColorsOutlined />
                <span className="font-semibold">Color Palette</span>
              </Space>
            ),
            children: (
              <div>
                <Divider>Light Mode Colors</Divider>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderColorField(['colorPalette', 'lightMode', 'background'], 'Background', '#F7F7F7')}
                  {renderColorField(['colorPalette', 'lightMode', 'foreground'], 'Foreground', '#0B0D0E')}
                  {renderColorField(['colorPalette', 'lightMode', 'card'], 'Card', '#FFFFFF')}
                  {renderColorField(['colorPalette', 'lightMode', 'primary'], 'Primary', '#E10600')}
                  {renderColorField(['colorPalette', 'lightMode', 'secondary'], 'Secondary', '#E5E5E5')}
                  {renderColorField(['colorPalette', 'lightMode', 'muted'], 'Muted', '#E5E5E5')}
                  {renderColorField(['colorPalette', 'lightMode', 'accent'], 'Accent', '#E10600')}
                  {renderColorField(['colorPalette', 'lightMode', 'border'], 'Border', '#CCCCCC')}
                  {renderColorField(['colorPalette', 'lightMode', 'ring'], 'Ring', '#E10600')}
                </div>

                <Divider>Dark Mode Colors</Divider>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderColorField(['colorPalette', 'darkMode', 'background'], 'Background', '#0B0D0E')}
                  {renderColorField(['colorPalette', 'darkMode', 'foreground'], 'Foreground', '#F7F7F7')}
                  {renderColorField(['colorPalette', 'darkMode', 'card'], 'Card', '#111315')}
                  {renderColorField(['colorPalette', 'darkMode', 'primary'], 'Primary', '#E10600')}
                  {renderColorField(['colorPalette', 'darkMode', 'secondary'], 'Secondary', '#1A1D1F')}
                  {renderColorField(['colorPalette', 'darkMode', 'muted'], 'Muted', '#1A1D1F')}
                  {renderColorField(['colorPalette', 'darkMode', 'accent'], 'Accent', '#E10600')}
                  {renderColorField(['colorPalette', 'darkMode', 'border'], 'Border', '#2E2E2E')}
                  {renderColorField(['colorPalette', 'darkMode', 'ring'], 'Ring', '#E10600')}
                </div>

                <Divider>Steel Brand Colors</Divider>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderColorField(['colorPalette', 'steelColors', 'steelBlack'], 'Steel Black', '#0B0D0E')}
                  {renderColorField(['colorPalette', 'steelColors', 'steelWhite'], 'Steel White', '#F7F7F7')}
                  {renderColorField(['colorPalette', 'steelColors', 'steelGray'], 'Steel Gray', '#2E2E2E')}
                  {renderColorField(['colorPalette', 'steelColors', 'steelRed'], 'Steel Red', '#E10600')}
                  {renderColorField(['colorPalette', 'steelColors', 'steelDark'], 'Steel Dark', '#111315')}
                  {renderColorField(['colorPalette', 'steelColors', 'steelMuted'], 'Steel Muted', '#6B7280')}
                </div>
              </div>
            ),
          },
          {
            key: 'typography',
            label: (
              <Space>
                <FontSizeOutlined />
                <span className="font-semibold">Typography</span>
              </Space>
            ),
            children: (
              <div>
                <Divider>Font Family</Divider>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Form.Item name={['typography', 'fontFamily', 'primary', 'isFieldActive']} valuePropName="checked" className="mb-0">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" size="small" />
                      </Form.Item>
                      <span className="text-sm font-medium text-gray-700">Primary Font</span>
                    </div>
                    <Form.Item name={['typography', 'fontFamily', 'primary', 'value']}>
                      <Input placeholder="Inter" />
                    </Form.Item>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Form.Item name={['typography', 'fontFamily', 'monospace', 'isFieldActive']} valuePropName="checked" className="mb-0">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" size="small" />
                      </Form.Item>
                      <span className="text-sm font-medium text-gray-700">Monospace Font</span>
                    </div>
                    <Form.Item name={['typography', 'fontFamily', 'monospace', 'value']}>
                      <Input placeholder="Geist Mono" />
                    </Form.Item>
                  </div>
                </div>

                <Divider>Font Scale</Divider>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['h1', 'h2', 'h3', 'h4', 'body'].map((heading) => (
                    <div key={heading}>
                      <div className="flex items-center justify-between mb-2">
                        <Form.Item name={['typography', 'fontScale', heading, 'isFieldActive']} valuePropName="checked" className="mb-0">
                          <Switch checkedChildren="Active" unCheckedChildren="Inactive" size="small" />
                        </Form.Item>
                        <span className="text-sm font-medium text-gray-700">{heading.toUpperCase()}</span>
                      </div>
                      <Form.Item name={['typography', 'fontScale', heading, 'value']}>
                        <Input placeholder={heading === 'h1' ? 'text-5xl md:text-6xl lg:text-7xl' : heading === 'h2' ? 'text-4xl md:text-5xl' : heading === 'h3' ? 'text-2xl md:text-3xl' : heading === 'h4' ? 'text-xl md:text-2xl' : 'leading-relaxed'} />
                      </Form.Item>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            key: 'spacing',
            label: (
              <Space>
                <BorderOutlined />
                <span className="font-semibold">Spacing & Layout</span>
              </Space>
            ),
            children: (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Form.Item name={['spacing', 'containerMaxWidth', 'isFieldActive']} valuePropName="checked" className="mb-0">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" size="small" />
                      </Form.Item>
                      <span className="text-sm font-medium text-gray-700">Container Max Width</span>
                    </div>
                    <Form.Item name={['spacing', 'containerMaxWidth', 'value']}>
                      <Input placeholder="max-w-7xl" />
                    </Form.Item>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Form.Item name={['spacing', 'sectionPadding', 'isFieldActive']} valuePropName="checked" className="mb-0">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" size="small" />
                      </Form.Item>
                      <span className="text-sm font-medium text-gray-700">Section Padding</span>
                    </div>
                    <Form.Item name={['spacing', 'sectionPadding', 'value']}>
                      <Input placeholder="px-6 py-24" />
                    </Form.Item>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Form.Item name={['spacing', 'gridGap', 'isFieldActive']} valuePropName="checked" className="mb-0">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" size="small" />
                      </Form.Item>
                      <span className="text-sm font-medium text-gray-700">Grid Gap</span>
                    </div>
                    <Form.Item name={['spacing', 'gridGap', 'value']}>
                      <Input placeholder="gap-8" />
                    </Form.Item>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Form.Item name={['borderRadius', 'defaultRadius', 'isFieldActive']} valuePropName="checked" className="mb-0">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" size="small" />
                      </Form.Item>
                      <span className="text-sm font-medium text-gray-700">Border Radius</span>
                    </div>
                    <Form.Item name={['borderRadius', 'defaultRadius', 'value']}>
                      <Input placeholder="0.5rem" />
                    </Form.Item>
                  </div>
                </div>
              </div>
            ),
          },
        ]}
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
            {isEdit ? 'Update Website Appearance' : 'Create Website Appearance'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default WebsiteAppearanceEditor;

