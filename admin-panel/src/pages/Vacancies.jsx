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
  ProjectOutlined,
  StarOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge } from '../components/workflow';
import * as vacancyService from '../services/vacancyService';
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

const Vacancies = () => {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [featuredFilter, setFeaturedFilter] = useState(null);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Fetch vacancies
  const fetchVacancies = async (params = {}) => {
    setLoading(true);
    try {
      const response = await vacancyService.getAllVacancies({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
        featured: featuredFilter,
        ...params,
      });

      if (response.success) {
        setVacancies(response.data.vacancies || response.data || []);
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
      toast.error(error.response?.data?.message || 'Failed to fetch vacancies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, [pagination.current, pagination.pageSize, statusFilter, featuredFilter]);

  // Handle delete vacancy
  const handleDelete = async () => {
    try {
      const response = await vacancyService.deleteVacancy(selectedVacancy._id);
      if (response.success) {
        toast.success('Vacancy deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedVacancy(null);
        fetchVacancies();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete vacancy');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchVacancies({ search: value });
  };

  // Table columns
  const columns = [
    {
      title: 'Vacancy',
      key: 'vacancy',
      sorter: true,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white">
            <ProjectOutlined />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{record.title}</span>
              {record.featured && (
                <Tag icon={<StarOutlined />} color="gold" className="text-xs">
                  Featured
                </Tag>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {record.department} • {record.location} • {record.type}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (department) => (
        <span className="text-gray-700 text-sm">{department || '—'}</span>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location) => (
        <span className="text-gray-700 text-sm">{location || '—'}</span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color="blue" className="text-xs">
          {type || '—'}
        </Tag>
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
        featured ? (
          <Tag icon={<StarOutlined />} color="gold">
            Featured
          </Tag>
        ) : (
          <span className="text-gray-400">—</span>
        )
      ),
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
        const menuItems = [
          {
            key: 'edit',
            label: (
              <PermissionWrapper permission="vacancies" action="update">
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/enquiries-applications/vacancies/${record._id}`);
                  }}
                >
                  <EditOutlined />
                  <span>Edit</span>
                </div>
              </PermissionWrapper>
            ),
          },
          {
            key: 'delete',
            label: (
              <PermissionWrapper permission="vacancies" action="delete">
                <div
                  className="flex items-center gap-2 text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVacancy(record);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <DeleteOutlined />
                  <span>Delete</span>
                </div>
              </PermissionWrapper>
            ),
          },
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="p-4 md:p-0 space-y-6 md:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Vacancies
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage and organize your job vacancies
            </p>
          </div>
          <PermissionWrapper permission="vacancies" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/enquiries-applications/vacancies/new')}
              className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
              style={{
                backgroundColor: '#1f2937',
                borderColor: '#1f2937',
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Create Vacancy
            </Button>
          </PermissionWrapper>
        </div>

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search vacancies by title, department, or location..."
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

        {/* Vacancies Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={vacancies}
            loading={loading}
            rowKey="_id"
            className="custom-table vacancies-table"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} vacancies`,
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
                if (hasPermission('vacancies', 'update')) {
                  navigate(`/enquiries-applications/vacancies/${record._id}`);
                }
              },
              className: hasPermission('vacancies', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
            })}
          />
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Vacancy"
          content={`Are you sure you want to delete "${selectedVacancy?.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedVacancy(null);
          }}
          okText="Delete"
          cancelText="Cancel"
        />
      </div>
    </MainLayout>
  );
};

export default Vacancies;

