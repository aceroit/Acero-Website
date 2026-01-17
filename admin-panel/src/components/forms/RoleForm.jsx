import { Form, Input, InputNumber, Select, Switch, Button, Space, ColorPicker } from 'antd';
import { useEffect } from 'react';

const { TextArea } = Input;
const { Option } = Select;

// Common color options for roles
const COLOR_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Orange', value: 'orange' },
  { label: 'Purple', value: 'purple' },
  { label: 'Cyan', value: 'cyan' },
  { label: 'Magenta', value: 'magenta' },
  { label: 'Gold', value: 'gold' },
  { label: 'Lime', value: 'lime' },
];

/**
 * Role Form Component
 * Reusable form for creating and editing roles
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const RoleForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async (values) => {
    // Clean up values
    const cleanedValues = {
      ...values,
      description: values.description?.trim() || '',
      level: values.level || 0,
      color: values.color || 'default',
      isActive: values.isActive !== undefined ? values.isActive : true,
    };

    // If editing a system role, don't allow changing slug
    if (isEdit && initialValues.isSystem) {
      cleanedValues.slug = initialValues.slug; // Keep original slug
    }

    await onSubmit(cleanedValues);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    // Auto-generate slug from name if not editing or if slug is empty
    if (!isEdit || !form.getFieldValue('slug')) {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '');
      form.setFieldsValue({ slug });
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        level: 0,
        color: 'default',
        isActive: true,
        ...initialValues,
      }}
    >
      <Form.Item
        label="Role Name"
        name="name"
        rules={[
          { required: true, message: 'Role name is required' },
          { min: 2, message: 'Role name must be at least 2 characters' },
          { max: 50, message: 'Role name must not exceed 50 characters' },
        ]}
      >
        <Input
          placeholder="Enter role name (e.g., Super Admin)"
          onChange={handleNameChange}
          disabled={isEdit && initialValues.isSystem}
        />
      </Form.Item>

      <Form.Item
        label="Slug"
        name="slug"
        rules={[
          { required: true, message: 'Slug is required' },
          {
            pattern: /^[a-z0-9_-]+$/,
            message: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
          },
        ]}
        tooltip="URL-friendly identifier (auto-generated from name)"
      >
        <Input
          placeholder="super_admin"
          disabled={isEdit && initialValues.isSystem}
        />
      </Form.Item>

      <Form.Item
        label="Description"
        name="description"
        rules={[
          { max: 500, message: 'Description must not exceed 500 characters' },
        ]}
      >
        <TextArea
          rows={3}
          placeholder="Enter role description"
          maxLength={500}
          showCount
        />
      </Form.Item>

      <Form.Item
        label="Level"
        name="level"
        rules={[
          { type: 'number', min: 0, max: 1000, message: 'Level must be between 0 and 1000' },
        ]}
        tooltip="Higher number = more privileges (for hierarchy/ordering)"
      >
        <InputNumber
          min={0}
          max={1000}
          style={{ width: '100%' }}
          placeholder="0"
        />
      </Form.Item>

      <Form.Item
        label="Color"
        name="color"
        tooltip="Color for UI display"
      >
        <Select placeholder="Select color">
          {COLOR_OPTIONS.map((color) => (
            <Option key={color.value} value={color.value}>
              <Space>
                <span
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: color.value === 'default' ? '#d9d9d9' : color.value,
                    border: '1px solid #ccc',
                    verticalAlign: 'middle',
                  }}
                />
                {color.label}
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Active"
        name="isActive"
        valuePropName="checked"
        tooltip="Inactive roles cannot be assigned to users"
      >
        <Switch />
      </Form.Item>

      {isEdit && initialValues.isSystem && (
        <Form.Item>
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fff7e6', 
            border: '1px solid #ffd591',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <strong>System Role:</strong> This is a system role. The slug cannot be changed.
          </div>
        </Form.Item>
      )}

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? 'Update Role' : 'Create Role'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default RoleForm;

