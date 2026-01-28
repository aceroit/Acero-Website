import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Divider, Collapse, Space, Button, Form, Input, Switch, Select, InputNumber, message } from 'antd';
import { HomeOutlined, HistoryOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as footerConfigurationService from '../services/footerConfigurationService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;
const { TextArea } = Input;
const { Option } = Select;

const FooterConfigurationEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [form] = Form.useForm();
  const isEdit = !!id;
  
  const [footerConfig, setFooterConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: footerConfig?.status || 'draft',
    resourceType: 'footer-configuration',
    createdBy: footerConfig?.createdBy?._id || footerConfig?.createdBy,
  });

  // Fetch footer configuration data if editing
  useEffect(() => {
    if (isEdit) {
      fetchFooterConfiguration();
    }
  }, [id]);

  const fetchFooterConfiguration = async () => {
    setFetching(true);
    try {
      const response = await footerConfigurationService.getFooterConfiguration(id);
      if (response.success) {
        // Backend returns 'footer', but admin panel expects 'footerConfiguration'
        const footerData = response.data.footerConfiguration || response.data.footer;
        if (!footerData) {
          toast.error('Footer configuration data not found in response');
          navigate('/website-configurations/footer');
          return;
        }
        
        setFooterConfig(footerData);
        form.setFieldsValue({
          title: footerData.title,
          featured: footerData.featured === true || footerData.featured === 'true',
          brandInfo: {
            logo: {
              imageUrl: footerData.brandInfo?.logo?.imageUrl || '',
              altText: footerData.brandInfo?.logo?.altText || ''
            },
            description: footerData.brandInfo?.description || '',
            isFieldActive: footerData.brandInfo?.isFieldActive !== false
          },
          contactInfo: {
            phone: footerData.contactInfo?.phone || '',
            email: footerData.contactInfo?.email || '',
            address: footerData.contactInfo?.address || '',
            isFieldActive: footerData.contactInfo?.isFieldActive !== false
          },
          socialLinks: footerData.socialLinks || [],
          quickLinks: footerData.quickLinks || [],
          productsLinks: footerData.productsLinks || [],
          mediaLinks: footerData.mediaLinks || [],
          copyright: {
            text: footerData.copyright?.text || '',
            year: footerData.copyright?.year || new Date().getFullYear(),
            isFieldActive: footerData.copyright?.isFieldActive !== false
          },
          legalLinks: footerData.legalLinks || []
        });
      } else {
        toast.error('Footer configuration not found');
        navigate('/website-configurations/footer');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch footer configuration');
      navigate('/website-configurations/footer');
    } finally {
      setFetching(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isEdit && !workflowStatus.canEdit.canEdit) {
        toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this footer configuration');
        setLoading(false);
        return;
      }

      const submitData = {
        title: values.title || 'Footer Configuration',
        featured: values.featured === true || values.featured === 'true',
        brandInfo: {
          logo: {
            imageUrl: values.brandInfo?.logo?.imageUrl || null,
            altText: values.brandInfo?.logo?.altText || null
          },
          description: values.brandInfo?.description || null,
          isFieldActive: values.brandInfo?.isFieldActive !== false
        },
        contactInfo: {
          phone: values.contactInfo?.phone || null,
          email: values.contactInfo?.email || null,
          address: values.contactInfo?.address || null,
          isFieldActive: values.contactInfo?.isFieldActive !== false
        },
        socialLinks: values.socialLinks || [],
        quickLinks: values.quickLinks || [],
        productsLinks: values.productsLinks || [],
        mediaLinks: values.mediaLinks || [],
        copyright: {
          text: values.copyright?.text || null,
          year: values.copyright?.year || new Date().getFullYear(),
          isFieldActive: values.copyright?.isFieldActive !== false
        },
        legalLinks: values.legalLinks || []
      };

      let response;
      if (isEdit) {
        response = await footerConfigurationService.updateFooterConfiguration(id, submitData);
      } else {
        response = await footerConfigurationService.createFooterConfiguration(submitData);
      }

      if (response.success) {
        toast.success(isEdit ? 'Footer configuration updated successfully' : 'Footer configuration created successfully');
        
        if (isEdit) {
          await fetchFooterConfiguration();
        } else {
          // Backend returns 'footer', but admin panel expects 'footerConfiguration'
          const newFooter = response.data?.footerConfiguration || response.data?.footer;
          const newId = newFooter?._id || newFooter?.id;
          if (newId) {
            navigate(`/website-configurations/footer/${newId}`);
          } else {
            navigate('/website-configurations/footer');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update footer configuration' : 'Failed to create footer configuration');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/website-configurations/footer');
  };

  const handleWorkflowActionComplete = async () => {
    if (isEdit) {
      await fetchFooterConfiguration();
      setTimeout(() => {
        fetchFooterConfiguration();
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
        <a href="/website-configurations/footer">
          <span>Footer Configuration</span>
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
  if (!hasPermission('footer-configurations', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} footer configurations.</p>
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
              {isEdit ? `Edit Footer Configuration${footerConfig?.title ? `: ${footerConfig.title}` : ''}` : 'Create New Footer Configuration'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update footer configuration details and metadata'
                : 'Create a new footer configuration for your website'
              }
            </p>
          </div>
          {isEdit && footerConfig && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={footerConfig.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="footer-configuration"
                  resourceId={id}
                  currentStatus={footerConfig.status}
                  createdBy={footerConfig.createdBy?._id || footerConfig.createdBy}
                  onActionComplete={handleWorkflowActionComplete}
                  showLabels={true}
                  size="middle"
                />
              </Space>
            </div>
          )}
        </div>

        <Card className="border border-gray-200 shadow-md bg-white">
          {isEdit && footerConfig ? (
            <WorkflowStatusGuard
              status={footerConfig.status}
              resourceType="footer-configuration"
              resourceId={id}
              createdBy={footerConfig.createdBy?._id || footerConfig.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <FooterConfigurationForm
                form={form}
                initialValues={footerConfig}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <FooterConfigurationForm
              form={form}
              initialValues={{}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {isEdit && footerConfig && (
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
                        navigate(`/versions/footer-configuration/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="footer-configuration"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('footer-configuration', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchFooterConfiguration();
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

// Footer Configuration Form Component
const FooterConfigurationForm = ({ form, initialValues, onSubmit, onCancel, loading, isEdit }) => {
  const [socialLinks, setSocialLinks] = useState(initialValues.socialLinks || []);
  const [quickLinks, setQuickLinks] = useState(initialValues.quickLinks || []);
  const [productsLinks, setProductsLinks] = useState(initialValues.productsLinks || []);
  const [mediaLinks, setMediaLinks] = useState(initialValues.mediaLinks || []);
  const [legalLinks, setLegalLinks] = useState(initialValues.legalLinks || []);

  useEffect(() => {
    if (initialValues.socialLinks) setSocialLinks(initialValues.socialLinks);
    if (initialValues.quickLinks) setQuickLinks(initialValues.quickLinks);
    if (initialValues.productsLinks) setProductsLinks(initialValues.productsLinks);
    if (initialValues.mediaLinks) setMediaLinks(initialValues.mediaLinks);
    if (initialValues.legalLinks) setLegalLinks(initialValues.legalLinks);
  }, [initialValues]);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      form.setFieldsValue({
        title: initialValues.title || 'Footer Configuration',
        featured: initialValues.featured === true || initialValues.featured === 'true',
        brandInfo: {
          logo: {
            imageUrl: initialValues.brandInfo?.logo?.imageUrl ?? '',
            altText: initialValues.brandInfo?.logo?.altText ?? ''
          },
          description: initialValues.brandInfo?.description ?? '',
          isFieldActive: initialValues.brandInfo?.isFieldActive !== false
        },
        contactInfo: {
          phone: initialValues.contactInfo?.phone ?? '',
          email: initialValues.contactInfo?.email ?? '',
          address: initialValues.contactInfo?.address ?? '',
          isFieldActive: initialValues.contactInfo?.isFieldActive !== false
        },
        copyright: {
          text: initialValues.copyright?.text ?? '',
          year: initialValues.copyright?.year ?? new Date().getFullYear(),
          isFieldActive: initialValues.copyright?.isFieldActive !== false
        }
      });
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    onSubmit({ ...values, socialLinks, quickLinks, productsLinks, mediaLinks, legalLinks });
  };

  const addLink = (type) => {
    const newLink = { label: '', href: '', isFieldActive: true };
    switch(type) {
      case 'social':
        setSocialLinks([...socialLinks, { ...newLink, platform: 'LinkedIn', icon: '' }]);
        break;
      case 'quick':
        setQuickLinks([...quickLinks, newLink]);
        break;
      case 'products':
        setProductsLinks([...productsLinks, newLink]);
        break;
      case 'media':
        setMediaLinks([...mediaLinks, newLink]);
        break;
      case 'legal':
        setLegalLinks([...legalLinks, newLink]);
        break;
    }
  };

  const removeLink = (type, index) => {
    switch(type) {
      case 'social':
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
        break;
      case 'quick':
        setQuickLinks(quickLinks.filter((_, i) => i !== index));
        break;
      case 'products':
        setProductsLinks(productsLinks.filter((_, i) => i !== index));
        break;
      case 'media':
        setMediaLinks(mediaLinks.filter((_, i) => i !== index));
        break;
      case 'legal':
        setLegalLinks(legalLinks.filter((_, i) => i !== index));
        break;
    }
  };

  const updateLink = (type, index, field, value) => {
    switch(type) {
      case 'social':
        const updatedSocial = [...socialLinks];
        updatedSocial[index] = { ...updatedSocial[index], [field]: value };
        setSocialLinks(updatedSocial);
        break;
      case 'quick':
        const updatedQuick = [...quickLinks];
        updatedQuick[index] = { ...updatedQuick[index], [field]: value };
        setQuickLinks(updatedQuick);
        break;
      case 'products':
        const updatedProducts = [...productsLinks];
        updatedProducts[index] = { ...updatedProducts[index], [field]: value };
        setProductsLinks(updatedProducts);
        break;
      case 'media':
        const updatedMedia = [...mediaLinks];
        updatedMedia[index] = { ...updatedMedia[index], [field]: value };
        setMediaLinks(updatedMedia);
        break;
      case 'legal':
        const updatedLegal = [...legalLinks];
        updatedLegal[index] = { ...updatedLegal[index], [field]: value };
        setLegalLinks(updatedLegal);
        break;
    }
  };

  const renderLinkList = (links, type, title) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => addLink(type)}>
          Add {title}
        </Button>
      </div>
      {links.map((link, index) => (
        <Card key={index} className="mb-4 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">{title} {index + 1}</span>
            <Space>
              <Switch
                checked={link.isFieldActive !== false}
                onChange={(checked) => updateLink(type, index, 'isFieldActive', checked)}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeLink(type, index)}>
                Remove
              </Button>
            </Space>
          </div>
          {type === 'social' && (
            <Form.Item label="Platform">
              <Select
                value={link.platform}
                onChange={(value) => updateLink(type, index, 'platform', value)}
                style={{ width: '100%' }}
              >
                <Option value="LinkedIn">LinkedIn</Option>
                <Option value="Twitter">Twitter</Option>
                <Option value="Instagram">Instagram</Option>
                <Option value="YouTube">YouTube</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item label="Label">
            <Input
              value={link.label}
              onChange={(e) => updateLink(type, index, 'label', e.target.value)}
              placeholder="Link Label"
            />
          </Form.Item>
          <Form.Item label="URL">
            <Input
              value={link.href}
              onChange={(e) => updateLink(type, index, 'href', e.target.value)}
              placeholder="/path"
            />
          </Form.Item>
          {type === 'social' && (
            <Form.Item label="Icon (SVG code)">
              <TextArea
                value={link.icon}
                onChange={(e) => updateLink(type, index, 'icon', e.target.value)}
                placeholder="SVG icon code"
                rows={3}
              />
            </Form.Item>
          )}
        </Card>
      ))}
    </div>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        title: initialValues.title || 'Footer Configuration',
        featured: initialValues?.featured === true || initialValues?.featured === 'true' || false,
        brandInfo: {
          logo: {
            imageUrl: initialValues.brandInfo?.logo?.imageUrl || '',
            altText: initialValues.brandInfo?.logo?.altText || ''
          },
          description: initialValues.brandInfo?.description || '',
          isFieldActive: initialValues.brandInfo?.isFieldActive !== false
        },
        contactInfo: {
          phone: initialValues.contactInfo?.phone || '',
          email: initialValues.contactInfo?.email || '',
          address: initialValues.contactInfo?.address || '',
          isFieldActive: initialValues.contactInfo?.isFieldActive !== false
        },
        copyright: {
          text: initialValues.copyright?.text || '',
          year: initialValues.copyright?.year || new Date().getFullYear(),
          isFieldActive: initialValues.copyright?.isFieldActive !== false
        }
      }}
    >
      <Form.Item name="title" label="Title">
        <Input placeholder="Footer Configuration" />
      </Form.Item>

      <Form.Item
        name="featured"
        label="Featured"
        valuePropName="checked"
        tooltip="Mark as featured to publish (required for public site)"
      >
        <Switch />
      </Form.Item>

      <Divider>Brand Information</Divider>
      
      <Form.Item name={['brandInfo', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Brand Info Active" unCheckedChildren="Brand Info Inactive" />
      </Form.Item>

      <Form.Item name={['brandInfo', 'logo', 'imageUrl']} label="Logo Image URL">
        <Input placeholder="https://example.com/logo.png" />
      </Form.Item>

      <Form.Item name={['brandInfo', 'logo', 'altText']} label="Logo Alt Text">
        <Input placeholder="Company Logo" />
      </Form.Item>

      <Form.Item name={['brandInfo', 'description']} label="Brand Description">
        <TextArea rows={4} placeholder="Company description..." />
      </Form.Item>

      <Divider>Contact Information</Divider>

      <Form.Item name={['contactInfo', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Contact Info Active" unCheckedChildren="Contact Info Inactive" />
      </Form.Item>

      <Form.Item name={['contactInfo', 'phone']} label="Phone">
        <Input placeholder="+971 4 893 1000" />
      </Form.Item>

      <Form.Item name={['contactInfo', 'email']} label="Email">
        <Input type="email" placeholder="info@acero.ae" />
      </Form.Item>

      <Form.Item name={['contactInfo', 'address']} label="Address">
        <TextArea rows={3} placeholder="Company address..." />
      </Form.Item>

      <Divider>Social Links</Divider>
      {renderLinkList(socialLinks, 'social', 'Social Link')}

      <Divider>Quick Links</Divider>
      {renderLinkList(quickLinks, 'quick', 'Quick Link')}

      <Divider>Products Links</Divider>
      {renderLinkList(productsLinks, 'products', 'Product Link')}

      <Divider>Media Links</Divider>
      {renderLinkList(mediaLinks, 'media', 'Media Link')}

      <Divider>Copyright</Divider>

      <Form.Item name={['copyright', 'isFieldActive']} valuePropName="checked">
        <Switch checkedChildren="Copyright Active" unCheckedChildren="Copyright Inactive" />
      </Form.Item>

      <Form.Item name={['copyright', 'text']} label="Copyright Text">
        <Input placeholder="© {year} Acero Steel Manufacturing. All rights reserved." />
      </Form.Item>

      <Form.Item name={['copyright', 'year']} label="Copyright Year">
        <InputNumber min={2000} max={2100} style={{ width: '100%' }} />
      </Form.Item>

      <Divider>Legal Links</Divider>
      {renderLinkList(legalLinks, 'legal', 'Legal Link')}

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
            {isEdit ? 'Update Footer Configuration' : 'Create Footer Configuration'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default FooterConfigurationEditor;

