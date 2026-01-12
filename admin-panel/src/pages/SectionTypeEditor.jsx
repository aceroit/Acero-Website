import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  Breadcrumb, 
  Spin, 
  Form, 
  Input, 
  Select, 
  Button, 
  Switch,
  Space,
  Alert,
  Divider,
  Tag
} from 'antd';
import { 
  HomeOutlined, 
  SettingOutlined,
  ArrowLeftOutlined,
  SaveOutlined
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import FieldBuilder from '../components/forms/FieldBuilder';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import { ROLES } from '../utils/constants';
import * as sectionTypeService from '../services/sectionTypeService';
import { toast } from 'react-toastify';

const { TextArea } = Input;
const { Option } = Select;

const SectionTypeEditor = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const [form] = Form.useForm();
  const isEdit = !!slug;
  
  const [sectionType, setSectionType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [fields, setFields] = useState([]);

  const isSuperAdmin = hasRole(ROLES.SUPER_ADMIN);

  // Fetch section type if editing
  useEffect(() => {
    if (isEdit && slug) {
      fetchSectionType();
    }
  }, [slug]);

  const fetchSectionType = async () => {
    setFetching(true);
    try {
      const response = await sectionTypeService.getSectionTypeBySlug(slug);
      if (response.success) {
        const data = response.data.sectionType || response.data;
        setSectionType(data);
        setFields(data.fields || []);
        
        form.setFieldsValue({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          category: data.category || 'General',
          icon: data.icon || 'default-icon',
          previewComponent: data.previewComponent || 'DefaultPreview',
          thumbnailUrl: data.thumbnailUrl || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
        });
      } else {
        toast.error('Section type not found');
        navigate('/section-types');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch section type');
      navigate('/section-types');
    } finally {
      setFetching(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    if (!isEdit && name) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      form.setFieldsValue({ slug: generatedSlug });
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    // For system section types, don't require fields (they're protected)
    if (!sectionType?.isSystem && fields.length === 0) {
      toast.error('Please add at least one field to the section type');
      return;
    }

    setLoading(true);
    try {
      const sectionTypeData = {
        // Only include name, slug, and fields if not a system type
        ...(sectionType?.isSystem ? {} : {
          name: values.name.trim(),
          slug: values.slug.trim().toLowerCase(),
          fields: fields.map((field, index) => ({
            ...field,
            order: index, // Ensure order is sequential
          })),
        }),
        description: values.description?.trim() || '',
        icon: values.icon?.trim() || 'default-icon',
        isActive: values.isActive !== undefined ? values.isActive : true,
        // Only include category and previewComponent if not a system type
        ...(sectionType?.isSystem ? {} : {
          category: values.category || 'General',
          previewComponent: values.previewComponent?.trim() || 'DefaultPreview',
          thumbnailUrl: values.thumbnailUrl?.trim() || null,
        }),
      };

      let response;
      if (isEdit) {
        response = await sectionTypeService.updateSectionType(slug, sectionTypeData);
      } else {
        response = await sectionTypeService.createSectionType(sectionTypeData);
      }

      if (response.success) {
        toast.success(isEdit ? 'Section type updated successfully' : 'Section type created successfully');
        navigate('/section-types');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update section type' : 'Failed to create section type');
      
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors)) {
          toast.error(validationErrors.join(', '));
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/section-types');
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
        <a href="/section-types">
          <span>Section Types</span>
        </a>
      ),
    },
    {
      title: <span>{isEdit ? 'Edit Section Type' : 'Create Section Type'}</span>,
    },
  ];

  if (!isSuperAdmin) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-2">Access Denied</p>
            <p className="text-gray-500">Only Super Administrators can manage section types.</p>
          </div>
        </Card>
      </MainLayout>
    );
  }

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
          items={breadcrumbItems}
          className="text-sm"
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleCancel}
            size="large"
            className="w-full md:w-auto"
          >
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-900 mb-2 break-words">
              {isEdit ? `Edit Section Type: ${sectionType?.name || ''}` : 'Create New Section Type'}
            </h1>
            <p className="text-gray-500 text-xs md:text-sm lg:text-base">
              {isEdit 
                ? 'Update section type details and field configuration'
                : 'Create a new custom section type with custom fields'
              }
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              category: 'General',
              icon: 'default-icon',
              previewComponent: 'DefaultPreview',
              isActive: true,
            }}
          >
            {sectionType?.isSystem && (
              <Alert
                message="System Section Type"
                description="Only description, icon, and active status can be modified for system section types. Name, slug, and fields are protected."
                type="warning"
                showIcon
                className="mb-4"
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Form.Item
                name="name"
                label="Section Type Name"
                rules={[
                  { required: true, message: 'Please enter section type name' },
                  { min: 2, message: 'Name must be at least 2 characters' },
                  { max: 100, message: 'Name must not exceed 100 characters' },
                ]}
              >
                <Input 
                  placeholder="e.g., Hero Banner, Image Gallery" 
                  size="large"
                  onChange={handleNameChange}
                  disabled={sectionType?.isSystem}
                />
              </Form.Item>

              <Form.Item
                name="slug"
                label="Slug"
                rules={[
                  { required: true, message: 'Please enter slug' },
                  { 
                    pattern: /^[a-z0-9-_]+$/,
                    message: 'Slug must contain only lowercase letters, numbers, hyphens, and underscores'
                  },
                  { min: 2, message: 'Slug must be at least 2 characters' },
                  { max: 100, message: 'Slug must not exceed 100 characters' },
                ]}
                tooltip="URL-friendly identifier (e.g., 'hero-banner', 'image-gallery')"
              >
                <Input 
                  placeholder="e.g., hero-banner" 
                  size="large"
                  disabled={isEdit || sectionType?.isSystem}
                />
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label="Description"
              tooltip="Brief description of what this section type is used for"
            >
              <TextArea 
                placeholder="Describe the purpose of this section type..." 
                rows={3}
                size="large"
                maxLength={500}
                showCount
              />
            </Form.Item>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select a category' }]}
                tooltip="Group section types by category"
              >
                <Select size="large" disabled={sectionType?.isSystem}>
                  <Option value="Headers">Headers</Option>
                  <Option value="Content">Content</Option>
                  <Option value="Media">Media</Option>
                  <Option value="Forms">Forms</Option>
                  <Option value="Custom">Custom</Option>
                  <Option value="General">General</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="icon"
                label="Icon"
                tooltip="Icon identifier for this section type"
              >
                <Input 
                  placeholder="e.g., hero-icon, gallery-icon" 
                  size="large"
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Form.Item
                name="previewComponent"
                label="Preview Component"
                tooltip="Component name for admin preview"
              >
                <Input 
                  placeholder="DefaultPreview" 
                  size="large"
                  disabled={sectionType?.isSystem}
                />
              </Form.Item>

              <Form.Item
                name="thumbnailUrl"
                label="Thumbnail URL"
                tooltip="Preview image URL for section library"
              >
                <Input 
                  placeholder="https://example.com/thumbnail.jpg" 
                  size="large"
                  disabled={sectionType?.isSystem}
                />
              </Form.Item>
            </div>

            <Form.Item
              name="isActive"
              label="Active Status"
              valuePropName="checked"
              tooltip="Inactive section types won't appear in the section library"
            >
              <Switch />
            </Form.Item>

            <Divider />

            {/* Field Builder */}
            {!sectionType?.isSystem && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Fields</h3>
                    <p className="text-sm text-gray-500">
                      Define the fields that will be available when creating sections of this type
                    </p>
                  </div>
                </div>

                {fields.length === 0 && (
                  <Alert
                    message="No fields added"
                    description="Add at least one field to define the structure of this section type."
                    type="warning"
                    showIcon
                    className="mb-4"
                  />
                )}

                <FieldBuilder
                  fields={fields}
                  onChange={setFields}
                />
              </div>
            )}

            {sectionType?.isSystem && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fields</h3>
                  <Alert
                    message="Fields are protected"
                    description="Fields cannot be modified for system section types. The field structure is defined by the system."
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                </div>
                <Card className="bg-gray-50">
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white rounded">
                        <span className="font-medium text-gray-900">{field.label}</span>
                        <span className="text-xs text-gray-500 font-mono">({field.name})</span>
                        <Tag color="blue" className="ml-auto">
                          {field.type}
                        </Tag>
                        {field.required && (
                          <Tag color="red" className="text-xs">Required</Tag>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Form Actions */}
            <Form.Item className="mb-0 mt-6">
              <div className="flex justify-end gap-2">
                <Button 
                  onClick={handleCancel} 
                  disabled={loading}
                  size="large"
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                  icon={<SaveOutlined />}
                  className="text-white"
                  style={{ 
                    backgroundColor: '#1f2937', 
                    borderColor: '#1f2937',
                    fontWeight: '600'
                  }}
                >
                  {isEdit ? 'Update Section Type' : 'Create Section Type'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SectionTypeEditor;

