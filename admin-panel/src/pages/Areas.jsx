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
  EnvironmentOutlined,
  StarOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as areaService from '../services/areaService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const AreaRowActions = ({ record, onNavigate, onDeleteClick }) => {
  const { hasPermission } = usePermissions();
  const workflowStatus = useWorkflowStatus({
    status: record?.status || 'draft',
    resourceType: 'area',
    createdBy: record?.createdBy?._id || record?.createdBy,
  });
  const menuItems = [];
  if (hasPermission('areas', 'update') && workflowStatus.canEdit.canEdit) {
    menuItems.push({ key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => onNavigate(`/areas/${record._id}`) });
  }
  if (hasPermission('areas', 'delete') && workflowStatus.canDelete.canDelete) {
    menuItems.push({ key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => onDeleteClick(record) });
  }
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Button type="text" icon={<MoreOutlined />} className="hover:bg-gray-100" disabled={menuItems.length === 0} />
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

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('ascend');
  const [selectedArea, setSelectedArea] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Fetch areas
  const fetchAreas = async (params = {}) => {
    setLoading(true);
    try {
      const sortBy = params.sortBy ?? sortField;
      const sortOrderApi = (params.sortOrder ?? sortOrder) === 'descend' ? 'desc' : 'asc';
      const response = await areaService.getAllAreas({
        page: params.page ?? pagination.current,
        limit: params.limit ?? pagination.pageSize,
        search: params.search !== undefined ? params.search : searchText,
        status: params.status !== undefined ? params.status : statusFilter,
        sortBy: params.sortBy ?? sortBy,
        sortOrder: params.sortOrder ?? sortOrderApi,
        ...params,
      });

      if (response.success) {
        setAreas(response.data.areas || response.data || []);
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
      toast.error(error.response?.data?.message || 'Failed to fetch areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, [statusFilter, sortField, sortOrder]);

  // Handle delete area
  const handleDelete = async () => {
    try {
      const response = await areaService.deleteArea(selectedArea._id);
      if (response.success) {
        toast.success('Area deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedArea(null);
        fetchAreas();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete area');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchAreas({ search: value });
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    if (paginationConfig && (paginationConfig.current !== pagination.current || paginationConfig.pageSize !== pagination.pageSize)) {
      const newCurrent = paginationConfig.current ?? pagination.current;
      const newPageSize = paginationConfig.pageSize ?? pagination.pageSize;
      setPagination((prev) => ({ ...prev, current: newCurrent, pageSize: newPageSize }));
      fetchAreas({ page: newCurrent, limit: newPageSize });
      return;
    }
    if (sorter?.field != null && sorter?.order != null) {
      setSortField(sorter.field);
      setSortOrder(sorter.order);
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Area',
      key: 'area',
      dataIndex: 'name',
      sorter: true,
      sortOrder: sortField === 'name' ? sortOrder : null,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <EnvironmentOutlined />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">{record.name}</span>
              {record.featured && (
                <Tag icon={<StarOutlined />} color="gold" className="text-xs flex-shrink-0">
                  Featured
                </Tag>
              )}
            </div>
            <span className="text-xs text-gray-500 truncate">
              Code: {record.code}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
          {code}
        </code>
      ),
      width: 100,
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
      sortOrder: sortField === 'createdAt' ? sortOrder : null,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <AreaRowActions
          record={record}
          onNavigate={(path) => navigate(path)}
          onDeleteClick={(r) => { setSelectedArea(r); setIsDeleteModalOpen(true); }}
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
              Areas
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage areas for location references
            </p>
          </div>
          <PermissionWrapper resource="areas" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/areas/new')}
              className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
              style={{
                backgroundColor: '#1f2937',
                borderColor: '#1f2937',
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Create Area
            </Button>
          </PermissionWrapper>
        </div>

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search areas by name or code..."
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

        {/* Areas Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={areas}
            loading={loading}
            rowKey="_id"
            className="custom-table areas-table"
            onChange={handleTableChange}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                total > 0 ? `${range[0]}-${range[1]} of ${total} areas` : '0 areas',
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPagination((prev) => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
                fetchAreas({ page, limit: pageSize || pagination.pageSize });
              },
            }}
            scroll={{ x: 'max-content', y: 'calc(100vh - 380px)' }}
            onRow={(record) => ({
              onClick: () => {
                if (hasPermission('areas', 'update')) {
                  navigate(`/areas/${record._id}`);
                }
              },
              className: hasPermission('areas', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
            })}
          />
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Area"
          content={`Are you sure you want to delete "${selectedArea?.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedArea(null);
          }}
          okText="Delete"
        />
      </div>
    </MainLayout>
  );
};

export default Areas;

