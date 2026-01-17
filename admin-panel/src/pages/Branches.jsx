import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Card, Tag, Select, Dropdown, Space } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  BankOutlined,
  StarOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import * as branchService from '../services/branchService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

// Status color mapping
const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    in_review: 'blue',
    changes_requested: 'orange',
    pending_approval: 'purple',
    pending_publish: 'cyan',
    published: 'green',
    archived: 'red',
  };
  return colors[status] || 'default';
};

// Status display names
const getStatusLabel = (status) => {
  const labels = {
    draft: 'Draft',
    in_review: 'In Review',
    changes_requested: 'Changes Requested',
    pending_approval: 'Pending Approval',
    pending_publish: 'Pending Publish',
    published: 'Published',
    archived: 'Archived',
  };
  return labels[status] || status;
};

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Fetch branches
  const fetchBranches = async (params = {}) => {
    setLoading(true);
    try {
      const response = await branchService.getAllBranches({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
        ...params,
      });

      if (response.success) {
        setBranches(response.data.branches || response.data || []);
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
      toast.error(error.response?.data?.message || 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [pagination.current, pagination.pageSize, statusFilter]);

  // Handle delete branch
  const handleDelete = async () => {
    try {
      const response = await branchService.deleteBranch(selectedBranch._id);
      if (response.success) {
        toast.success('Branch deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedBranch(null);
        fetchBranches();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete branch');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchBranches({ search: value });
  };

  // Table columns
  const columns = [
    {
      title: 'Branch',
      key: 'branch',
      sorter: true,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white">
            {record.isHeadOffice ? <HomeOutlined /> : <BankOutlined />}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{record.branchName}</span>
              {record.isHeadOffice && (
                <Tag color="blue" className="text-xs">
                  Head Office
                </Tag>
              )}
              {record.featured && (
                <Tag icon={<StarOutlined />} color="gold" className="text-xs">
                  Featured
                </Tag>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {record.city}, {record.state} • {record.country?.name || 'N/A'}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => {
        const locationParts = [];
        if (record.city) locationParts.push(record.city);
        if (record.state) locationParts.push(record.state);
        if (record.country?.name) locationParts.push(record.country.name);
        return (
          <span className="text-gray-700 text-sm">
            {locationParts.length > 0 ? locationParts.join(', ') : '—'}
          </span>
        );
      },
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          {record.email && (
            <span className="text-gray-700">{record.email}</span>
          )}
          {record.phone && (
            <span className="text-gray-600">{record.phone}</span>
          )}
          {!record.email && !record.phone && (
            <span className="text-gray-400">—</span>
          )}
        </div>
      ),
    },
    {
      title: 'Manager',
      key: 'manager',
      render: (_, record) => {
        const manager = record.manager;
        if (manager) {
          const name = manager.firstName && manager.lastName
            ? `${manager.firstName} ${manager.lastName}`
            : manager.email || 'Unknown';
          return <span className="text-gray-700 text-sm">{name}</span>;
        }
        return <span className="text-gray-400">—</span>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag 
          color={getStatusColor(status)}
          className="px-3 py-1 font-semibold rounded-full"
        >
          {getStatusLabel(status)}
        </Tag>
      ),
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'In Review', value: 'in_review' },
        { text: 'Changes Requested', value: 'changes_requested' },
        { text: 'Pending Approval', value: 'pending_approval' },
        { text: 'Pending Publish', value: 'pending_publish' },
        { text: 'Published', value: 'published' },
        { text: 'Archived', value: 'archived' },
      ],
    },
    {
      title: 'Created By',
      key: 'createdBy',
      render: (_, record) => {
        const creator = record.createdBy;
        if (creator) {
          const name = creator.firstName && creator.lastName
            ? `${creator.firstName} ${creator.lastName}`
            : creator.email || 'Unknown';
          return <span className="text-gray-700">{name}</span>;
        }
        return <span className="text-gray-400">—</span>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span className="text-gray-600 text-sm">
          {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
        </span>
      ),
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => {
        const menuItems = [];

        if (hasPermission('branches', 'update')) {
          menuItems.push({
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            onClick: () => {
              navigate(`/branches/${record._id}`);
            },
          });
        }

        if (hasPermission('branches', 'delete')) {
          menuItems.push({
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
              setSelectedBranch(record);
              setIsDeleteModalOpen(true);
            },
          });
        }

        return (
          <div onClick={(e) => e.stopPropagation()}>
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
          </div>
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
              Branches
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage and organize your branch locations
            </p>
          </div>
          <PermissionWrapper resource="branches" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/branches/new')}
              className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
              style={{
                backgroundColor: '#1f2937',
                borderColor: '#1f2937',
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Create Branch
            </Button>
          </PermissionWrapper>
        </div>

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search branches by name, city, state..."
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
                placeholder="Filter by Status"
                allowClear
                size="large"
                style={{ width: 180 }}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="draft">Draft</Option>
                <Option value="in_review">In Review</Option>
                <Option value="changes_requested">Changes Requested</Option>
                <Option value="pending_approval">Pending Approval</Option>
                <Option value="pending_publish">Pending Publish</Option>
                <Option value="published">Published</Option>
                <Option value="archived">Archived</Option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Branches Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={branches}
            loading={loading}
            rowKey="_id"
            className="custom-table branches-table"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} branches`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize,
                }));
              },
            }}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => {
                if (hasPermission('branches', 'update')) {
                  navigate(`/branches/${record._id}`);
                }
              },
              className: hasPermission('branches', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
            })}
          />
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Branch"
          content={`Are you sure you want to delete "${selectedBranch?.branchName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedBranch(null);
          }}
          okText="Delete"
        />
      </div>
    </MainLayout>
  );
};

export default Branches;

