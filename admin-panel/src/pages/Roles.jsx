import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Input, 
  Card, 
  Tag, 
  Space, 
  Dropdown, 
  Modal,
  Badge,
  Statistic,
  Row,
  Col,
  Tooltip,
  Switch,
  Spin,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
  SafetyOutlined,
  UserOutlined,
  LockOutlined,
  EyeOutlined,
  SettingOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import RoleForm from '../components/forms/RoleForm';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import { ROLES, ACTIONS } from '../utils/constants';
import * as roleService from '../services/roleService';
import * as permissionService from '../services/permissionService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;

const Roles = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [roleUsage, setRoleUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [isRolePermissionsModalOpen, setIsRolePermissionsModalOpen] = useState(false);
  const [rolePermissions, setRolePermissions] = useState({});
  const [resources, setResources] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialRolePermissions, setInitialRolePermissions] = useState({});

  // Check if user is super admin
  const isSuperAdmin = hasRole(ROLES.SUPER_ADMIN);

  // Fetch roles
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await roleService.getAllRoles({ includeInactive: true });
      if (response.success) {
        const rolesData = response.data.roles || response.data || [];
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  // Fetch role usage statistics
  const fetchRoleUsage = async (roleId) => {
    if (!roleId) return;
    
    setLoadingUsage(true);
    try {
      const response = await roleService.getRoleUsage(roleId);
      if (response.success) {
        setRoleUsage(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch role usage:', error);
      setRoleUsage(null);
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      toast.error('Access denied. Super Admin only.');
      navigate('/dashboard');
      return;
    }
    fetchRoles();
  }, [isSuperAdmin, navigate]);

  // Handle create role
  const handleCreate = async (values) => {
    try {
      const response = await roleService.createRole(values);
      if (response.success) {
        toast.success('Role created successfully');
        setIsCreateModalOpen(false);
        fetchRoles();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create role');
      throw error;
    }
  };

  // Handle update role
  const handleUpdate = async (values) => {
    if (!selectedRole) return;
    
    try {
      const response = await roleService.updateRole(selectedRole._id, values);
      if (response.success) {
        toast.success('Role updated successfully');
        setIsEditModalOpen(false);
        setSelectedRole(null);
        fetchRoles();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
      throw error;
    }
  };

  // Handle delete role
  const handleDelete = async () => {
    if (!selectedRole) return;
    
    try {
      const response = await roleService.deleteRole(selectedRole._id);
      if (response.success) {
        toast.success('Role deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedRole(null);
        setRoleUsage(null);
        fetchRoles();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  // Handle delete button click - fetch usage first
  const handleDeleteClick = async (role) => {
    setSelectedRole(role);
    await fetchRoleUsage(role._id);
    setIsDeleteModalOpen(true);
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Handle view permissions
  const handleViewPermissions = (role) => {
    navigate(`/permissions/role/${role._id}`);
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

  // Fetch role permissions
  const fetchRolePermissions = async (role, resourcesList) => {
    if (!role) return;
    
    setLoadingPermissions(true);
    try {
      // Use role._id or role.slug
      const roleIdentifier = role._id || role.slug;
      const response = await permissionService.getRolePermissions(roleIdentifier);
      
      if (response.success) {
        const perms = response.data.permissions || {};
        const formData = {};
        
        // Use the resources list passed as parameter (or state if not provided)
        const resourcesToUse = resourcesList || resources;
        
        // Create a map of resource identifiers to resource slugs
        // The backend returns resource keys as ObjectId strings, slugs, or paths
        const resourceMap = {};
        resourcesToUse.forEach((resource) => {
          const resourceObj = typeof resource === 'object' ? resource : null;
          if (resourceObj) {
            // Map all possible identifiers to the slug
            if (resourceObj._id) {
              resourceMap[resourceObj._id.toString()] = resourceObj.slug;
            }
            if (resourceObj.slug) {
              resourceMap[resourceObj.slug] = resourceObj.slug;
            }
            if (resourceObj.path) {
              resourceMap[resourceObj.path] = resourceObj.slug;
            }
          } else {
            // If resource is a string, use it as both key and value
            resourceMap[resource] = resource;
          }
        });
        
        // Convert permissions to form format
        Object.keys(perms).forEach((resourceKey) => {
          const perm = perms[resourceKey];
          if (perm && perm.actions && Array.isArray(perm.actions)) {
            // Find the matching resource slug
            // Try direct match first
            let resourceSlug = resourceMap[resourceKey];
            
            // If not found, try to match by resource object
            if (!resourceSlug && perm.resource) {
              const resourceObj = perm.resource;
              if (typeof resourceObj === 'object') {
                // Try matching by _id, slug, or path
                if (resourceObj._id) {
                  resourceSlug = resourceMap[resourceObj._id.toString()] || resourceObj.slug;
                } else if (resourceObj.slug) {
                  resourceSlug = resourceObj.slug;
                } else if (resourceObj.path) {
                  resourceSlug = resourceMap[resourceObj.path] || resourceObj.path;
                }
              } else {
                resourceSlug = resourceMap[resourceObj] || resourceObj;
              }
            }
            
            // If still not found, use the resourceKey as fallback
            if (!resourceSlug) {
              resourceSlug = resourceKey;
            }
            
            // Set permissions using the resource slug
            perm.actions.forEach((action) => {
              formData[`${resourceSlug}_${action}`] = true;
            });
          }
        });
        
        setRolePermissions(formData);
        setInitialRolePermissions(JSON.parse(JSON.stringify(formData)));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load role permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Handle open role permissions modal
  const handleManageRolePermissions = async (role) => {
    setSelectedRole(role);
    setIsRolePermissionsModalOpen(true);
    // Fetch resources first, then permissions (permissions needs resources for mapping)
    const resourcesResponse = await permissionService.getResourcesAndActions();
    if (resourcesResponse.success) {
      const resourcesList = resourcesResponse.data.resources || [];
      setResources(resourcesList);
      // Now fetch permissions with the resources list
      await fetchRolePermissions(role, resourcesList);
    }
  };

  // Handle toggle change
  const handlePermissionToggle = (resource, action) => {
    const key = `${resource}_${action}`;
    setRolePermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all permissions on (all resources, all actions) — for Manage role Permission modal
  const handleToggleAllOnRole = () => {
    const next = {};
    resources.forEach((r) => {
      const slug = typeof r === 'object' ? r.slug : r;
      Object.values(ACTIONS).forEach((action) => {
        next[`${slug}_${action}`] = true;
      });
    });
    setRolePermissions(next);
  };

  // Toggle all actions on/off for one resource — for Manage role Permission modal
  const handleToggleResourceOnRole = (resourceSlug) => {
    const next = { ...rolePermissions };
    const allOn = Object.values(ACTIONS).every((action) => next[`${resourceSlug}_${action}`]);
    Object.values(ACTIONS).forEach((action) => {
      next[`${resourceSlug}_${action}`] = !allOn;
    });
    setRolePermissions(next);
  };

  // Check if permissions have changed
  useEffect(() => {
    const changed = JSON.stringify(rolePermissions) !== JSON.stringify(initialRolePermissions);
    setHasChanges(changed);
  }, [rolePermissions, initialRolePermissions]);

  // Handle save role permissions
  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    
    setSavingPermissions(true);
    try {
      // Transform permissions to API format
      const permissionsArray = [];
      
      Object.keys(rolePermissions).forEach((key) => {
        if (key.includes('_') && rolePermissions[key]) {
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

      const roleIdentifier = selectedRole._id || selectedRole.slug;
      const response = await permissionService.updateRolePermissions(
        roleIdentifier,
        permissionsArray
      );
      
      if (response.success) {
        toast.success('Role permissions updated successfully');
        setInitialRolePermissions(JSON.parse(JSON.stringify(rolePermissions)));
        setHasChanges(false);
        setIsRolePermissionsModalOpen(false);
        setSelectedRole(null);
        // Refresh roles list to update any permission counts
        fetchRoles();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role permissions');
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

  // Filter roles based on search
  const filteredRoles = roles.filter((role) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      role.name?.toLowerCase().includes(searchLower) ||
      role.slug?.toLowerCase().includes(searchLower) ||
      role.description?.toLowerCase().includes(searchLower)
    );
  });

  // Get role color name for display
  const getRoleColor = (color) => {
    // Return the color name as-is, or 'default' if not provided
    return color || 'default';
  };

  // Table columns
  const columns = [
    {
      title: 'Role',
      key: 'role',
      width: 200,
      fixed: 'left',
      render: (_, record) => {
        const roleColorName = getRoleColor(record.color);
        const colorMap = {
          red: '#ef4444',
          blue: '#3b82f6',
          purple: '#a855f7',
          orange: '#f97316',
          green: '#22c55e',
          cyan: '#06b6d4',
          magenta: '#ec4899',
          gold: '#f59e0b',
          lime: '#84cc16',
          default: '#6b7280'
        };
        
        return (
          <div className="flex items-center gap-2 md:gap-3">
            <div 
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: colorMap[roleColorName] || colorMap.default }}
            >
              <SafetyOutlined className="text-xs md:text-base" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-xs md:text-sm lg:text-base truncate">{record.name}</span>
                {record.isSystem && (
                  <Tag color="orange" className="text-xs flex-shrink-0">System</Tag>
                )}
                {!record.isActive && (
                  <Tag color="default" className="text-xs flex-shrink-0">Inactive</Tag>
                )}
              </div>
              <span className="text-xs text-gray-500 font-mono truncate">{record.slug}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      responsive: ['md'],
      ellipsis: true,
      render: (description) => (
        <span className="text-gray-700 text-sm md:text-base">
          {description || <span className="text-gray-400">—</span>}
        </span>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      responsive: ['lg'],
      render: (level) => (
        <Tag color="blue" className="px-2 md:px-3 py-1 text-xs md:text-sm">
          {level || 0}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 90,
      render: (_, record) => (
        <Tag 
          color={record.isActive ? 'green' : 'default'}
          className="px-2 md:px-3 py-1 font-semibold text-xs md:text-sm"
        >
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      responsive: ['lg'],
      render: (date) => (
        <span className="text-gray-600 text-xs md:text-sm">
          {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
        </span>
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
            key: 'view-role-users',
            label: 'View role specific users',
            icon: <UserOutlined />,
            onClick: () => handleViewPermissions(record),
          },
          {
            key: 'manage-role-permission',
            label: 'Manage role Permission',
            icon: <SettingOutlined />,
            onClick: () => handleManageRolePermissions(record),
          },
          {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            onClick: () => {
              setSelectedRole(record);
              setIsEditModalOpen(true);
            },
            disabled: record.isSystem, // System roles can't be edited (slug protection)
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDeleteClick(record),
            disabled: record.isSystem, // System roles can't be deleted
          },
        ].filter(item => !item.disabled || record.isSystem); // Show edit/delete for non-system roles

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

  if (!isSuperAdmin) {
    return null; // Access denied, will redirect
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Roles Management
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage user roles and their permissions
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-white w-full md:w-auto"
            style={{
              backgroundColor: '#1f2937',
              borderColor: '#1f2937',
              height: '44px',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            <span className="hidden sm:inline">Create Role</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        {/* Search Section */}
        <div className="mb-6 md:mb-8">
          <Search
            placeholder="Search roles by name, slug, or description..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full md:max-w-md"
          />
        </div>

        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={filteredRoles}
              rowKey="_id"
              loading={loading}
              scroll={{ x: 'max-content' }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} roles`,
                responsive: true,
                showQuickJumper: false,
                size: 'default',
              }}
              size="small"
              className="custom-table"
            />
          </div>
        </Card>

        {/* Create Modal */}
        <Modal
          title="Create Role"
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
          width="90%"
          style={{ maxWidth: 600 }}
        >
          <RoleForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            isEdit={false}
          />
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="Edit Role"
          open={isEditModalOpen}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedRole(null);
          }}
          footer={null}
          width="90%"
          style={{ maxWidth: 600 }}
        >
          {selectedRole && (
            <RoleForm
              initialValues={selectedRole}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedRole(null);
              }}
              isEdit={true}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={isDeleteModalOpen}
          title="Delete Role"
          onOk={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedRole(null);
            setRoleUsage(null);
          }}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: loadingUsage }}
          cancelButtonProps={{ disabled: loadingUsage }}
          width="90%"
          style={{ maxWidth: 600 }}
        >
          {selectedRole && (
            <div>
              <p className="mb-4">
                Are you sure you want to delete the role <strong>{selectedRole.name}</strong>?
              </p>
              
              {loadingUsage ? (
                <p className="text-gray-500">Loading usage statistics...</p>
              ) : roleUsage ? (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Users"
                        value={roleUsage.userCount || 0}
                        prefix={<UserOutlined />}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Permissions"
                        value={roleUsage.permissionCount || 0}
                        prefix={<LockOutlined />}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Pages"
                        value={roleUsage.pageCount || 0}
                        prefix={<SafetyOutlined />}
                      />
                    </Col>
                  </Row>
                  
                  {(roleUsage.userCount > 0 || roleUsage.permissionCount > 0 || roleUsage.pageCount > 0) && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-800 text-sm font-semibold mb-1">
                        ⚠️ Warning: This role is in use!
                      </p>
                      <p className="text-red-700 text-xs">
                        Deleting this role may affect {roleUsage.userCount || 0} user(s), {roleUsage.permissionCount || 0} permission(s), and {roleUsage.pageCount || 0} page(s).
                        Please reassign users and permissions before deleting.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Unable to load usage statistics. Please proceed with caution.
                </p>
              )}
              
              <p className="text-gray-600 text-sm">
                This action cannot be undone.
              </p>
            </div>
          )}
        </Modal>

        {/* Role Permissions Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <SettingOutlined />
              <span>Manage Permissions: {selectedRole ? selectedRole.name : ''}</span>
            </div>
          }
          open={isRolePermissionsModalOpen}
          onCancel={() => {
            setIsRolePermissionsModalOpen(false);
            setSelectedRole(null);
            setRolePermissions({});
            setInitialRolePermissions({});
            setHasChanges(false);
          }}
          width="90%"
          style={{ maxWidth: 900 }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setIsRolePermissionsModalOpen(false);
                setSelectedRole(null);
                setRolePermissions({});
                setInitialRolePermissions({});
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
              onClick={handleSaveRolePermissions}
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
                  <strong>Note:</strong> These are the default permissions for this role. 
                  Users with this role will inherit these permissions unless they have user-specific overrides.
                </p>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <Button
                  type="default"
                  onClick={handleToggleAllOnRole}
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
                    (action) => rolePermissions[`${resourceSlug}_${action}`]
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
                            onClick={(e) => { e.stopPropagation(); handleToggleResourceOnRole(resourceSlug); }}
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
                          const isEnabled = rolePermissions[key] || false;
                          
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
                                onChange={() => handlePermissionToggle(resourceSlug, action)}
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

export default Roles;

