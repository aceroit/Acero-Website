import { Form, Switch, Button, Space } from 'antd';
import { useEffect } from 'react';
import { ACTIONS } from '../../utils/constants';

/**
 * Permission Form Component
 * Form for updating role permissions using toggle switches
 * 
 * @param {Object} props
 * @param {string} props.role - Role name
 * @param {Array} props.resources - Available resources
 * @param {Object} props.initialPermissions - Initial permissions object
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @returns {React.ReactNode}
 */
const PermissionForm = ({
  role,
  resources = [],
  initialPermissions = {},
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    // Reset form first
    form.resetFields();
    
    // Then set values if permissions exist
    if (initialPermissions && Object.keys(initialPermissions).length > 0) {
      // Use setTimeout to ensure form is ready after render
      const timer = setTimeout(() => {
        form.setFieldsValue(initialPermissions);
        // Force form to update
        form.validateFields().catch(() => {});
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [initialPermissions, role, form]);

  const handleSubmit = async (values) => {
    // Transform form values to permissions array format
    const permissions = [];
    
    Object.keys(values).forEach((key) => {
      if (key.includes('_') && values[key]) {
        // Split by last underscore to handle resources with underscores (e.g., 'section_types')
        // Format: 'resource_action' or 'resource_with_underscores_action'
        const lastUnderscoreIndex = key.lastIndexOf('_');
        const resource = key.substring(0, lastUnderscoreIndex);
        const action = key.substring(lastUnderscoreIndex + 1);
        
        // Validate action is one of the valid actions
        const validActions = Object.values(ACTIONS);
        if (validActions.includes(action)) {
          // Find or create permission entry for this resource
          let permEntry = permissions.find((p) => p.resource === resource);
          if (!permEntry) {
            permEntry = {
              resource,
              actions: [],
              conditions: {},
              isActive: true,
            };
            permissions.push(permEntry);
          }
          permEntry.actions.push(action);
        }
      }
    });

    await onSubmit(permissions);
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
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={initialPermissions}>
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading permissions...</div>
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((resource) => (
              <div 
                key={resource} 
                className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <h4 className="font-semibold text-gray-900 mb-3 text-sm border-b border-gray-200 pb-2">
                  {formatResourceName(resource)}
                </h4>
                <Space direction="vertical" size="middle" className="w-full">
                  {Object.values(ACTIONS).map((action) => {
                    const fieldName = `${resource}_${action}`;
                    return (
                      <Form.Item
                        key={fieldName}
                        name={fieldName}
                        valuePropName="checked"
                        className="mb-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 text-sm font-medium">
                            {formatActionName(action)}
                          </span>
                          <Switch
                            checkedChildren="ON"
                            unCheckedChildren="OFF"
                            className="ml-2"
                          />
                        </div>
                      </Form.Item>
                    );
                  })}
                </Space>
              </div>
            ))}
          </div>
        </div>
      )}

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
            Save Permissions
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default PermissionForm;
