import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Divider, Collapse, Space, Button, Form, Input, Switch, message } from 'antd';
import { HomeOutlined, MenuOutlined, HistoryOutlined, PlusOutlined, DeleteOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as headerConfigurationService from '../services/headerConfigurationService';
import * as versionService from '../services/versionService';
import * as pageService from '../services/pageService';
import { SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';

const { Panel } = Collapse;
const { TextArea } = Input;

const HeaderConfigurationEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [form] = Form.useForm();
  const isEdit = !!id;
  
  const [headerConfig, setHeaderConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [syncing, setSyncing] = useState(false);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: headerConfig?.status || 'draft',
    resourceType: 'header-configuration',
    createdBy: headerConfig?.createdBy?._id || headerConfig?.createdBy,
  });

  // Fetch header configuration data if editing
  useEffect(() => {
    if (isEdit) {
      fetchHeaderConfiguration();
    }
  }, [id]);

  const fetchHeaderConfiguration = async () => {
    setFetching(true);
    try {
      const response = await headerConfigurationService.getHeaderConfiguration(id);
      if (response.success) {
        // Backend returns 'header', but admin panel expects 'headerConfiguration'
        const headerData = response.data.headerConfiguration || response.data.header;
        if (!headerData) {
          toast.error('Header configuration data not found in response');
          navigate('/website-configurations/header');
          return;
        }
        
        setHeaderConfig(headerData);
        form.setFieldsValue({
          title: headerData.title,
          featured: headerData.featured === true || headerData.featured === 'true',
          logo: {
            imageUrl: headerData.logo?.imageUrl || '',
            altText: headerData.logo?.altText || '',
            isFieldActive: headerData.logo?.isFieldActive !== false
          },
          brandName: {
            text: headerData.brandName?.text || 'ACERO',
            isFieldActive: headerData.brandName?.isFieldActive !== false
          },
          navigationLinks: headerData.navigationLinks || [],
          themeToggle: {
            enabled: headerData.themeToggle?.enabled !== false,
            isFieldActive: headerData.themeToggle?.isFieldActive !== false
          },
          ctaButton: {
            text: headerData.ctaButton?.text || 'Get Quote',
            href: headerData.ctaButton?.href || '/contact-us',
            isFieldActive: headerData.ctaButton?.isFieldActive !== false
          }
        });
      } else {
        toast.error('Header configuration not found');
        navigate('/website-configurations/header');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch header configuration');
      navigate('/website-configurations/header');
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
        toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this header configuration');
        setLoading(false);
        return;
      }

      // Transform form values to match backend schema
      const submitData = {
        title: values.title || 'Header Configuration',
        featured: values.featured === true || values.featured === 'true',
        logo: {
          imageUrl: values.logo?.imageUrl || null,
          altText: values.logo?.altText || null,
          isFieldActive: values.logo?.isFieldActive !== false
        },
        brandName: {
          text: values.brandName?.text || 'ACERO',
          isFieldActive: values.brandName?.isFieldActive !== false
        },
        navigationLinks: values.navigationLinks || [],
        themeToggle: {
          enabled: values.themeToggle?.enabled !== false,
          isFieldActive: values.themeToggle?.isFieldActive !== false
        },
        ctaButton: {
          text: values.ctaButton?.text || 'Get Quote',
          href: values.ctaButton?.href || '/contact-us',
          isFieldActive: values.ctaButton?.isFieldActive !== false
        }
      };

      let response;
      if (isEdit) {
        response = await headerConfigurationService.updateHeaderConfiguration(id, submitData);
      } else {
        response = await headerConfigurationService.createHeaderConfiguration(submitData);
      }

      if (response.success) {
        toast.success(isEdit ? 'Header configuration updated successfully' : 'Header configuration created successfully');
        
        if (isEdit) {
          await fetchHeaderConfiguration();
        } else {
          // Backend returns 'header', but admin panel expects 'headerConfiguration'
          const newHeader = response.data?.headerConfiguration || response.data?.header;
          const newId = newHeader?._id || newHeader?.id;
          if (newId) {
            navigate(`/website-configurations/header/${newId}`);
          } else {
            navigate('/website-configurations/header');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update header configuration' : 'Failed to create header configuration');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/website-configurations/header');
  };

  // Transform page tree to navigationLinks format
  const transformPageTreeToNavLinks = (pageTree) => {
    if (!Array.isArray(pageTree)) {
      return [];
    }

    return pageTree
      .filter(page => page.showInMenu !== false && page.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(page => {
        const navLink = {
          label: page.title,
          href: page.path,
          order: page.order || 0,
          isFieldActive: true,
          dropdown: []
        };

        // Add children as dropdown items
        if (page.children && Array.isArray(page.children) && page.children.length > 0) {
          navLink.dropdown = page.children
            .filter(child => child.showInMenu !== false && child.isActive !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(child => ({
              label: child.title,
              href: child.path,
              order: child.order || 0
            }));
        }

        return navLink;
      });
  };

  // Sync from Page Tree
  const handleSyncFromPageTree = async () => {
    setSyncing(true);
    try {
      // Fetch page tree
      const treeResponse = await pageService.getPageTree();
      if (!treeResponse.success || !treeResponse.data?.tree) {
        toast.error('Failed to fetch page tree');
        return;
      }

      // Transform to navigationLinks
      const navigationLinks = transformPageTreeToNavLinks(treeResponse.data.tree);

      // Update form with synced navigationLinks
      form.setFieldsValue({
        navigationLinks
      });

      // Update local state
      setHeaderConfig(prev => ({
        ...prev,
        navigationLinks
      }));

      toast.success(`Synced ${navigationLinks.length} navigation link(s) from Page Tree`);
    } catch (error) {
      console.error('Error syncing from page tree:', error);
      toast.error(error.response?.data?.message || 'Failed to sync from Page Tree');
    } finally {
      setSyncing(false);
    }
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async () => {
    if (isEdit) {
      await fetchHeaderConfiguration();
      setTimeout(() => {
        fetchHeaderConfiguration();
      }, 500);
    }
  };

  // Build breadcrumb items
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
        <a href="/website-configurations/header">
          <span>Header Configuration</span>
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

  // Check permissions
  const requiredPermission = isEdit ? 'update' : 'create';
  if (!hasPermission('header-configurations', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} header configurations.</p>
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
              {isEdit ? `Edit Header Configuration${headerConfig?.title ? `: ${headerConfig.title}` : ''}` : 'Create New Header Configuration'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update header configuration details and metadata'
                : 'Create a new header configuration for your website'
              }
            </p>
          </div>
          {isEdit && headerConfig && (
            <div className="flex flex-col items-start md:items-end gap-3">
              <WorkflowStatusBadge status={headerConfig.status} size="large" />
              <Space size="middle" align="center" style={{ flexWrap: 'nowrap' }}>
                <Button
                  icon={<SyncOutlined />}
                  onClick={handleSyncFromPageTree}
                  loading={syncing}
                  size="middle"
                >
                  Sync from Page Tree
                </Button>
                <WorkflowActions
                  resource="header-configuration"
                  resourceId={id}
                  currentStatus={headerConfig.status}
                  createdBy={headerConfig.createdBy?._id || headerConfig.createdBy}
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
          {isEdit && headerConfig ? (
            <WorkflowStatusGuard
              status={headerConfig.status}
              resourceType="header-configuration"
              resourceId={id}
              createdBy={headerConfig.createdBy?._id || headerConfig.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <HeaderConfigurationForm
                form={form}
                initialValues={headerConfig}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
                headerConfig={headerConfig}
              />
            </WorkflowStatusGuard>
          ) : (
            <HeaderConfigurationForm
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
        {isEdit && headerConfig && (
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
                        navigate(`/versions/header-configuration/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="header-configuration"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('header-configuration', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchHeaderConfiguration();
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

// Header Configuration Form Component
const HeaderConfigurationForm = ({ form, initialValues, onSubmit, onCancel, loading, isEdit, headerConfig }) => {
  const [navigationLinks, setNavigationLinks] = useState(initialValues.navigationLinks || []);

  useEffect(() => {
    if (initialValues.navigationLinks) {
      setNavigationLinks(initialValues.navigationLinks);
    }
  }, [initialValues]);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      form.setFieldsValue({
        title: initialValues.title || 'Header Configuration',
        featured: initialValues.featured === true || initialValues.featured === 'true',
        logo: {
          imageUrl: initialValues.logo?.imageUrl ?? '',
          altText: initialValues.logo?.altText ?? '',
          isFieldActive: initialValues.logo?.isFieldActive !== false
        },
        brandName: {
          text: initialValues.brandName?.text ?? 'ACERO',
          isFieldActive: initialValues.brandName?.isFieldActive !== false
        },
        themeToggle: {
          enabled: initialValues.themeToggle?.enabled !== false,
          isFieldActive: initialValues.themeToggle?.isFieldActive !== false
        },
        ctaButton: {
          text: initialValues.ctaButton?.text ?? 'Get Quote',
          href: initialValues.ctaButton?.href ?? '/contact-us',
          isFieldActive: initialValues.ctaButton?.isFieldActive !== false
        }
      });
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    onSubmit({ ...values, navigationLinks });
  };

  const addNavigationLink = () => {
    const newLink = {
      label: '',
      href: '',
      order: navigationLinks.length,
      dropdown: [],
      isFieldActive: true
    };
    setNavigationLinks([...navigationLinks, newLink]);
  };

  const removeNavigationLink = (index) => {
    const updated = navigationLinks.filter((_, i) => i !== index);
    setNavigationLinks(updated);
  };

  const updateNavigationLink = (index, field, value) => {
    const updated = [...navigationLinks];
    updated[index] = { ...updated[index], [field]: value };
    setNavigationLinks(updated);
  };

  const addDropdownItem = (linkIndex) => {
    const updated = [...navigationLinks];
    if (!updated[linkIndex].dropdown) {
      updated[linkIndex].dropdown = [];
    }
    updated[linkIndex].dropdown.push({
      label: '',
      href: '',
      order: updated[linkIndex].dropdown.length
    });
    setNavigationLinks(updated);
  };

  const removeDropdownItem = (linkIndex, dropdownIndex) => {
    const updated = [...navigationLinks];
    updated[linkIndex].dropdown = updated[linkIndex].dropdown.filter((_, i) => i !== dropdownIndex);
    setNavigationLinks(updated);
  };

  const updateDropdownItem = (linkIndex, dropdownIndex, field, value) => {
    const updated = [...navigationLinks];
    updated[linkIndex].dropdown[dropdownIndex] = {
      ...updated[linkIndex].dropdown[dropdownIndex],
      [field]: value
    };
    setNavigationLinks(updated);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        title: initialValues.title || 'Header Configuration',
        featured: initialValues?.featured === true || initialValues?.featured === 'true' || false,
        logo: {
          imageUrl: initialValues.logo?.imageUrl || '',
          altText: initialValues.logo?.altText || '',
          isFieldActive: initialValues.logo?.isFieldActive !== false
        },
        brandName: {
          text: initialValues.brandName?.text || 'ACERO',
          isFieldActive: initialValues.brandName?.isFieldActive !== false
        },
        themeToggle: {
          enabled: initialValues.themeToggle?.enabled !== false,
          isFieldActive: initialValues.themeToggle?.isFieldActive !== false
        },
        ctaButton: {
          text: initialValues.ctaButton?.text || 'Get Quote',
          href: initialValues.ctaButton?.href || '/contact-us',
          isFieldActive: initialValues.ctaButton?.isFieldActive !== false
        }
      }}
    >
      <Form.Item name="title" label="Title">
        <Input placeholder="Header Configuration" />
      </Form.Item>

      <Form.Item
        name="featured"
        label="Featured"
        valuePropName="checked"
        tooltip="Mark as featured to publish (required for public site)"
      >
        <Switch />
      </Form.Item>

      <Divider>Logo Settings</Divider>
      
      <Form.Item name={['logo', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Logo Active" unCheckedChildren="Logo Inactive" />
      </Form.Item>

      <Form.Item name={['logo', 'imageUrl']} label="Logo Image URL">
        <Input placeholder="https://example.com/logo.png" />
      </Form.Item>

      <Form.Item name={['logo', 'altText']} label="Logo Alt Text">
        <Input placeholder="Company Logo" />
      </Form.Item>

      <Divider>Brand Name</Divider>

      <Form.Item name={['brandName', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Brand Name Active" unCheckedChildren="Brand Name Inactive" />
      </Form.Item>

      <Form.Item name={['brandName', 'text']} label="Brand Name">
        <Input placeholder="ACERO" />
      </Form.Item>

      <Divider>Navigation Links</Divider>

      {isEdit && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <SyncOutlined className="text-blue-600" />
            <span className="font-medium text-blue-900">Sync from Page Tree</span>
          </div>
          <p className="text-sm text-blue-700 mb-2">
            Click the "Sync from Page Tree" button above to automatically populate navigation links from your page tree structure.
          </p>
          {headerConfig?.lastSyncedFromPageTree && (
            <p className="text-xs text-blue-600">
              Last synced: {new Date(headerConfig.lastSyncedFromPageTree).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {navigationLinks.map((link, index) => (
        <Card key={index} className="mb-4 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold">Link {index + 1}</span>
            <Space>
              <Switch
                checked={link.isFieldActive !== false}
                onChange={(checked) => updateNavigationLink(index, 'isFieldActive', checked)}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeNavigationLink(index)}
              >
                Remove
              </Button>
            </Space>
          </div>
          <Form.Item label="Label">
            <Input
              value={link.label}
              onChange={(e) => updateNavigationLink(index, 'label', e.target.value)}
              placeholder="Link Label"
            />
          </Form.Item>
          <Form.Item label="URL">
            <Input
              value={link.href}
              onChange={(e) => updateNavigationLink(index, 'href', e.target.value)}
              placeholder="/path"
            />
          </Form.Item>
          <Form.Item label="Order">
            <Input
              type="number"
              value={link.order}
              onChange={(e) => updateNavigationLink(index, 'order', parseInt(e.target.value) || 0)}
            />
          </Form.Item>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Dropdown Items</span>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addDropdownItem(index)}
              >
                Add Dropdown Item
              </Button>
            </div>
            {link.dropdown && link.dropdown.map((item, dropdownIndex) => (
              <Card key={dropdownIndex} className="mb-2 border border-gray-100">
                <div className="flex justify-end mb-2">
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeDropdownItem(index, dropdownIndex)}
                  >
                    Remove
                  </Button>
                </div>
                <Form.Item label="Dropdown Label">
                  <Input
                    value={item.label}
                    onChange={(e) => updateDropdownItem(index, dropdownIndex, 'label', e.target.value)}
                    placeholder="Dropdown Label"
                  />
                </Form.Item>
                <Form.Item label="Dropdown URL">
                  <Input
                    value={item.href}
                    onChange={(e) => updateDropdownItem(index, dropdownIndex, 'href', e.target.value)}
                    placeholder="/path"
                  />
                </Form.Item>
              </Card>
            ))}
          </div>
        </Card>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addNavigationLink}
        className="w-full mb-4"
      >
        Add Navigation Link
      </Button>

      <Divider>Theme Toggle</Divider>

      <Form.Item name={['themeToggle', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Theme Toggle Active" unCheckedChildren="Theme Toggle Inactive" />
      </Form.Item>

      <Form.Item name={['themeToggle', 'enabled']} valuePropName="checked">
        <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
        <span className="ml-2 text-sm text-gray-600">Enable theme toggle button</span>
      </Form.Item>

      <Divider>CTA Button</Divider>

      <Form.Item name={['ctaButton', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="CTA Button Active" unCheckedChildren="CTA Button Inactive" />
      </Form.Item>

      <Form.Item name={['ctaButton', 'text']} label="CTA Button Text">
        <Input placeholder="Get Quote" />
      </Form.Item>

      <Form.Item name={['ctaButton', 'href']} label="CTA Button URL">
        <Input placeholder="/contact-us" />
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
            {isEdit ? 'Update Header Configuration' : 'Create Header Configuration'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default HeaderConfigurationEditor;

