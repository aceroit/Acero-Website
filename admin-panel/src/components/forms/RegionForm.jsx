import { Form, Input, Select, Button, Switch } from 'antd';
import { useEffect, useState } from 'react';
import * as referenceService from '../../services/referenceService';
import { toast } from 'react-toastify';

/**
 * Region Form Component
 * Reusable form for creating and editing regions
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const RegionForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
        country: initialValues.country?._id || initialValues.country,
        code: initialValues.code?.toUpperCase() || '',
        featured: initialValues.featured !== undefined ? initialValues.featured : false,
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
      };
      form.setFieldsValue(formValues);
    }
  }, [initialValues, form]);

  // Fetch countries
  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await referenceService.getCountries();
      if (response.success) {
        setCountries(response.data.countries || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      toast.error('Failed to load countries');
    } finally {
      setLoadingCountries(false);
    }
  };

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
          name="country"
          label="Country"
          rules={[{ required: true, message: 'Please select country' }]}
        >
          <Select
            placeholder="Select country"
            size="large"
            loading={loadingCountries}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={countries.map(country => ({
              value: country._id,
              label: `${country.name} (${country.code})`,
            }))}
          />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="Region Name"
            rules={[
              { required: true, message: 'Please enter region name' },
              { min: 2, message: 'Name must be at least 2 characters' },
              { max: 100, message: 'Name must not exceed 100 characters' },
            ]}
            tooltip="Name of the region"
          >
            <Input
              placeholder="Enter region name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Region Code"
            rules={[
              { required: true, message: 'Please enter region code' },
              { min: 2, message: 'Code must be at least 2 characters' },
              {
                pattern: /^[A-Z0-9]+$/,
                message: 'Code must contain only uppercase letters and numbers'
              },
            ]}
            tooltip="Unique code for the region within the country"
          >
            <Input
              placeholder="e.g., CA, NY, TX"
              size="large"
              onChange={handleCodeChange}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
        </div>
      </div>

      {/* Status & Visibility */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Visibility</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="featured"
            label="Featured"
            valuePropName="checked"
            tooltip="Featured regions are visible on the public website (must also be published)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            tooltip="Inactive regions are hidden from all views"
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
            {isEdit ? 'Update Region' : 'Create Region'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default RegionForm;

