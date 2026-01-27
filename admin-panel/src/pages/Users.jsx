import { useState, useEffect } from 'react';
import { Table, Button, Input, Card, Space, Tag, Modal, message, Statistic, Row, Col, Select, Dropdown } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserSwitchOutlined,
  SearchOutlined,
  UserOutlined,
  MoreOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import UserForm from '../components/forms/UserForm';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import * as userService from '../services/userService';
import { formatRole, getUserFullName, getRoleColor, getRoleDisplayName, getRoleSlug } from '../utils/roleHelpers';
import * as roleService from '../services/roleService';
import { toast } from 'react-toastify';

const { Search } = Input;

const { Option } = Select;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortConfig, setSortConfig] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });

  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();

  // Fetch users
  const fetchUsers = async (params = {}) => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        role: roleFilter,
        isActive: statusFilter,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
        ...params,
      });

      if (response.success) {
        setUsers(response.data.users || response.data || []);
        if (response.data.pagination?.total !== undefined) {
          setPagination((prev) => ({
            ...prev,
            total: response.data.pagination.total,
          }));
        } else if (response.data.total !== undefined) {
          setPagination((prev) => ({
            ...prev,
            total: response.data.total,
          }));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await roleService.getActiveRoles(true); // Include system roles
      if (response.success) {
        const rolesData = response.data.roles || response.data || [];
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to fetch roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch user stats
  const fetchStats = async () => {
    if (hasPermission('users', 'read')) {
      try {
        const response = await userService.getUserStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        // Stats might not be available for all roles, fail silently
        console.error('Failed to fetch stats:', error);
        setStats(null);
      }
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [pagination.current, pagination.pageSize, searchText, roleFilter, statusFilter, sortConfig.sortBy, sortConfig.sortOrder]);

  // Handle table change (sort, pagination)
  const handleTableChange = (newPagination, filters, sorter) => {
    if (newPagination && (newPagination.current !== pagination.current || newPagination.pageSize !== pagination.pageSize)) {
      setPagination((prev) => ({
        ...prev,
        current: newPagination.current,
        pageSize: newPagination.pageSize || prev.pageSize,
      }));
    }
    if (sorter && (sorter.field != null || sorter.column?.dataIndex != null) && sorter.order != null) {
      const field = sorter.field ?? sorter.column?.dataIndex ?? sorter.column?.key;
      const fieldMap = { firstName: 'firstName', name: 'firstName', email: 'email', role: 'role', isActive: 'isActive' };
      const sortBy = fieldMap[field] ?? (typeof field === 'string' ? field : 'createdAt');
      const sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
      setSortConfig({ sortBy, sortOrder });
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  // Handle create user
  const handleCreate = async (values) => {
    try {
      const response = await userService.createUser(values);
      if (response.success) {
        toast.success('User created successfully');
        setIsCreateModalOpen(false);
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
      throw error;
    }
  };

  // Handle update user
  const handleUpdate = async (values) => {
    try {
      const response = await userService.updateUser(selectedUser._id, values);
      if (response.success) {
        toast.success('User updated successfully');
        setIsEditModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
      throw error;
    }
  };

  // Handle delete user
  const handleDelete = async () => {
    try {
      const response = await userService.deleteUser(selectedUser._id);
      if (response.success) {
        toast.success('User deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Handle role change
  const handleRoleChange = async (role) => {
    try {
      const response = await userService.changeUserRole(selectedUser._id, role);
      if (response.success) {
        toast.success('User role updated successfully');
        setIsRoleModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change user role');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchUsers({ search: value });
  };

  // Map sort field to column sortOrder
  const getSortOrder = (field) => {
    if (sortConfig.sortBy !== field) return undefined;
    return sortConfig.sortOrder === 'asc' ? 'ascend' : 'descend';
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      key: 'name',
      dataIndex: 'firstName',
      sorter: true,
      sortOrder: getSortOrder('firstName'),
      sortDirections: ['ascend', 'descend'],
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-semibold">
            {getUserFullName(record).charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-900">{getUserFullName(record)}</span>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      sortOrder: getSortOrder('email'),
      sortDirections: ['ascend', 'descend'],
      render: (email) => (
        <span className="text-gray-700">{email}</span>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      sorter: true,
      sortOrder: getSortOrder('role'),
      sortDirections: ['ascend', 'descend'],
      render: (role) => {
        // Handle both Role object and string
        const roleDisplay = typeof role === 'object' ? getRoleDisplayName(role) : formatRole(role);
        const roleColor = getRoleColor(role);
        return (
          <Tag 
            color={roleColor}
            className="px-3 py-1 font-semibold rounded-full"
          >
            {roleDisplay}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      sorter: true,
      sortOrder: getSortOrder('isActive'),
      sortDirections: ['ascend', 'descend'],
      render: (isActive) => (
        <Tag 
          color={isActive !== false ? 'green' : 'red'}
          className="px-3 py-1 font-semibold rounded-full"
        >
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
        const menuItems = [];
        
        if (hasPermission('users', 'update')) {
          menuItems.push({
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            onClick: () => {
              setSelectedUser(record);
              setIsEditModalOpen(true);
            },
          });
        }

        const currentUserRoleSlug = currentUser?.role?.slug || currentUser?.role;
        const userRoleSlug = record.role?.slug || record.role;
        if ((currentUserRoleSlug === 'super_admin') && (userRoleSlug !== 'super_admin')) {
          menuItems.push({
            key: 'role',
            label: 'Change Role',
            icon: <UserSwitchOutlined />,
            onClick: () => {
              setSelectedUser(record);
              setIsRoleModalOpen(true);
            },
          });
        }

        if (hasPermission('users', 'delete')) {
          menuItems.push({
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
              setSelectedUser(record);
              setIsDeleteModalOpen(true);
            },
          });
        }

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

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              User Management
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage and monitor all system users
            </p>
          </div>
          <PermissionWrapper resource="users" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
              style={{
                backgroundColor: '#1f2937',
                borderColor: '#1f2937',
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Create User
            </Button>
          </PermissionWrapper>
        </div>

  

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search users by name, email, or role..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => {
                  if (!e.target.value) {
                    handleSearch('');
                  }
                }}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select
                placeholder="Filter by Role"
                allowClear
                size="large"
                style={{ width: 150 }}
                value={roleFilter}
                onChange={(value) => {
                  setRoleFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
              >
                {roles.map((role) => (
                  <Option key={role._id} value={getRoleSlug(role)}>
                    {getRoleDisplayName(role)}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Filter by Status"
                allowClear
                size="large"
                style={{ width: 150 }}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="true">Active</Option>
                <Option value="false">Inactive</Option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Users Table - only table body scrolls, not the whole page */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={users}
            loading={loading}
            rowKey="_id"
            className="custom-table users-table"
            onChange={handleTableChange}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} users`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 'max-content', y: 'calc(100vh - 340px)' }}
          />
        </Card>

        {/* Create User Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <PlusOutlined className="text-gray-800" />
              <span className="text-lg font-semibold text-gray-900">Create New User</span>
            </div>
          }
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
          width={600}
          className="user-modal"
        >
          <UserForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </Modal>

        {/* Edit User Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <EditOutlined className="text-gray-800" />
              <span className="text-lg font-semibold text-gray-900">Edit User</span>
            </div>
          }
          open={isEditModalOpen}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          footer={null}
          width={600}
          className="user-modal"
        >
          <UserForm
            initialValues={selectedUser}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
            isEdit
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete User"
          content={`Are you sure you want to delete ${getUserFullName(selectedUser)}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
          }}
          okText="Delete"
        />

        {/* Change Role Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <UserSwitchOutlined className="text-[#b41c24]" />
              <span className="text-lg font-semibold">Change User Role</span>
            </div>
          }
          open={isRoleModalOpen}
          onCancel={() => {
            setIsRoleModalOpen(false);
            setSelectedUser(null);
          }}
          footer={null}
          width={500}
        >
          <div className="space-y-6 py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Changing role for</p>
              <p className="text-lg font-semibold text-gray-900">{getUserFullName(selectedUser)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {roles
                .filter(role => role.slug !== 'super_admin') // Don't allow changing to super_admin
                .map((role) => {
                  const roleSlug = getRoleSlug(role);
                  const userRoleSlug = selectedUser?.role?.slug || selectedUser?.role;
                  const isSelected = userRoleSlug === roleSlug || userRoleSlug === role._id;
                  
                  return (
                    <Button
                      key={role._id}
                      type={isSelected ? 'primary' : 'default'}
                      size="large"
                      onClick={() => handleRoleChange(role._id)}
                      className={`transition-all ${
                        isSelected
                          ? 'shadow-lg'
                          : 'hover:border-[#b41c24] hover:text-[#b41c24]'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: '#b41c24', borderColor: '#b41c24' }
                          : {}
                      }
                    >
                      {getRoleDisplayName(role)}
                    </Button>
                  );
                })}
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Users;
