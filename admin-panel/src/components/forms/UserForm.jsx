import { Form, Input, Select, Button, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { getRoleDisplayName, getRoleSlug } from '../../utils/roleHelpers';
import { useAuth } from '../../contexts/AuthContext';
import * as roleService from '../../services/roleService';
import { toast } from 'react-toastify';

const { Option } = Select;

/**
 * User Form Component
 * Reusable form for creating and editing users
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const UserForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    if (initialValues) {
      // If initialValues has role as object, convert to _id for form
      const formValues = { ...initialValues };
      if (formValues.role && typeof formValues.role === 'object' && formValues.role._id) {
        formValues.role = formValues.role._id;
      }
      form.setFieldsValue(formValues);
    }
  }, [initialValues, form]);

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const response = await roleService.getActiveRoles(true); // Include system roles
        if (response.success) {
          const rolesData = response.data.roles || response.data || [];
          let availableRoles = Array.isArray(rolesData) ? rolesData : [];
          
          // Filter roles based on current user's permissions
          // Super admin can assign any role
          // For now, show all active roles (can be enhanced with permission checks)
          if (currentUser?.role?.slug === 'super_admin' || currentUser?.role === 'super_admin') {
            setRoles(availableRoles);
          } else {
            // For non-super-admin, filter based on role level
            // This is a simplified version - can be enhanced
            setRoles(availableRoles.filter(role => role.isActive));
          }
        }
      } catch (error) {
        toast.error('Failed to fetch roles');
        console.error('Error fetching roles:', error);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [currentUser]);

  const handleSubmit = async (values) => {
    // Ensure role is sent as ObjectId (backend expects ObjectId or slug)
    await onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues}
    >
      <Form.Item
        name="firstName"
        label="First Name"
        rules={[
          { required: true, message: 'Please enter first name' },
          { min: 2, message: 'First name must be at least 2 characters' },
        ]}
      >
        <Input placeholder="Enter first name" size="large" />
      </Form.Item>

      <Form.Item
        name="lastName"
        label="Last Name"
        rules={[
          { required: true, message: 'Please enter last name' },
          { min: 2, message: 'Last name must be at least 2 characters' },
        ]}
      >
        <Input placeholder="Enter last name" size="large" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Please enter email' },
          { type: 'email', message: 'Please enter a valid email' },
        ]}
      >
        <Input placeholder="Enter email" size="large" disabled={isEdit} />
      </Form.Item>

      {!isEdit && (
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        >
          <Input.Password placeholder="Enter password" size="large" />
        </Form.Item>
      )}

      <Form.Item
        name="role"
        label="Role"
        rules={[{ required: true, message: 'Please select a role' }]}
      >
        <Select 
          placeholder={loadingRoles ? "Loading roles..." : "Select role"} 
          size="large" 
          disabled={isEdit && (currentUser?.role?.slug !== 'super_admin' && currentUser?.role !== 'super_admin')}
          loading={loadingRoles}
          notFoundContent={loadingRoles ? <Spin size="small" /> : "No roles available"}
        >
          {roles.map((role) => (
            <Option key={role._id} value={role._id}>
              {getRoleDisplayName(role)}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item className="mb-0">
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
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default UserForm;

