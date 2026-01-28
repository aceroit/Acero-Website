import { Form, Input, Select, Button, Switch } from 'antd';
import { useEffect, useState } from 'react';
import * as referenceService from '../../services/referenceService';
import * as regionService from '../../services/regionService';
import { toast } from 'react-toastify';

/**
 * Area Form Component
 * Reusable form for creating and editing areas
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const AreaForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
        region: initialValues.region?._id || initialValues.region,
        country: initialValues.region?.country?._id || initialValues.region?.country || null,
        code: initialValues.code?.toUpperCase() || '',
        featured: initialValues.featured !== undefined ? initialValues.featured : false,
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
      };
      form.setFieldsValue(formValues);
      if (formValues.country) {
        setSelectedCountry(formValues.country);
        fetchRegions(formValues.country);
      }
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

  // Fetch regions (optionally filtered by country)
  const fetchRegions = async (countryId = null) => {
    setLoadingRegions(true);
    try {
      let response;
      if (countryId) {
        // Fetch regions by country
        response = await regionService.getAllRegions({ country: countryId, isActive: true });
      } else {
        // Fetch all regions
        response = await regionService.getAllRegions({ isActive: true });
      }
      
      if (response.success) {
        setRegions(response.data.regions || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      toast.error('Failed to load regions');
    } finally {
      setLoadingRegions(false);
    }
  };

  // Load all regions on mount (if no country selected)
  useEffect(() => {
    if (!selectedCountry) {
      fetchRegions();
    }
  }, []);

  // Handle country change - filter regions
  const handleCountryChange = (countryId) => {
    setSelectedCountry(countryId);
    form.setFieldsValue({ region: undefined }); // Clear region selection
    fetchRegions(countryId);
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
    // Remove country from submission (it's only for filtering)
    delete cleanedValues.country;
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="country"
            label="Country (Filter)"
            tooltip="Select a country to filter regions (optional)"
          >
            <Select
              placeholder="Select country to filter regions"
              size="large"
              loading={loadingCountries}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={handleCountryChange}
              options={countries.map(country => ({
                value: country._id,
                label: `${country.name} (${country.code})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="region"
            label="Region"
            rules={[{ required: true, message: 'Please select region' }]}
            tooltip="Region this area belongs to"
          >
            <Select
              placeholder="Select region"
              size="large"
              loading={loadingRegions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={regions.map(region => ({
                value: region._id,
                label: `${region.name} (${region.code})${region.country ? ` - ${region.country.name}` : ''}`,
              }))}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="Area Name"
            rules={[
              { required: true, message: 'Please enter area name' },
              { min: 2, message: 'Name must be at least 2 characters' },
              { max: 100, message: 'Name must not exceed 100 characters' },
            ]}
            tooltip="Name of the area"
          >
            <Input
              placeholder="Enter area name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Area Code"
            rules={[
              { required: true, message: 'Please enter area code' },
              { min: 2, message: 'Code must be at least 2 characters' },
              {
                pattern: /^[A-Z0-9]+$/,
                message: 'Code must contain only uppercase letters and numbers'
              },
            ]}
            tooltip="Unique code for the area within the region"
          >
            <Input
              placeholder="e.g., NYC, LAX, LON"
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
            tooltip="Featured areas are visible on the public website (must also be published)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            tooltip="Inactive areas are hidden from all views"
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
            {isEdit ? 'Update Area' : 'Create Area'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default AreaForm;

