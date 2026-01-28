import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Card, Tag, Select, Dropdown, Space, Tooltip } from 'antd';
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
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as branchService from '../services/branchService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const BranchRowActions = ({ record, onNavigate, onDeleteClick }) => {
  const { hasPermission } = usePermissions();
  const workflowStatus = useWorkflowStatus({
    status: record?.status || 'draft',
    resourceType: 'branch',
    createdBy: record?.createdBy?._id || record?.createdBy,
  });
  const menuItems = [];
  if (hasPermission('branches', 'update') && workflowStatus.canEdit.canEdit) {
    menuItems.push({ key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => onNavigate(`/branches/${record._id}`) });
  }
  if (hasPermission('branches', 'delete') && workflowStatus.canDelete.canDelete) {
    menuItems.push({ key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => onDeleteClick(record) });
  }
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Button type="text" icon={<MoreOutlined />} className="hover:bg-gray-100" size="small" disabled={menuItems.length === 0} />
      </Dropdown>
    </div>
  );
};

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
  const [sortField, setSortField] = useState('isHeadOffice');
  const [sortOrder, setSortOrder] = useState('descend');
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
      const sortBy = params.sortBy ?? sortField;
      const sortOrderApi = (params.sortOrder ?? sortOrder) === 'descend' ? 'desc' : 'asc';
      const response = await branchService.getAllBranches({
        page: params.page ?? pagination.current,
        limit: params.limit ?? pagination.pageSize,
        search: params.search !== undefined ? params.search : searchText,
        status: params.status !== undefined ? params.status : statusFilter,
        sortBy: params.sortBy ?? sortBy,
        sortOrder: params.sortOrder ?? sortOrderApi,
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
  }, [pagination.current, pagination.pageSize, statusFilter, sortField, sortOrder]);

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

  const handleTableChange = (paginationConfig, filters, sorter) => {
    if (sorter?.field != null && sorter?.order != null) {
      setSortField(sorter.field);
      setSortOrder(sorter.order);
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Branch',
      key: 'branch',
      dataIndex: 'branchName',
      sorter: true,
      sortOrder: sortField === 'branchName' ? sortOrder : null,
      width: 240,
      fixed: 'left',
      render: (_, record) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            {record.isHeadOffice ? <HomeOutlined className="text-xs" /> : <BankOutlined className="text-xs" />}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Tooltip title={record.branchName} placement="top">
                <span className="font-medium text-gray-900 text-sm truncate block" style={{ maxWidth: 'calc(100% - 100px)' }}>
                  {record.branchName}
                </span>
              </Tooltip>
              {record.isHeadOffice && (
                <Tag color="blue" className="text-xs flex-shrink-0">
                  Head Office
                </Tag>
              )}
              {record.featured && (
                <Tag icon={<StarOutlined />} color="gold" className="text-xs flex-shrink-0">
                  Featured
                </Tag>
              )}
            </div>
            <Tooltip title={`${record.city}, ${record.state} • ${record.country?.name || 'N/A'}`} placement="top">
              <span className="text-xs text-gray-500 truncate block" style={{ maxWidth: 'calc(100% - 100px)' }}>
                {record.city}, {record.state} • {record.country?.name || 'N/A'}
              </span>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: 180,
      render: (_, record) => {
        const locationParts = [];
        if (record.city) locationParts.push(record.city);
        if (record.state) locationParts.push(record.state);
        if (record.country?.name) locationParts.push(record.country.name);
        return (
          <span className="text-gray-700 text-sm truncate block" title={locationParts.join(', ')}>
            {locationParts.length > 0 ? locationParts.join(', ') : '—'}
          </span>
        );
      },
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      className: 'hidden lg:table-cell',
      render: (_, record) => (
        <div className="flex flex-col text-xs min-w-0">
          {record.email && (
            <span className="text-gray-700 truncate block" title={record.email}>{record.email}</span>
          )}
          {record.phone && (
            <span className="text-gray-600 truncate block" title={record.phone}>{record.phone}</span>
          )}
          {!record.email && !record.phone && (
            <span className="text-gray-400">—</span>
          )}
        </div>
      ),
    },
    // {
    //   title: 'Manager',
    //   key: 'manager',
    //   width: 140,
    //   className: 'hidden lg:table-cell',
    //   render: (_, record) => {
    //     const manager = record.manager;
    //     if (manager) {
    //       const name = manager.firstName && manager.lastName
    //         ? `${manager.firstName} ${manager.lastName}`
    //         : manager.email || 'Unknown';
    //       return <span className="text-gray-700 text-sm truncate block" title={name}>{name}</span>;
    //     }
    //     return <span className="text-gray-400 text-sm">—</span>;
    //   },
    // },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag 
          color={getStatusColor(status)}
          className="px-2 py-0.5 font-semibold rounded-full text-xs"
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
      width: 140,
      className: 'hidden md:table-cell',
      render: (_, record) => {
        const creator = record.createdBy;
        if (creator) {
          const name = creator.firstName && creator.lastName
            ? `${creator.firstName} ${creator.lastName}`
            : creator.email || 'Unknown';
          return <span className="text-gray-700 text-sm truncate block" title={name}>{name}</span>;
        }
        return <span className="text-gray-400 text-sm">—</span>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      className: 'hidden md:table-cell',
      render: (date) => (
        <span className="text-gray-600 text-xs">
          {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
        </span>
      ),
      sorter: true,
      sortOrder: sortField === 'createdAt' ? sortOrder : null,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <BranchRowActions
          record={record}
          onNavigate={(path) => navigate(path)}
          onDeleteClick={(r) => { setSelectedBranch(r); setIsDeleteModalOpen(true); }}
        />
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 lg:space-y-8 w-full max-w-full overflow-x-hidden">
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
          className="border border-gray-200 shadow-md bg-white w-full"
          bodyStyle={{ padding: 0 }}
        >
          <div className="overflow-x-auto w-full">
            <Table
              columns={columns}
              dataSource={branches}
              loading={loading}
              rowKey="_id"
              className="custom-table branches-table w-full"
              onChange={handleTableChange}
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
              scroll={{ x: 'max-content', y: 'calc(100vh - 380px)' }}
              onRow={(record) => ({
                onClick: () => {
                  if (hasPermission('branches', 'update')) {
                    navigate(`/branches/${record._id}`);
                  }
                },
                className: hasPermission('branches', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
              })}
            />
          </div>
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


