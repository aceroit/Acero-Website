import { Form, Input, Select, Button, Switch, InputNumber } from 'antd';
import { useEffect, useState } from 'react';
import { usePermissions } from '../../contexts/PermissionContext';
import * as pageService from '../../services/pageService';
import { toast } from 'react-toastify';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Page Form Component
 * Reusable form for creating and editing pages
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @param {string} props.excludePageId - Page ID to exclude from parent selection (to prevent circular references)
 * @returns {React.ReactNode}
 */
const PageForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
  excludePageId = null,
}) => {
  const [form] = Form.useForm();
  const [parentPages, setParentPages] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        parentId: initialValues.parentId || undefined,
      });
    }
  }, [initialValues, form]);

  // Fetch parent pages for dropdown
  useEffect(() => {
    fetchParentPages();
  }, []);

  const fetchParentPages = async () => {
    setLoadingParents(true);
    try {
      const response = await pageService.getPageTree();
      if (response.success) {
        // Flatten tree and exclude current page if editing
        const flattenTree = (nodes, level = 0, parentPath = '') => {
          let result = [];
          nodes.forEach((node) => {
            // Skip the current page being edited to prevent circular references
            if (excludePageId && node._id === excludePageId) {
              return;
            }
            
            const indent = '  '.repeat(level);
            result.push({
              ...node,
              displayName: `${indent}${node.title}`,
              fullPath: parentPath ? `${parentPath} > ${node.title}` : node.title,
            });
            
            if (node.children && node.children.length > 0) {
              result = result.concat(flattenTree(node.children, level + 1, node.title));
            }
          });
          return result;
        };
        
        const flatList = flattenTree(response.data.tree || []);
        setParentPages(flatList);
      }
    } catch (error) {
      console.error('Failed to fetch parent pages:', error);
      toast.error('Failed to load parent pages');
    } finally {
      setLoadingParents(false);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const title = e.target.value;
    if (!isEdit && title) {
      // Generate slug: lowercase, replace spaces with hyphens, remove special chars
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      form.setFieldsValue({ slug });
    }
  };

  const handleSubmit = async (values) => {
    // Convert empty strings to null for optional fields
    const cleanedValues = {
      ...values,
      parentId: values.parentId || null,
      metaTitle: values.metaTitle?.trim() || null,
      metaDescription: values.metaDescription?.trim() || null,
      metaKeywords: values.metaKeywords?.trim() || null,
      menuIcon: values.menuIcon?.trim() || null,
      showInMenu: values.showInMenu !== undefined ? values.showInMenu : true,
    };
    
    await onSubmit(cleanedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        showInMenu: true,
        ...initialValues,
      }}
    >
      <Form.Item
        name="title"
        label="Page Title"
        rules={[
          { required: true, message: 'Please enter page title' },
          { min: 2, message: 'Title must be at least 2 characters' },
          { max: 200, message: 'Title must not exceed 200 characters' },
        ]}
      >
        <Input 
          placeholder="Enter page title" 
          size="large"
          onChange={handleTitleChange}
        />
      </Form.Item>

      <Form.Item
        name="slug"
        label="Slug"
        rules={[
          { required: true, message: 'Please enter page slug' },
          { 
            pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            message: 'Slug must contain only lowercase letters, numbers, and hyphens'
          },
          { min: 2, message: 'Slug must be at least 2 characters' },
          { max: 100, message: 'Slug must not exceed 100 characters' },
        ]}
        tooltip="URL-friendly identifier (e.g., 'about-us', 'contact')"
      >
        <Input 
          placeholder="Enter page slug" 
          size="large"
          disabled={isEdit}
        />
      </Form.Item>

      <Form.Item
        name="parentId"
        label="Parent Page"
        tooltip="Select a parent page to create a hierarchical structure. Leave empty for root level pages."
      >
        <Select 
          placeholder="Select parent page (optional)" 
          size="large"
          allowClear
          loading={loadingParents}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={parentPages.map(page => ({
            value: page._id,
            label: page.displayName,
            title: page.fullPath,
          }))}
        />
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          name="showInMenu"
          label="Show in Menu"
          valuePropName="checked"
          tooltip="Display this page in the navigation menu"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="menuIcon"
          label="Menu Icon"
          tooltip="Icon name (e.g., 'home', 'info', 'contact')"
        >
          <Input 
            placeholder="Icon name (optional)" 
            size="large"
          />
        </Form.Item>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Metadata</h3>
        
        <Form.Item
          name="metaTitle"
          label="Meta Title"
          tooltip="SEO title (recommended: 50-60 characters)"
        >
          <Input 
            placeholder="Enter meta title" 
            size="large"
            maxLength={60}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="metaDescription"
          label="Meta Description"
          tooltip="SEO description (recommended: 150-160 characters)"
        >
          <TextArea 
            placeholder="Enter meta description" 
            size="large"
            rows={3}
            maxLength={160}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="metaKeywords"
          label="Meta Keywords"
          tooltip="Comma-separated keywords for SEO"
        >
          <Input 
            placeholder="keyword1, keyword2, keyword3" 
            size="large"
          />
        </Form.Item>
      </div>

      <Form.Item className="mb-0 mt-6">
        <div className="flex justify-end gap-2">
          <Button 
            onClick={onCancel} 
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
            className="text-white"
            style={{ 
              backgroundColor: '#1f2937', 
              borderColor: '#1f2937',
              fontWeight: '600'
            }}
          >
            {isEdit ? 'Update Page' : 'Create Page'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default PageForm;

