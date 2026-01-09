import { Form, Input, Select, Button } from 'antd';
import { useEffect } from 'react';
import { ROLES, ROLE_DISPLAY_NAMES } from '../../utils/constants';
import { getManageableRoles, formatRole } from '../../utils/roleHelpers';
import { useAuth } from '../../contexts/AuthContext';

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

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async (values) => {
    await onSubmit(values);
  };

  // Get roles that current user can manage
  const manageableRoles = currentUser
    ? getManageableRoles(currentUser.role)
    : Object.values(ROLES);

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
        <Select placeholder="Select role" size="large" disabled={isEdit && currentUser?.role !== 'super_admin'}>
          {manageableRoles.map((role) => (
            <Option key={role} value={role}>
              {formatRole(role)}
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

