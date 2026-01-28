import { Form, Select, Checkbox, Button, Space } from 'antd';
import { useEffect } from 'react';
import { ACTIONS, ROLES } from '../../utils/constants';
import { formatRole } from '../../utils/roleHelpers';

const { Option } = Select;

/**
 * Single Permission Form Component
 * Form for creating or updating a single permission
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Array} props.resources - Available resources
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @returns {React.ReactNode}
 */
const SinglePermissionForm = ({
  initialValues = {},
  resources = [],
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async (values) => {
    await onSubmit(values);
  };

  const formatResourceName = (resource) => {
    return resource
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatActionName = (action) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={initialValues}>
      <Form.Item
        name="role"
        label="Role"
        rules={[{ required: true, message: 'Please select a role' }]}
      >
        <Select placeholder="Select role" size="large" disabled={!!initialValues._id}>
          {Object.values(ROLES).map((role) => (
            <Option key={role} value={role}>
              {formatRole(role)}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="resource"
        label="Resource"
        rules={[{ required: true, message: 'Please select a resource' }]}
      >
        <Select placeholder="Select resource" size="large" disabled={!!initialValues._id}>
          {resources.map((resource) => (
            <Option key={resource} value={resource}>
              {formatResourceName(resource)}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="actions"
        label="Actions"
        rules={[
          { required: true, message: 'Please select at least one action' },
          { type: 'array', min: 1, message: 'Please select at least one action' },
        ]}
      >
        <Checkbox.Group>
          <Space direction="vertical" size="small">
            {Object.values(ACTIONS).map((action) => (
              <Checkbox key={action} value={action} className="text-gray-700">
                {formatActionName(action)}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Form.Item>

      <Form.Item className="mb-0 mt-4" style={{ marginBottom: 0 }}>
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
            {initialValues._id ? 'Update Permission' : 'Create Permission'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default SinglePermissionForm;

