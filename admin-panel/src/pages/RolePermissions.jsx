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
  Empty
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SafetyOutlined, 
  MoreOutlined,
  UserOutlined,
  SettingOutlined,
  SaveOutlined
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import * as permissionService from '../services/permissionService';
import * as userService from '../services/userService';
import { formatRole, getRoleColor, getUserFullName } from '../utils/roleHelpers';
import { ACTIONS } from '../utils/constants';
import { toast } from 'react-toastify';

const RolePermissions = () => {
  const { roleName } = useParams();
  const navigate = useNavigate();
  const { hasRole } = usePermissions();
  
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

  // Fetch users in this role
  const fetchUsers = async () => {
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

  // Fetch user-specific permissions
  const fetchUserPermissions = async (userId) => {
    setLoadingPermissions(true);
    try {
      const response = await permissionService.getUserPermissionsById(userId);
      if (response.success) {
        const perms = response.data.permissions || {};
        const formData = {};
        
        // Convert permissions to form format
        Object.keys(perms).forEach((resource) => {
          const perm = perms[resource];
          if (perm && perm.actions && Array.isArray(perm.actions)) {
            perm.actions.forEach((action) => {
              formData[`${resource}_${action}`] = true;
            });
          }
        });
        
        setUserPermissions(formData);
        setInitialUserPermissions(JSON.parse(JSON.stringify(formData)));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load user permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    if (roleName) {
      fetchUsers();
      fetchResources();
    }
  }, [roleName]);

  // Check if permissions have changed
  useEffect(() => {
    const changed = JSON.stringify(userPermissions) !== JSON.stringify(initialUserPermissions);
    setHasChanges(changed);
  }, [userPermissions, initialUserPermissions]);

  // Handle open user permissions modal
  const handleManageUserPermissions = (user) => {
    setSelectedUser(user);
    setIsUserPermissionsModalOpen(true);
    fetchUserPermissions(user._id);
  };

  // Handle toggle change
  const handleToggle = (resource, action) => {
    const key = `${resource}_${action}`;
    setUserPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
            key: 'manage-permissions',
            label: 'Manage Permissions',
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
                {formatRole(roleName)} - Users
              </h1>
              <p className="text-gray-500 text-sm">
                Manage users in this role and their individual permissions
              </p>
            </div>
          </div>
        </div>

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
              <span>Manage Permissions: {selectedUser ? getUserFullName(selectedUser) : ''}</span>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                {resources.map((resource) => {
                  // Use slug as the key for permissions (backend expects slug/path/ObjectId)
                  const resourceSlug = typeof resource === 'object' ? resource.slug : resource;
                  const resourceName = typeof resource === 'object' ? resource.name || resource.slug : resource;
                  
                  return (
                    <Card
                      key={resourceSlug}
                      className="border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      title={
                        <div className="font-semibold text-gray-900 text-sm">
                          {formatResourceName(resource)}
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
