import { Form, Input, InputNumber, Button, Switch } from 'antd';
import { useEffect } from 'react';
import ImageUpload from '../common/ImageUpload';

/**
 * Building Type Form Component
 * Reusable form for creating and editing building types
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const BuildingTypeForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
        featured: initialValues.featured !== undefined ? initialValues.featured : false,
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
      };
      form.setFieldsValue(formValues);
    }
  }, [initialValues, form]);

  // Auto-generate slug from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    if (!isEdit && name) {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      form.setFieldsValue({ slug });
    }
  };

  const handleSubmit = async (values) => {
    const cleanedValues = {
      ...values,
      name: values.name?.trim(),
      slug: values.slug?.trim().toLowerCase(),
      featured: values.featured !== undefined ? values.featured : false,
      isActive: values.isActive !== undefined ? values.isActive : true,
    };
    await onSubmit(cleanedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        featured: false,
        isActive: true,
        ...initialValues,
      }}
    >
      {/* Basic Information */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <Form.Item
          name="name"
          label="Building Type Name"
          rules={[
            { required: true, message: 'Please enter building type name' },
            { min: 2, message: 'Name must be at least 2 characters' },
            { max: 100, message: 'Name must not exceed 100 characters' },
          ]}
          tooltip="Unique name for the building type"
        >
          <Input
            placeholder="Enter building type name"
            size="large"
            onChange={handleNameChange}
          />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          rules={[
            { required: true, message: 'Please enter slug' },
            {
              pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: 'Slug must contain only lowercase letters, numbers, and hyphens'
            },
          ]}
          tooltip="URL-friendly identifier (auto-generated from name)"
        >
          <Input
            placeholder="Enter slug"
            size="large"
            disabled={isEdit}
          />
        </Form.Item>
      </div>

      {/* Image */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Image</h3>
        
        <Form.Item
          name="image"
          label="Building Type Image"
          tooltip="Image for the building type (min: 126×100px)"
        >
          <ImageUpload
            value={form.getFieldValue('image')}
            onChange={(image) => {
              form.setFieldsValue({ image });
              form.validateFields(['image']);
            }}
            folder="building-types/images"
            dimensions={{ minWidth: 126, minHeight: 100 }}
            maxSize={5}
          />
        </Form.Item>
      </div>

      {/* Status & Visibility */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Visibility</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="featured"
            label="Featured"
            valuePropName="checked"
            tooltip="Featured building types are visible on the public website (must also be published)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            tooltip="Inactive building types are hidden from all views"
          >
            <Switch />
          </Form.Item>
        </div>
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
            {isEdit ? 'Update Building Type' : 'Create Building Type'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default BuildingTypeForm;

