import { Form, Input, InputNumber, Switch, Button } from 'antd';
import { useEffect } from 'react';
import ImageUpload from '../common/ImageUpload';

/**
 * Customer Form Component
 * Reusable form for creating and editing customers
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const CustomerForm = ({
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

  const handleSubmit = async (values) => {
    const cleanedValues = {
      ...values,
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
        order: 0,
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
          label="Customer Name"
          rules={[
            { required: true, message: 'Please enter customer name' },
            { min: 2, message: 'Customer name must be at least 2 characters' },
            { max: 200, message: 'Customer name must not exceed 200 characters' },
          ]}
        >
          <Input
            placeholder="Enter customer name"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="order"
          label="Display Order"
          rules={[
            { required: true, message: 'Please enter display order' },
            { type: 'number', min: 0, message: 'Order must be 0 or greater' },
          ]}
          tooltip="Lower numbers appear first"
        >
          <InputNumber
            placeholder="Enter display order"
            size="large"
            min={0}
            className="w-full"
          />
        </Form.Item>
      </div>

      {/* Customer Image */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Image</h3>
        
        <Form.Item
          name="customerImage"
          label="Customer Logo/Image"
          tooltip="Customer logo or image (min: 208×104px)"
        >
          <ImageUpload
            value={form.getFieldValue('customerImage')}
            onChange={(image) => {
              form.setFieldsValue({ customerImage: image });
              form.validateFields(['customerImage']);
            }}
            folder="customers"
            dimensions={{ minWidth: 208, minHeight: 104 }}
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
            tooltip="Featured customers are visible on the public website (must also be published)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            tooltip="Inactive customers are hidden from all views"
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
            {isEdit ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default CustomerForm;

