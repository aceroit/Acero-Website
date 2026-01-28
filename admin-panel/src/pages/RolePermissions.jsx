import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Space, 
  Spin, 
  Breadcrumb, 
  Table, 
  Tag, 
  Dropdown, 
  Modal,
  Switch,
  Empty,
  Badge,
  Descriptions
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SafetyOutlined, 
  MoreOutlined,
  UserOutlined,
  SettingOutlined,
  SaveOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import * as permissionService from '../services/permissionService';
import * as roleService from '../services/roleService';
import { formatRole, getRoleColor, getUserFullName } from '../utils/roleHelpers';
import { ACTIONS } from '../utils/constants';
import { toast } from 'react-toastify';

const RolePermissions = () => {
  const { roleName } = useParams(); // Can be ObjectId or slug
  const navigate = useNavigate();
  const { hasRole } = usePermissions();
  
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserPermissionsModalOpen, setIsUserPermissionsModalOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});
  const [resources, setResources] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialUserPermissions, setInitialUserPermissions] = useState({});

  // Fetch role details
  const fetchRole = async () => {
    if (!roleName) return;
    
    setLoadingRole(true);
    try {
      // Try to fetch by ID first, then by slug
      let response;
      try {
        response = await roleService.getRoleById(roleName);
      } catch (error) {
        // If ID fails, try slug
        response = await roleService.getRoleBySlug(roleName);
      }
      
      if (response.success) {
        setRole(response.data.role || response.data);
      } else {
        toast.error('Role not found');
        navigate('/permissions');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch role');
      navigate('/permissions');
    } finally {
      setLoadingRole(false);
    }
  };

  // Fetch users in this role
  const fetchUsers = async () => {
    if (!roleName) return;
    
    setLoading(true);
    try {
      const response = await permissionService.getUsersByRole(roleName);
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch resources and actions
  const fetchResources = async () => {
    try {
      const response = await permissionService.getResourcesAndActions();
      if (response.success) {
        setResources(response.data.resources || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch resources');
    }
  };

  // Build form data from permissions object (resourceSlug_action -> boolean)
  const permissionsToFormData = (perms, resourcesList) => {
    const formData = {};
    if (!perms || typeof perms !== 'object') return formData;
    const resourceMap = {};
    (resourcesList || resources).forEach((r) => {
      const slug = typeof r === 'object' ? r.slug : r;
      if (r && typeof r === 'object' && r._id) resourceMap[r._id.toString()] = slug;
      if (slug) resourceMap[slug] = slug;
    });
    Object.keys(perms).forEach((resourceKey) => {
      const perm = perms[resourceKey];
      if (!perm || !perm.actions || !Array.isArray(perm.actions)) return;
      const slug = resourceMap[resourceKey] || (perm.resource && (typeof perm.resource === 'object' ? perm.resource.slug : perm.resource)) || resourceKey;
      perm.actions.forEach((action) => {
        formData[`${slug}_${action}`] = true;
      });
    });
    return formData;
  };

  // Fetch role permissions + user permissions, then merge: role perms as base (all on), user perms override
  const fetchUserPermissionsWithRoleBase = async (userId, resourcesList) => {
    if (!role) return;
    const list = resourcesList || resources;
    if (!list.length) return;
    setLoadingPermissions(true);
    try {
      const [roleRes, userRes] = await Promise.all([
        permissionService.getRolePermissions(role._id || role.slug || roleName),
        permissionService.getUserPermissionsById(userId),
      ]);
      const rolePerms = roleRes?.data?.permissions || roleRes?.permissions || {};
      const userPerms = userRes?.data?.permissions || userRes?.permissions || {};
      const roleForm = permissionsToFormData(rolePerms, list);
      const userForm = permissionsToFormData(userPerms, list);
      // Base = all role permissions toggled on; then overlay user-specific overrides
      const merged = { ...roleForm };
      Object.keys(userForm).forEach((k) => { merged[k] = userForm[k]; });
      // Ensure every resource+action has a value: missing -> use role or true for role perm
      list.forEach((r) => {
        const slug = typeof r === 'object' ? r.slug : r;
        Object.values(ACTIONS).forEach((action) => {
          const key = `${slug}_${action}`;
          if (merged[key] === undefined) merged[key] = !!roleForm[key];
        });
      });
      setUserPermissions(merged);
      setInitialUserPermissions(JSON.parse(JSON.stringify(merged)));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load user permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    if (roleName) {
      fetchRole();
      fetchUsers();
      fetchResources();
    }
  }, [roleName]);

  // Check if permissions have changed
  useEffect(() => {
    const changed = JSON.stringify(userPermissions) !== JSON.stringify(initialUserPermissions);
    setHasChanges(changed);
  }, [userPermissions, initialUserPermissions]);

  // Handle open user permissions modal: pre-fill with role permissions (all on), then user overrides
  const handleManageUserPermissions = async (user) => {
    setSelectedUser(user);
    setIsUserPermissionsModalOpen(true);
    let list = resources;
    if (!list.length) {
      const res = await permissionService.getResourcesAndActions();
      if (res.success && (res.data?.resources || []).length) {
        list = res.data.resources || [];
        setResources(list);
      }
    }
    if (list.length) await fetchUserPermissionsWithRoleBase(user._id, list);
  };

  // Handle toggle change
  const handleToggle = (resource, action) => {
    const key = `${resource}_${action}`;
    setUserPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all permissions on (all resources, all actions)
  const handleToggleAllOn = () => {
    const next = {};
    resources.forEach((r) => {
      const slug = typeof r === 'object' ? r.slug : r;
      Object.values(ACTIONS).forEach((action) => {
        next[`${slug}_${action}`] = true;
      });
    });
    setUserPermissions(next);
  };

  // Toggle all actions on for one resource
  const handleToggleResourceOn = (resourceSlug) => {
    const next = { ...userPermissions };
    const allOn = Object.values(ACTIONS).every((action) => next[`${resourceSlug}_${action}`]);
    Object.values(ACTIONS).forEach((action) => {
      next[`${resourceSlug}_${action}`] = !allOn;
    });
    setUserPermissions(next);
  };

  // Handle save user permissions
  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;
    
    setSavingPermissions(true);
    try {
      // Transform permissions to API format
      const permissionsArray = [];
      
      Object.keys(userPermissions).forEach((key) => {
        if (key.includes('_') && userPermissions[key]) {
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

      const response = await permissionService.updateUserPermissions(
        selectedUser._id,
        permissionsArray
      );
      
      if (response.success) {
        toast.success('User permissions updated successfully');
        setInitialUserPermissions(JSON.parse(JSON.stringify(userPermissions)));
        setHasChanges(false);
        setIsUserPermissionsModalOpen(false);
        setSelectedUser(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const formatResourceName = (resource) => {
    if (typeof resource === 'object' && resource.name) {
      return resource.name;
    }
    return String(resource)
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatActionName = (action) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  // Table columns for users
  const userColumns = [
    {
      title: 'User',
      key: 'user',
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-semibold">
            {getUserFullName(record).charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{getUserFullName(record)}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive !== false ? 'green' : 'red'}>
          {isActive !== false ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'manage-user-permission',
            label: 'Manage User Permission',
            icon: <SettingOutlined />,
            onClick: () => handleManageUserPermissions(record),
          },
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="hover:bg-gray-100"
            />
          </Dropdown>
        );
      },
    },
  ];

  // Get role display name
  const getRoleDisplayName = () => {
    if (role) {
      return role.name || formatRole(role.slug || roleName);
    }
    return formatRole(roleName);
  };

  // Get role display color
  const getRoleDisplayColor = () => {
    if (role && role.color && role.color !== 'default') {
      return role.color;
    }
    return getRoleColor(role?.slug || roleName);
  };

  if (loadingRole || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (!role) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Empty description="Role not found" />
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
          <Breadcrumb.Item>{getRoleDisplayName()}</Breadcrumb.Item>
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
                {getRoleDisplayName()} - Users
              </h1>
              <p className="text-gray-500 text-sm">
                Manage users in this role and their individual permissions
              </p>
            </div>
          </div>
        </div>

        {/* Role Information Card */}
        <Card 
          className="border border-gray-200 shadow-md bg-white mb-6"
          title={
            <div className="flex items-center gap-2">
              <InfoCircleOutlined className="text-gray-800" />
              <span className="text-lg font-semibold text-gray-900">Role Information</span>
            </div>
          }
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
            <Descriptions.Item label="Name">
              <span className="font-semibold">{role.name}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Slug">
              <Tag color={getRoleDisplayColor()}>{role.slug}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Level">
              <Tag color="blue">{role.level || 0}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={role.isActive ? 'green' : 'default'}>
                {role.isActive ? 'Active' : 'Inactive'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {role.isSystem ? (
                <Badge count="System" style={{ backgroundColor: '#fa8c16' }} />
              ) : (
                <Tag color="default">Custom</Tag>
              )}
            </Descriptions.Item>
            {role.description && (
              <Descriptions.Item label="Description" span={3}>
                {role.description}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Users Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          title={
            <div className="flex items-center gap-2">
              <UserOutlined className="text-gray-800" />
              <span className="text-lg font-semibold text-gray-900">
                Users ({users.length})
              </span>
            </div>
          }
        >
          {users.length === 0 ? (
            <Empty 
              description="No users found in this role"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="_id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} users`,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
            />
          )}
        </Card>

        {/* User Permissions Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <SettingOutlined />
              <span>Manage User Permission: {selectedUser ? getUserFullName(selectedUser) : ''}</span>
            </div>
          }
          open={isUserPermissionsModalOpen}
          onCancel={() => {
            setIsUserPermissionsModalOpen(false);
            setSelectedUser(null);
            setUserPermissions({});
            setInitialUserPermissions({});
            setHasChanges(false);
          }}
          width={900}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setIsUserPermissionsModalOpen(false);
                setSelectedUser(null);
                setUserPermissions({});
                setInitialUserPermissions({});
                setHasChanges(false);
              }}
            >
              Cancel
            </Button>,
            <Button
              key="save"
              type="primary"
              icon={<SaveOutlined />}
              loading={savingPermissions}
              disabled={!hasChanges}
              onClick={handleSaveUserPermissions}
              style={{
                backgroundColor: hasChanges ? '#1f2937' : '#9ca3af',
                borderColor: hasChanges ? '#1f2937' : '#9ca3af',
              }}
            >
              Save Changes
            </Button>,
          ]}
        >
          {loadingPermissions ? (
            <div className="flex justify-center py-8">
              <Spin size="large" />
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> User-specific permissions override role permissions. 
                  These settings will take precedence over the role's default permissions.
                </p>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <Button
                  type="default"
                  onClick={handleToggleAllOn}
                  className="text-gray-700"
                >
                  Toggle all ON (all resources)
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                {resources.map((resource) => {
                  // Use slug as the key for permissions (backend expects slug/path/ObjectId)
                  const resourceSlug = typeof resource === 'object' ? resource.slug : resource;
                  const resourceName = typeof resource === 'object' ? resource.name || resource.slug : resource;
                  const allOnForResource = Object.values(ACTIONS).every(
                    (action) => userPermissions[`${resourceSlug}_${action}`]
                  );
                  
                  return (
                    <Card
                      key={resourceSlug}
                      className="border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      title={
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span className="font-semibold text-gray-900 text-sm truncate">
                            {formatResourceName(resource)}
                          </span>
                          <Button
                            type="link"
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleToggleResourceOn(resourceSlug); }}
                            className="shrink-0 p-0 h-auto text-xs"
                          >
                            {allOnForResource ? 'All OFF' : 'All ON'}
                          </Button>
                        </div>
                      }
                      bodyStyle={{ padding: '12px' }}
                      size="small"
                    >
                      <Space direction="vertical" size="small" className="w-full">
                        {Object.values(ACTIONS).map((action) => {
                          const key = `${resourceSlug}_${action}`;
                          const isEnabled = userPermissions[key] || false;
                          
                          return (
                            <div
                              key={action}
                              className="flex items-center justify-between p-1 rounded hover:bg-gray-50 transition-colors"
                            >
                              <span className="text-gray-700 text-sm">
                                {formatActionName(action)}
                              </span>
                              <Switch
                                checked={isEnabled}
                                onChange={() => handleToggle(resourceSlug, action)}
                                size="small"
                                checkedChildren="ON"
                                unCheckedChildren="OFF"
                              />
                            </div>
                          );
                        })}
                      </Space>
                    </Card>
                  );
                })}
              </div>

              {resources.length === 0 && (
                <div className="text-center py-8">
                  <Empty 
                    description="No resources available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};

export default RolePermissions;
