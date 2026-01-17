import { Form, Input, Button, Switch } from 'antd';
import { useEffect } from 'react';

/**
 * Country Form Component
 * Reusable form for creating and editing countries
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const CountryForm = ({
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
        code: initialValues.code?.toUpperCase() || '',
        isVisible: initialValues.isVisible !== undefined ? initialValues.isVisible : true,
        featured: initialValues.featured !== undefined ? initialValues.featured : false,
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
      };
      form.setFieldsValue(formValues);
    }
  }, [initialValues, form]);

  // Auto-uppercase code
  const handleCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    form.setFieldsValue({ code });
  };

  const handleSubmit = async (values) => {
    const cleanedValues = {
      ...values,
      name: values.name?.trim(),
      code: values.code?.trim().toUpperCase(),
      isVisible: values.isVisible !== undefined ? values.isVisible : true,
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
        isVisible: true,
        featured: false,
        isActive: true,
        ...initialValues,
      }}
    >
      {/* Basic Information */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="Country Name"
            rules={[
              { required: true, message: 'Please enter country name' },
              { min: 2, message: 'Name must be at least 2 characters' },
              { max: 100, message: 'Name must not exceed 100 characters' },
            ]}
            tooltip="Full name of the country"
          >
            <Input
              placeholder="Enter country name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Country Code"
            rules={[
              { required: true, message: 'Please enter country code' },
              { min: 2, message: 'Code must be at least 2 characters' },
              { max: 3, message: 'Code must be at most 3 characters' },
              {
                pattern: /^[A-Z]{2,3}$/,
                message: 'Code must be 2-3 uppercase letters (ISO 3166-1 alpha-2 or alpha-3)'
              },
            ]}
            tooltip="ISO 3166-1 alpha-2 (2 letters) or alpha-3 (3 letters) country code"
          >
            <Input
              placeholder="e.g., US, GB, UAE"
              size="large"
              maxLength={3}
              onChange={handleCodeChange}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
        </div>
      </div>

      {/* Status & Visibility */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Visibility</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Form.Item
            name="isVisible"
            label="Visible"
            valuePropName="checked"
            tooltip="Visible countries appear in dropdowns and selection lists"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="featured"
            label="Featured"
            valuePropName="checked"
            tooltip="Featured countries are visible on the public website (must also be published)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            tooltip="Inactive countries are hidden from all views"
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
            {isEdit ? 'Update Country' : 'Create Country'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default CountryForm;

