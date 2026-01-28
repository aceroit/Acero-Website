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
  BgColorsOutlined,
  StarOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import { WorkflowStatusBadge } from '../components/workflow';
import * as websiteAppearanceService from '../services/websiteAppearanceService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const WebsiteAppearanceRowActions = ({ record, onNavigate, onDeleteClick }) => {
  const { hasPermission } = usePermissions();
  const workflowStatus = useWorkflowStatus({
    status: record?.status || 'draft',
    resourceType: 'website-appearance',
    createdBy: record?.createdBy?._id || record?.createdBy,
  });
  const menuItems = [];
  if (hasPermission('website-appearance', 'update') && workflowStatus.canEdit.canEdit) {
    menuItems.push({ key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => onNavigate(`/website-configurations/appearance/${record._id}`) });
  }
  if (hasPermission('website-appearance', 'delete') && workflowStatus.canDelete.canDelete) {
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

const WebsiteAppearances = () => {
  const [appearances, setAppearances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [featuredFilter, setFeaturedFilter] = useState(null);
  const [selectedAppearance, setSelectedAppearance] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Fetch website appearances
  const fetchAppearances = async (params = {}) => {
    setLoading(true);
    try {
      const response = await websiteAppearanceService.getAllWebsiteAppearances({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
        featured: featuredFilter,
        ...params,
      });

      if (response.success) {
        const list = Array.isArray(response.data?.websiteAppearances)
          ? response.data.websiteAppearances
          : Array.isArray(response.data?.appearances)
            ? response.data.appearances
            : Array.isArray(response.data)
              ? response.data
              : Array.isArray(response.data?.data)
                ? response.data.data
                : [];
        setAppearances(list);
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
      toast.error(error.response?.data?.message || 'Failed to fetch website appearances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppearances();
  }, [pagination.current, pagination.pageSize, statusFilter, featuredFilter]);

  // Handle delete appearance
  const handleDelete = async () => {
    try {
      const response = await websiteAppearanceService.deleteWebsiteAppearance(selectedAppearance._id);
      if (response.success) {
        toast.success('Website appearance deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedAppearance(null);
        fetchAppearances();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete website appearance');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchAppearances({ search: value });
  };

  // Table columns
  const columns = [
    {
      title: 'Appearance',
      key: 'appearance',
      sorter: true,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
            <BgColorsOutlined />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{record.title || 'Website Appearance'}</span>
              {record.featured && (
                <Tag icon={<StarOutlined />} color="gold" className="text-xs">
                  Featured
                </Tag>
              )}
            </div>
            <span className="text-xs text-gray-500">
              Primary: {record.colorPalette?.lightMode?.primary?.value || 'N/A'}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <WorkflowStatusBadge status={status} />
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
      title: 'Featured',
      dataIndex: 'featured',
      key: 'featured',
      render: (featured) => (
        <Tag color={featured ? 'gold' : 'default'}>
          {featured ? 'Yes' : 'No'}
        </Tag>
      ),
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
      render: (_, record) => (
        <WebsiteAppearanceRowActions
          record={record}
          onNavigate={(path) => navigate(path)}
          onDeleteClick={(r) => {
            setSelectedAppearance(r);
            setIsDeleteModalOpen(true);
          }}
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
              Website Appearances
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage website appearance and design configurations
            </p>
          </div>
          <PermissionWrapper resource="website-appearance" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/website-configurations/appearance/new')}
              className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
              style={{
                backgroundColor: '#1f2937',
                borderColor: '#1f2937',
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Create Website Appearance
            </Button>
          </PermissionWrapper>
        </div>

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search appearances by title..."
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
              <Select
                placeholder="Filter by Featured"
                allowClear
                size="large"
                style={{ width: 150 }}
                value={featuredFilter}
                onChange={(value) => {
                  setFeaturedFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="true">Featured</Option>
                <Option value="false">Not Featured</Option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Appearances Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={appearances}
            loading={loading}
            rowKey="_id"
            className="custom-table website-appearances-table"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} appearances`,
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
                if (hasPermission('website-appearance', 'update')) {
                  navigate(`/website-configurations/appearance/${record._id}`);
                }
              },
              className: hasPermission('website-appearance', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
            })}
          />
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Website Appearance"
          content={`Are you sure you want to delete "${selectedAppearance?.title || 'this appearance'}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedAppearance(null);
          }}
          okText="Delete"
        />
      </div>
    </MainLayout>
  );
};

export default WebsiteAppearances;

