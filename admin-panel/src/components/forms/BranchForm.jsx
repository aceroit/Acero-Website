import { Form, Input, Select, Button, Switch } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as referenceService from '../../services/referenceService';
import * as userService from '../../services/userService';
import ImageUpload from '../common/ImageUpload';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Branch Form Component
 * Reusable form for creating and editing branches
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const BranchForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const [countries, setCountries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState({
    countries: false,
    users: false,
  });

  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
        country: initialValues.country?._id || initialValues.country,
        manager: initialValues.manager?._id || initialValues.manager,
        featured: initialValues.featured !== undefined ? initialValues.featured : false,
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
        isHeadOffice: initialValues.isHeadOffice !== undefined ? initialValues.isHeadOffice : false,
        order: initialValues.order !== undefined ? initialValues.order : 0,
      };
      form.setFieldsValue(formValues);
    }
  }, [initialValues, form]);

  // Fetch all dropdown options
  useEffect(() => {
    fetchCountries();
    fetchUsers();
  }, []);

  const fetchCountries = async () => {
    setLoadingOptions(prev => ({ ...prev, countries: true }));
    try {
      const response = await referenceService.getCountries();
      if (response.success) {
        setCountries(response.data.countries || []);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      toast.error('Failed to load countries');
    } finally {
      setLoadingOptions(prev => ({ ...prev, countries: false }));
    }
  };

  const fetchUsers = async () => {
    setLoadingOptions(prev => ({ ...prev, users: true }));
    try {
      const response = await userService.getAllUsers({ isActive: true });
      if (response.success) {
        setUsers(response.data.users || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingOptions(prev => ({ ...prev, users: false }));
    }
  };

  const handleSubmit = async (values) => {
    const cleanedValues = {
      ...values,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      alternatePhone: values.alternatePhone?.trim() || null,
      address: values.address?.trim() || null,
      workingHours: values.workingHours?.trim() || null,
      manager: values.manager || null,
      featured: values.featured !== undefined ? values.featured : false,
      isActive: values.isActive !== undefined ? values.isActive : true,
      isHeadOffice: values.isHeadOffice !== undefined ? values.isHeadOffice : false,
      order: values.order !== undefined && values.order !== '' ? Number(values.order) : 0,
    };
    await onSubmit(cleanedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        isHeadOffice: false,
        featured: false,
        isActive: true,
        order: 0,
        ...initialValues,
      }}
    >
      {/* Basic Information */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <Form.Item
          name="branchName"
          label="Branch Name"
          rules={[
            { required: true, message: 'Please enter branch name' },
            { min: 2, message: 'Branch name must be at least 2 characters' },
            { max: 200, message: 'Branch name must not exceed 200 characters' },
          ]}
        >
          <Input
            placeholder="Enter branch name"
            size="large"
          />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: 'Please select country' }]}
          >
            <Select
              placeholder="Select country"
              size="large"
              loading={loadingOptions.countries}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={countries.map(c => ({
                value: c._id,
                label: `${c.name}${c.code ? ` (${c.code})` : ''}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="state"
            label="State"
            rules={[
              { required: true, message: 'Please enter state' },
              { min: 2, message: 'State must be at least 2 characters' },
            ]}
          >
            <Input
              placeholder="Enter state"
              size="large"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="city"
            label="City"
            rules={[
              { required: true, message: 'Please enter city' },
              { min: 2, message: 'City must be at least 2 characters' },
            ]}
          >
            <Input
              placeholder="Enter city"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="googleLink"
            label="Google Maps Link"
            rules={[
              { required: true, message: 'Please enter Google Maps link' },
              { type: 'url', message: 'Please enter a valid URL' },
            ]}
            tooltip="Full Google Maps URL for this branch location"
          >
            <Input
              placeholder="https://maps.google.com/..."
              size="large"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="address"
          label="Address"
          tooltip="Full street address (optional)"
        >
          <TextArea
            placeholder="Enter full address"
            size="large"
            rows={2}
          />
        </Form.Item>
      </div>

      {/* Contact Information */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Please enter a valid email address' },
            ]}
          >
            <Input
              placeholder="branch@example.com"
              size="large"
              type="email"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input
              placeholder="Enter phone number"
              size="large"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="alternatePhone"
            label="Alternate Phone"
          >
            <Input
              placeholder="Enter alternate phone number"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="workingHours"
            label="Working Hours"
            tooltip="e.g., 'Mon-Fri: 9AM-5PM'"
          >
            <Input
              placeholder="Enter working hours"
              size="large"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="manager"
          label="Branch Manager"
          tooltip="Select a user as the branch manager (optional)"
        >
          <Select
            placeholder="Select branch manager (optional)"
            size="large"
            allowClear
            loading={loadingOptions.users}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={users.map(u => ({
              value: u._id,
              label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            }))}
          />
        </Form.Item>
      </div>

      {/* Display Order */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Order</h3>
        <Form.Item
          name="order"
          label="Order"
          tooltip="Lower numbers appear first in lists. Used on the website and in the admin list."
          rules={[{ type: 'number', min: 0, message: 'Order must be 0 or greater' }]}
        >
          <Input type="number" min={0} placeholder="0" size="large" />
        </Form.Item>
      </div>

      {/* Status & Visibility */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Visibility</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Form.Item
            name="isHeadOffice"
            label="Head Office"
            valuePropName="checked"
            tooltip="Mark this branch as the head office"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="featured"
            label="Featured"
            valuePropName="checked"
            tooltip="Featured branches are visible on the public website (must also be published)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            tooltip="Inactive branches are hidden from all views"
          >
            <Switch />
          </Form.Item>
        </div>
      </div>

      {/* Logo */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo</h3>
        
        <Form.Item
          name="logo"
          label="Branch Logo"
          tooltip="Branch logo image (min: 1000×500px)"
        >
          <ImageUpload
            value={form.getFieldValue('logo')}
            onChange={(image) => {
              form.setFieldsValue({ logo: image });
              form.validateFields(['logo']);
            }}
            folder="branches/logos"
            dimensions={{ minWidth: 1000, minHeight: 500 }}
            maxSize={10}
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
            {isEdit ? 'Update Branch' : 'Create Branch'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default BranchForm;

