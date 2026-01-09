import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Switch, Button, Space, Spin, Breadcrumb } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SafetyOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import * as permissionService from '../services/permissionService';
import { formatRole } from '../utils/roleHelpers';
import { ACTIONS } from '../utils/constants';
import { toast } from 'react-toastify';

const RolePermissions = () => {
  const { roleName } = useParams();
  const navigate = useNavigate();
  const { hasRole } = usePermissions();
  
  const [resources, setResources] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialPermissions, setInitialPermissions] = useState({});

  // Fetch resources and current permissions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch resources
        const resourcesResponse = await permissionService.getResourcesAndActions();
        if (resourcesResponse.success) {
          setResources(resourcesResponse.data.resources || []);
        }

        // Fetch current role permissions
        const permissionsResponse = await permissionService.getRolePermissions(roleName);
        if (permissionsResponse.success) {
          const permsObj = permissionsResponse.data.permissions || {};
          const formData = {};
          
          Object.keys(permsObj).forEach((resource) => {
            const perm = permsObj[resource];
            if (perm && perm.actions && Array.isArray(perm.actions)) {
              perm.actions.forEach((action) => {
                formData[`${resource}_${action}`] = true;
              });
            }
          });
          
          setPermissions(formData);
          setInitialPermissions(JSON.parse(JSON.stringify(formData)));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error.response?.data?.message || 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };

    if (roleName) {
      fetchData();
    }
  }, [roleName]);

  // Check if permissions have changed
  useEffect(() => {
    const changed = JSON.stringify(permissions) !== JSON.stringify(initialPermissions);
    setHasChanges(changed);
  }, [permissions, initialPermissions]);

  // Handle toggle change
  const handleToggle = (resource, action) => {
    const key = `${resource}_${action}`;
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      // Transform permissions to API format
      const permissionsArray = [];
      
      Object.keys(permissions).forEach((key) => {
        if (key.includes('_') && permissions[key]) {
          const lastUnderscoreIndex = key.lastIndexOf('_');
          const resource = key.substring(0, lastUnderscoreIndex);
          const action = key.substring(lastUnderscoreIndex + 1);
          
          const validActions = Object.values(ACTIONS);
          if (validActions.includes(action)) {
            let permEntry = permissionsArray.find((p) => p.resource === resource);
            if (!permEntry) {
              permEntry = {
                resource,
                actions: [],
                conditions: {},
                isActive: true,
              };
              permissionsArray.push(permEntry);
            }
            permEntry.actions.push(action);
          }
        }
      });

      const response = await permissionService.updateRolePermissions(
        roleName,
        permissionsArray
      );
      
      if (response.success) {
        toast.success('Permissions updated successfully');
        setInitialPermissions(JSON.parse(JSON.stringify(permissions)));
        setHasChanges(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-0">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item>
            <a onClick={() => navigate('/permissions')} className="cursor-pointer">
              Permissions
            </a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{formatRole(roleName)}</Breadcrumb.Item>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/permissions')}
              className="flex items-center"
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <SafetyOutlined className="text-gray-800" />
                Edit Permissions: {formatRole(roleName)}
              </h1>
              <p className="text-gray-500 text-sm">
                Toggle permissions for each resource and action
              </p>
            </div>
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            className="shadow-lg hover:shadow-xl transition-all"
            style={{
              backgroundColor: hasChanges ? '#1f2937' : '#9ca3af',
              borderColor: hasChanges ? '#1f2937' : '#9ca3af',
              fontWeight: '600',
            }}
          >
            Save Changes
          </Button>
        </div>

        {/* Permissions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <Card
              key={resource}
              className="border border-gray-200 shadow-md hover:shadow-lg transition-all"
              title={
                <div className="font-semibold text-gray-900">
                  {formatResourceName(resource)}
                </div>
              }
              bodyStyle={{ padding: '16px' }}
            >
              <Space direction="vertical" size="middle" className="w-full">
                {Object.values(ACTIONS).map((action) => {
                  const key = `${resource}_${action}`;
                  const isEnabled = permissions[key] || false;
                  
                  return (
                    <div
                      key={action}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-700 font-medium">
                        {formatActionName(action)}
                      </span>
                      <Switch
                        checked={isEnabled}
                        onChange={() => handleToggle(resource, action)}
                        checkedChildren="ON"
                        unCheckedChildren="OFF"
                        className="ml-2"
                      />
                    </div>
                  );
                })}
              </Space>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {resources.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-gray-500">No resources available</p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default RolePermissions;

