import { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Modal, Space, Row, Col, Divider } from 'antd';
import { EditOutlined, SafetyOutlined, InfoCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import PermissionForm from '../components/forms/PermissionForm';
import SinglePermissionForm from '../components/forms/SinglePermissionForm';
import PermissionWrapper from '../components/common/PermissionWrapper';
import ConfirmModal from '../components/common/ConfirmModal';
import { usePermissions } from '../contexts/PermissionContext';
import * as permissionService from '../services/permissionService';
import { formatRole } from '../utils/roleHelpers';
import { toast } from 'react-toastify';

const Permissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]); // All individual permissions
  const [matrix, setMatrix] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  
  // Single permission management
  const [isSinglePermissionModalOpen, setIsSinglePermissionModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState(null);
  const [loadingSinglePermission, setLoadingSinglePermission] = useState(false);

  const { hasPermission, hasRole } = usePermissions();

  // Fetch all individual permissions
  const fetchAllPermissions = async () => {
    try {
      const response = await permissionService.getAllPermissions();
      if (response.success && response.data?.permissions) {
        setAllPermissions(response.data.permissions);
      }
    } catch (error) {
      console.error('Failed to fetch all permissions:', error);
    }
  };

  // Fetch permissions matrix
  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const response = await permissionService.getPermissionMatrix();
      if (response.success) {
        setMatrix(response.data);
        setPermissions(response.data.permissions || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch permissions');
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
      console.error('Failed to fetch resources:', error);
    }
  };

  // Fetch permissions for a role
  const fetchRolePermissions = async (role) => {
    setLoadingPermissions(true);
    try {
      const response = await permissionService.getRolePermissions(role);
      if (response.success) {
        // Backend returns data.permissions as an object grouped by resource
        // Format: { 'users': { actions: ['read', 'create'], ... }, 'pages': { actions: [...] } }
        const permsObj = response.data.permissions || {};
        // Transform to form format: { 'users_read': true, 'users_create': true, ... }
        const formData = {};
        
        // Handle object format { resource: { actions: [...] } }
        Object.keys(permsObj).forEach((resource) => {
          const perm = permsObj[resource];
          if (perm && perm.actions && Array.isArray(perm.actions)) {
            perm.actions.forEach((action) => {
              formData[`${resource}_${action}`] = true;
            });
          }
        });
        
        setRolePermissions(formData);
        return formData;
      }
      return {};
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch role permissions');
      return {};
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
    fetchResources();
    fetchAllPermissions();
  }, []);

  // Handle edit permissions
  const handleEdit = async (role) => {
    setSelectedRole(role);
    // Fetch permissions first, then open modal
    const permissions = await fetchRolePermissions(role);
    if (permissions && Object.keys(permissions).length > 0) {
      setRolePermissions(permissions);
    } else {
      setRolePermissions({});
    }
    setIsEditModalOpen(true);
  };

  // Handle save permissions
  const handleSave = async (permissionsArray) => {
    try {
      const response = await permissionService.updateRolePermissions(
        selectedRole,
        permissionsArray
      );
      if (response.success) {
        toast.success('Permissions updated successfully');
        setIsEditModalOpen(false);
        setSelectedRole(null);
        fetchMatrix();
        fetchAllPermissions(); // Refresh individual permissions list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update permissions');
      throw error;
    }
  };

  // Handle create/update single permission
  const handleUpsertPermission = async (permissionData) => {
    try {
      setLoadingSinglePermission(true);
      const response = await permissionService.upsertPermission(permissionData);
      if (response.success) {
        toast.success(selectedPermission?._id ? 'Permission updated successfully' : 'Permission created successfully');
        setIsSinglePermissionModalOpen(false);
        setSelectedPermission(null);
        fetchMatrix();
        fetchAllPermissions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save permission');
      throw error;
    } finally {
      setLoadingSinglePermission(false);
    }
  };

  // Handle delete permission
  const handleDeletePermission = async () => {
    if (!permissionToDelete) return;
    
    try {
      const response = await permissionService.deletePermission(permissionToDelete._id);
      if (response.success) {
        toast.success('Permission deleted successfully');
        setIsDeleteModalOpen(false);
        setPermissionToDelete(null);
        fetchMatrix();
        fetchAllPermissions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete permission');
    }
  };

  // Build matrix table data
  const buildMatrixData = () => {
    if (!matrix || !matrix.roles || !matrix.resources) {
      return [];
    }

    return matrix.resources.map((resource) => {
      const row = { key: resource, resource };
      matrix.roles.forEach((role) => {
        const rolePerms = matrix.matrix?.[role]?.[resource];
        // Extract actions array from the permission object
        const actions = rolePerms?.actions || [];
        row[role] = actions;
      });
      return row;
    });
  };

  // Build matrix columns
  const buildMatrixColumns = () => {
    if (!matrix || !matrix.roles) {
      return [];
    }

      const columns = [
      {
        title: 'Resource',
        dataIndex: 'resource',
        key: 'resource',
        width: 150,
        fixed: 'left',
        render: (resource) => (
          <div className="bg-gray-800 rounded-lg px-3 py-2" style={{ backgroundColor: '#1f2937' }}>
            <span className="font-semibold text-white">
              {resource
                ?.split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ') || resource}
            </span>
          </div>
        ),
      },
    ];

    matrix.roles.forEach((role) => {
      columns.push({
        title: (
          <div className="bg-gray-800 text-white rounded-lg px-3 py-2 text-center font-semibold" style={{ backgroundColor: '#1f2937' }}>
            {formatRole(role)}
          </div>
        ),
        dataIndex: role,
        key: role,
        width: 160,
        align: 'center',
        ellipsis: true,
        render: (actions) => (
          <div className="py-3 min-h-[60px] flex items-center justify-center">
            {Array.isArray(actions) && actions.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-center max-w-[140px]">
                {actions.map((action) => (
                  <span 
                    key={action}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-white"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    {action}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400 font-medium">—</span>
            )}
          </div>
        ),
      });
    });

    // Note: Edit permissions is done by role, not by resource
    // The "Edit Permissions" button at the top handles role-based editing

    return columns;
  };

  const matrixData = buildMatrixData();
  const matrixColumns = buildMatrixColumns();

  return (
    <MainLayout>
      <div className="p-4 md:p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Permission Management
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Configure role-based access control and permissions
            </p>
          </div>
          <PermissionWrapper roles={['super_admin']}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="large"
              onClick={() => {
                // Show role selection modal first
                Modal.info({
                  title: (
                    <div className="flex items-center gap-2">
                      <SafetyOutlined className="text-gray-800" />
                      <span className="text-lg font-semibold text-gray-900">Select Role to Edit</span>
                    </div>
                  ),
                  width: 500,
                  content: (
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      {['super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'].map(
                        (role) => (
                          <Button
                            key={role}
                            size="large"
                            className="hover:border-gray-800 hover:text-gray-800 transition-all"
                            onClick={async () => {
                              Modal.destroyAll();
                              await handleEdit(role);
                            }}
                          >
                            {formatRole(role)}
                          </Button>
                        )
                      )}
                    </div>
                  ),
                  okText: 'Close',
                  okButtonProps: { 
                    style: { 
                      backgroundColor: '#1f2937',
                      borderColor: '#1f2937',
                      color: '#ffffff'
                    } 
                  },
                  onOk: () => Modal.destroyAll(),
                });
              }}
              className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all bg-gray-800 hover:bg-gray-700 border-0 text-white"
              style={{ 
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: '#1f2937',
                borderColor: '#1f2937'
              }}
            >
              Edit Permissions
            </Button>
          </PermissionWrapper>
        </div>

        {/* Info Card */}
        <div className="mb-6 md:mb-8 permissions-page-card-wrapper">
          <Card className="border border-gray-200 shadow-md bg-white">
            <div className="flex items-start gap-3">
              <InfoCircleOutlined className="text-gray-600 text-xl mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">About Permissions</h3>
                <p className="text-sm text-gray-600">
                  This matrix shows all permissions assigned to each role. Click "Edit Permissions" to modify role access. 
                  Each cell displays the actions (create, read, update, delete) available for that role and resource.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Permissions Matrix Table */}
        <div className="mb-6 md:mb-8 permissions-page-card-wrapper">
          <Card 
            className="border border-gray-200 shadow-md bg-white"
            bodyStyle={{ padding: 0 }}
          >
          <div className="p-4 md:p-6 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <SafetyOutlined className="text-gray-800" />
              Permission Matrix
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {matrix?.resources?.length || 0} resources × {matrix?.roles?.length || 0} roles
            </p>
          </div>
          <div className="w-full">
            <Table
              columns={matrixColumns}
              dataSource={matrixData}
              loading={loading}
              pagination={false}
              className="custom-table permissions-table"
              rowClassName="bg-gray-800 hover:bg-gray-750"
              size="small"
            />
          </div>
          </Card>
        </div>

        {/* Edit Permissions Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <SafetyOutlined className="text-gray-800" />
              <span className="text-lg font-semibold text-gray-900">
                Edit Permissions - {selectedRole ? formatRole(selectedRole) : ''}
              </span>
            </div>
          }
          open={isEditModalOpen}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedRole(null);
            setRolePermissions({});
          }}
          footer={null}
          width={700}
          className="permission-modal"
        >
          {selectedRole && (
            <PermissionForm
              key={`${selectedRole}-${Object.keys(rolePermissions).length}`} // Force re-render when role or permissions change
              role={selectedRole}
              resources={resources}
              initialPermissions={rolePermissions}
              loading={loadingPermissions}
              onSubmit={handleSave}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedRole(null);
                setRolePermissions({});
              }}
            />
          )}
        </Modal>

        {/* Individual Permissions Management */}
        <PermissionWrapper roles={['super_admin']}>
          <Card className="border border-gray-200 shadow-md bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <SafetyOutlined className="text-gray-800" />
                  Individual Permissions
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage individual permissions. Create, update, or delete specific permission entries.
                </p>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => {
                  setSelectedPermission(null);
                  setIsSinglePermissionModalOpen(true);
                }}
                className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all bg-gray-800 hover:bg-gray-700 border-0 text-white"
                style={{ 
                  height: '44px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  backgroundColor: '#1f2937',
                  borderColor: '#1f2937'
                }}
              >
                Create Permission
              </Button>
            </div>

            <Table
              columns={[
                {
                  title: 'Role',
                  dataIndex: 'role',
                  key: 'role',
                  render: (role) => (
                    <Tag color="blue" className="px-3 py-1 font-semibold rounded-full">
                      {formatRole(role)}
                    </Tag>
                  ),
                  sorter: (a, b) => a.role.localeCompare(b.role),
                },
                {
                  title: 'Resource',
                  dataIndex: 'resource',
                  key: 'resource',
                  render: (resource) => (
                    <span className="font-medium text-gray-900">
                      {resource
                        ?.split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </span>
                  ),
                  sorter: (a, b) => a.resource.localeCompare(b.resource),
                },
                {
                  title: 'Actions',
                  dataIndex: 'actions',
                  key: 'actions',
                  render: (actions) => (
                    <Space size="small" wrap>
                      {Array.isArray(actions) && actions.length > 0 ? (
                        actions.map((action) => (
                          <Tag key={action} className="bg-gray-800 text-white border-0">
                            {action}
                          </Tag>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </Space>
                  ),
                },
                {
                  title: 'Status',
                  dataIndex: 'isActive',
                  key: 'isActive',
                  render: (isActive) => (
                    <Tag color={isActive ? 'green' : 'red'} className="px-3 py-1 font-semibold rounded-full">
                      {isActive ? 'Active' : 'Inactive'}
                    </Tag>
                  ),
                  filters: [
                    { text: 'Active', value: true },
                    { text: 'Inactive', value: false },
                  ],
                  onFilter: (value, record) => record.isActive === value,
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  fixed: 'right',
                  width: 150,
                  render: (_, record) => (
                    <Space>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setSelectedPermission(record);
                          setIsSinglePermissionModalOpen(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Button>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          setPermissionToDelete(record);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </Space>
                  ),
                },
              ]}
              dataSource={allPermissions}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `${total} permissions`,
              }}
              className="custom-table"
            />
          </Card>
        </PermissionWrapper>

        {/* Create/Update Single Permission Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <SafetyOutlined className="text-gray-800" />
              <span className="text-lg font-semibold text-gray-900">
                {selectedPermission?._id ? 'Update Permission' : 'Create Permission'}
              </span>
            </div>
          }
          open={isSinglePermissionModalOpen}
          onCancel={() => {
            setIsSinglePermissionModalOpen(false);
            setSelectedPermission(null);
          }}
          footer={null}
          width={600}
        >
          <SinglePermissionForm
            initialValues={selectedPermission || {}}
            resources={resources}
            onSubmit={handleUpsertPermission}
            onCancel={() => {
              setIsSinglePermissionModalOpen(false);
              setSelectedPermission(null);
            }}
            loading={loadingSinglePermission}
          />
        </Modal>

        {/* Delete Permission Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Permission"
          content={
            permissionToDelete
              ? `Are you sure you want to delete the permission for ${formatRole(permissionToDelete.role)} on ${permissionToDelete.resource
                  ?.split('_')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}? This action cannot be undone.`
              : ''
          }
          onConfirm={handleDeletePermission}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setPermissionToDelete(null);
          }}
          okText="Delete"
          okType="danger"
        />
      </div>
    </MainLayout>
  );
};

export default Permissions;

