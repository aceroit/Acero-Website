import { Form, Input, Switch, Button } from 'antd';
import { useEffect } from 'react';
import ImageUpload from '../common/ImageUpload';

/**
 * Certification Form Component
 * Reusable form for creating and editing certifications
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const CertificationForm = ({
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
      link: values.link?.trim() || null,
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
          label="Certification Name"
          rules={[
            { required: true, message: 'Please enter certification name' },
            { min: 2, message: 'Certification name must be at least 2 characters' },
            { max: 200, message: 'Certification name must not exceed 200 characters' },
          ]}
        >
          <Input
            placeholder="Enter certification name"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="link"
          label="Certification Link"
          rules={[
            { type: 'url', message: 'Please enter a valid URL' },
          ]}
          tooltip="Optional link to certification details or verification page"
        >
          <Input
            placeholder="https://example.com/certification"
            size="large"
          />
        </Form.Item>
      </div>

      {/* Certification Image */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Certification Image</h3>
        
        <Form.Item
          name="certificationImage"
          label="Certification Logo/Image"
          tooltip="Certification logo or image (min: 150×150px)"
        >
          <ImageUpload
            value={form.getFieldValue('certificationImage')}
            onChange={(image) => {
              form.setFieldsValue({ certificationImage: image });
              form.validateFields(['certificationImage']);
            }}
            folder="certifications"
            dimensions={{ minWidth: 150, minHeight: 150 }}
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
            tooltip="Featured certifications are visible on the public website (must also be published)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            tooltip="Inactive certifications are hidden from all views"
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
            {isEdit ? 'Update Certification' : 'Create Certification'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default CertificationForm;

