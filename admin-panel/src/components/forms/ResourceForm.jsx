import { Form, Input, Select, Switch, InputNumber, Button, Space } from 'antd';
import { useEffect, useState } from 'react';
import * as resourceService from '../../services/resourceService';
import { toast } from 'react-toastify';

const { Option } = Select;
const { TextArea } = Input;

// Common Ant Design icons
const COMMON_ICONS = [
  'DashboardOutlined',
  'UserOutlined',
  'SettingOutlined',
  'FileTextOutlined',
  'BranchesOutlined',
  'SearchOutlined',
  'EditOutlined',
  'DeleteOutlined',
  'PlusOutlined',
  'MoreOutlined',
  'EyeOutlined',
  'EyeInvisibleOutlined',
  'TeamOutlined',
  'CheckCircleOutlined',
  'SafetyOutlined',
  'ThunderboltOutlined',
  'InfoCircleOutlined',
  'FileOutlined',
  'ClockCircleOutlined',
  'WarningOutlined',
  'RocketOutlined',
  'HistoryOutlined',
  'ExclamationCircleOutlined',
  'FilterOutlined',
  'UnorderedListOutlined',
  'MenuOutlined',
  'HomeOutlined',
  'FolderOutlined',
  'DatabaseOutlined',
  'ApiOutlined',
];

/**
 * Resource Form Component
 * Reusable form for creating and editing resources
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const ResourceForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const [parentResources, setParentResources] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  useEffect(() => {
    fetchParentResources();
  }, []);

  const fetchParentResources = async () => {
    setLoadingParents(true);
    try {
      const response = await resourceService.getAllResources(true);
      if (response.success) {
        // Filter out the current resource if editing to prevent self-parenting
        let resources = response.data.resources || response.data || [];
        if (isEdit && initialValues._id) {
          resources = resources.filter(r => r._id !== initialValues._id);
        }
        setParentResources(resources);
      }
    } catch (error) {
      toast.error('Failed to fetch parent resources');
    } finally {
      setLoadingParents(false);
    }
  };

  const handleSubmit = async (values) => {
    // Convert empty strings to null for optional fields
    const cleanedValues = {
      ...values,
      parentId: values.parentId || null,
      description: values.description?.trim() || '',
      category: values.category?.trim() || 'General',
      metadata: values.metadata || {},
    };
    await onSubmit(cleanedValues);
  };

  // Auto-generate slug from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    if (!isEdit && name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      form.setFieldsValue({ slug });
    }
  };

  // Auto-generate path from slug
  const handleSlugChange = (e) => {
    const slug = e.target.value;
    if (!isEdit && slug) {
      const path = `/${slug}`;
      form.setFieldsValue({ path });
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        icon: 'FileTextOutlined',
        category: 'General',
        showInMenu: true,
        isActive: true,
        order: 0,
        ...initialValues,
      }}
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[
          { required: true, message: 'Please enter resource name' },
          { min: 2, message: 'Name must be at least 2 characters' },
          { max: 100, message: 'Name must not exceed 100 characters' },
        ]}
      >
        <Input 
          placeholder="Enter resource name (e.g., Users, Pages)" 
          size="large"
          onChange={handleNameChange}
        />
      </Form.Item>

      <Form.Item
        name="slug"
        label="Slug"
        rules={[
          { required: true, message: 'Please enter resource slug' },
          { 
            pattern: /^[a-z0-9_-]+$/, 
            message: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores' 
          },
          { min: 2, message: 'Slug must be at least 2 characters' },
          { max: 100, message: 'Slug must not exceed 100 characters' },
        ]}
      >
        <Input 
          placeholder="Enter slug (e.g., users, pages, section_types)" 
          size="large"
          onChange={handleSlugChange}
          disabled={isEdit}
        />
      </Form.Item>

      <Form.Item
        name="path"
        label="Path"
        rules={[
          { required: true, message: 'Please enter resource path' },
          { 
            pattern: /^\/[a-z0-9\/_-]*$/, 
            message: 'Path must start with / and contain only lowercase letters, numbers, slashes, hyphens, and underscores' 
          },
          { max: 200, message: 'Path must not exceed 200 characters' },
        ]}
      >
        <Input 
          placeholder="Enter route path (e.g., /users, /pages, /permissions)" 
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="parentId"
        label="Parent Resource"
        tooltip="Optional: Select a parent resource to create a hierarchy"
      >
        <Select
          placeholder="Select parent resource (optional)"
          size="large"
          allowClear
          loading={loadingParents}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {parentResources.map((resource) => (
            <Option key={resource._id} value={resource._id}>
              {resource.name} ({resource.path})
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="icon"
        label="Icon"
        tooltip="Ant Design icon name (e.g., FileTextOutlined, UserOutlined)"
        rules={[
          { required: true, message: 'Please enter icon name' },
        ]}
      >
        <Select
          placeholder="Select or type icon name"
          size="large"
          showSearch
          allowClear
          filterOption={(input, option) =>
            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {COMMON_ICONS.map((icon) => (
            <Option key={icon} value={icon}>
              {icon}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="category"
        label="Category"
        tooltip="Group resources by category (e.g., Content, Administration, Settings)"
        rules={[
          { max: 50, message: 'Category must not exceed 50 characters' },
        ]}
      >
        <Input 
          placeholder="Enter category (e.g., Content, Administration)" 
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          { max: 500, message: 'Description must not exceed 500 characters' },
        ]}
      >
        <TextArea 
          placeholder="Enter resource description (optional)" 
          rows={3}
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item
        name="order"
        label="Display Order"
        tooltip="Lower numbers appear first in menus"
        rules={[
          { type: 'number', min: 0, message: 'Order must be a non-negative number' },
        ]}
      >
        <InputNumber 
          placeholder="Enter display order" 
          size="large"
          min={0}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Form.Item
          name="showInMenu"
          valuePropName="checked"
          label="Show in Menu"
          tooltip="Whether this resource should appear in the sidebar menu"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="isActive"
          valuePropName="checked"
          label="Active"
          tooltip="Whether this resource is currently active"
        >
          <Switch />
        </Form.Item>
      </Space>

      <Form.Item>
        <Space>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
            style={{
              backgroundColor: '#1f2937',
              borderColor: '#1f2937',
            }}
          >
            {isEdit ? 'Update Resource' : 'Create Resource'}
          </Button>
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ResourceForm;

