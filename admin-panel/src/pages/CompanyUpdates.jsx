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
  NotificationOutlined,
  StarOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as companyUpdateService from '../services/companyUpdateService';
import * as companyUpdateCategoryService from '../services/companyUpdateCategoryService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const CompanyUpdateRowActions = ({ record, onNavigate, onDeleteClick }) => {
  const { hasPermission } = usePermissions();
  const workflowStatus = useWorkflowStatus({
    status: record?.status || 'draft',
    resourceType: 'company-update',
    createdBy: record?.createdBy?._id || record?.createdBy,
  });
  const menuItems = [];
  if (hasPermission('company-updates', 'update') && workflowStatus.canEdit.canEdit) {
    menuItems.push({ key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => onNavigate(`/company-updates/${record._id}`) });
  }
  if (hasPermission('company-updates', 'delete') && workflowStatus.canDelete.canDelete) {
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

const CompanyUpdates = () => {
  const [companyUpdates, setCompanyUpdates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [sortField, setSortField] = useState('eventDate');
  const [sortOrder, setSortOrder] = useState('descend');
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Load categories for filter
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await companyUpdateCategoryService.getAllCompanyUpdateCategories({ limit: 500 });
        if (res.success && res.data?.categories) setCategories(res.data.categories);
        else if (res.success && res.data?.companyUpdateCategories) setCategories(res.data.companyUpdateCategories);
        else if (res.success && Array.isArray(res.data)) setCategories(res.data);
      } catch {
        // ignore
      }
    };
    loadCategories();
  }, []);

  // Fetch company updates
  const fetchCompanyUpdates = async (params = {}) => {
    setLoading(true);
    try {
      const sortBy = params.sortBy ?? sortField;
      const sortOrderApi = (params.sortOrder ?? sortOrder) === 'descend' ? 'desc' : 'asc';
      const response = await companyUpdateService.getAllCompanyUpdates({
        page: params.page ?? pagination.current,
        limit: params.limit ?? pagination.pageSize,
        search: params.search !== undefined ? params.search : searchText,
        status: params.status !== undefined ? params.status : statusFilter,
        category: params.category !== undefined ? params.category : categoryFilter,
        sortBy: params.sortBy ?? sortBy,
        sortOrder: params.sortOrder ?? sortOrderApi,
        ...params,
      });

      if (response.success) {
        setCompanyUpdates(response.data.companyUpdates || response.data.updates || response.data || []);
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
      toast.error(error.response?.data?.message || 'Failed to fetch company updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyUpdates();
  }, [pagination.current, pagination.pageSize, statusFilter, categoryFilter, sortField, sortOrder]);

  // Handle delete company update
  const handleDelete = async () => {
    try {
      const response = await companyUpdateService.deleteCompanyUpdate(selectedUpdate._id);
      if (response.success) {
        toast.success('Company update deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedUpdate(null);
        fetchCompanyUpdates();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete company update');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchCompanyUpdates({ search: value });
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
      title: 'Company Update',
      key: 'update',
      dataIndex: 'title',
      sorter: true,
      sortOrder: sortField === 'title' ? sortOrder : null,
      width: 280,
      fixed: 'left',
      render: (_, record) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
            {record.featureImage?.url ? (
              <img
                src={record.featureImage.url}
                alt={record.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <NotificationOutlined className="text-xs" />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-medium text-gray-900 text-sm truncate">{record.title}</span>
              {record.featured && (
                <Tag icon={<StarOutlined />} color="gold" className="text-xs flex-shrink-0">
                  Featured
                </Tag>
              )}
            </div>
            <span className="text-xs text-gray-500 truncate">
              {record.category?.name || 'Uncategorized'} • {record.heading}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      width: 130,
      render: (_, record) => (
        <Tag className="px-2 py-0.5 text-xs">
          {record.category?.name || 'Uncategorized'}
        </Tag>
      ),
    },
    {
      title: 'Event Date',
      dataIndex: 'eventDate',
      key: 'eventDate',
      width: 120,
      className: 'hidden md:table-cell',
      render: (date) => (
        <span className="text-gray-600 text-xs">
          {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
        </span>
      ),
      sorter: true,
      sortOrder: sortField === 'eventDate' ? sortOrder : null,
    },
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
      className: 'hidden lg:table-cell',
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
        <CompanyUpdateRowActions
          record={record}
          onNavigate={navigate}
          onDeleteClick={(r) => { setSelectedUpdate(r); setIsDeleteModalOpen(true); }}
        />
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Company Updates
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage and organize your company news, events, and updates
            </p>
          </div>
          <PermissionWrapper resource="company-updates" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/company-updates/new')}
              className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
              style={{
                backgroundColor: '#1f2937',
                borderColor: '#1f2937',
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Create Update
            </Button>
          </PermissionWrapper>
        </div>

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search updates by title, heading, or description..."
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
                placeholder="Filter by Category"
                allowClear
                size="large"
                style={{ width: 200 }}
                value={categoryFilter}
                onChange={(value) => {
                  setCategoryFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
                optionFilterProp="label"
                options={categories.map((c) => ({ value: c._id, label: c.name || c.slug }))}
              />
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

        {/* Company Updates Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          bodyStyle={{ padding: 0 }}
        >
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={companyUpdates}
              loading={loading}
              rowKey="_id"
              className="custom-table company-updates-table"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} updates`,
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
              onChange={handleTableChange}
              onRow={(record) => ({
                onClick: () => {
                  if (hasPermission('company-updates', 'update')) {
                    navigate(`/company-updates/${record._id}`);
                  }
                },
                className: hasPermission('company-updates', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
              })}
            />
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Company Update"
          content={`Are you sure you want to delete "${selectedUpdate?.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedUpdate(null);
          }}
          okText="Delete"
        />
      </div>
    </MainLayout>
  );
};

export default CompanyUpdates;

