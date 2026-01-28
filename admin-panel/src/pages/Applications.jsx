import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Card, Tag, Select, Dropdown, Space, DatePicker } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  FileTextOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import * as applicationService from '../services/applicationService';
import * as vacancyService from '../services/vacancyService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Status color mapping
const getStatusColor = (status) => {
  const colors = {
    new: 'blue',
    reviewing: 'cyan',
    shortlisted: 'green',
    rejected: 'red',
    archived: 'default',
  };
  return colors[status] || 'default';
};

// Status display names
const getStatusLabel = (status) => {
  const labels = {
    new: 'New',
    reviewing: 'Reviewing',
    shortlisted: 'Shortlisted',
    rejected: 'Rejected',
    archived: 'Archived',
  };
  return labels[status] || status;
};

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [vacancyFilter, setVacancyFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Fetch vacancies for filter dropdown
  useEffect(() => {
    const fetchVacancies = async () => {
      setVacanciesLoading(true);
      try {
        const response = await vacancyService.getAllVacancies({
          page: 1,
          limit: 1000, // Get all vacancies for filter
          status: 'published', // Only show published vacancies
        });
        if (response.success) {
          setVacancies(response.data.vacancies || response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch vacancies:', error);
      } finally {
        setVacanciesLoading(false);
      }
    };
    fetchVacancies();
  }, []);

  // Fetch applications
  const fetchApplications = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
        vacancyId: vacancyFilter,
        ...params,
      };

      // Add date range filters if selected
      if (dateRange && dateRange.length === 2) {
        queryParams.startDate = dateRange[0].startOf('day').toISOString();
        queryParams.endDate = dateRange[1].endOf('day').toISOString();
      }

      const response = await applicationService.getAllApplications(queryParams);

      if (response.success) {
        setApplications(response.data.applications || response.data || []);
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
      toast.error(error.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [pagination.current, pagination.pageSize, statusFilter, vacancyFilter, dateRange]);

  // Handle delete application
  const handleDelete = async () => {
    try {
      const response = await applicationService.deleteApplication(selectedApplication._id);
      if (response.success) {
        toast.success('Application deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedApplication(null);
        fetchApplications();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete application');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchApplications({ search: value });
  };

  // Table columns
  const columns = [
    {
      title: 'Application',
      key: 'application',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white">
            <FileTextOutlined />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {record.firstName} {record.lastName}
              </span>
              {record.status === 'new' && (
                <Tag color="blue" className="text-xs">
                  New
                </Tag>
              )}
            </div>
            <span className="text-xs text-gray-500">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Vacancy',
      key: 'vacancy',
      render: (_, record) => (
        record.vacancyId ? (
          <div className="flex items-center gap-2">
            <ProjectOutlined className="text-gray-400" />
            <div className="flex flex-col">
              <span className="text-gray-900 text-sm font-medium">
                {record.vacancyId.title || 'N/A'}
              </span>
              <span className="text-gray-500 text-xs">
                {record.vacancyId.department || ''} • {record.vacancyId.location || ''}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-900">{record.mobileNumber}</span>
          <span className="text-gray-500 text-xs">{record.country}</span>
        </div>
      ),
    },
    {
      title: 'Experience',
      dataIndex: 'experienceLevel',
      key: 'experienceLevel',
      render: (level) => (
        <span className="text-gray-700 text-sm">{level || '—'}</span>
      ),
    },
    {
      title: 'Education',
      dataIndex: 'educationLevel',
      key: 'educationLevel',
      render: (level) => (
        <span className="text-gray-700 text-sm">{level || '—'}</span>
      ),
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
        { text: 'New', value: 'new' },
        { text: 'Reviewing', value: 'reviewing' },
        { text: 'Shortlisted', value: 'shortlisted' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Archived', value: 'archived' },
      ],
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-900">
            {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
          </span>
          <span className="text-gray-500 text-xs">
            {date ? dayjs(date).format('HH:mm') : '—'}
          </span>
        </div>
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
              <PermissionWrapper permission="applications" action="update">
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/enquiries-applications/applications/${record._id}`);
                  }}
                >
                  <EditOutlined />
                  <span>View/Edit</span>
                </div>
              </PermissionWrapper>
            ),
          },
          {
            key: 'delete',
            label: (
              <PermissionWrapper permission="applications" action="delete">
                <div
                  className="flex items-center gap-2 text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedApplication(record);
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
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Applications
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage job applications
            </p>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search applications by name, email, or vacancy..."
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
                <Option value="new">New</Option>
                <Option value="reviewing">Reviewing</Option>
                <Option value="shortlisted">Shortlisted</Option>
                <Option value="rejected">Rejected</Option>
                <Option value="archived">Archived</Option>
              </Select>
              <Select
                placeholder="Filter by Vacancy"
                allowClear
                size="large"
                style={{ width: 250 }}
                value={vacancyFilter}
                onChange={(value) => {
                  setVacancyFilter(value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
                loading={vacanciesLoading}
                showSearch
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {vacancies.map((vacancy) => (
                  <Option key={vacancy._id} value={vacancy._id}>
                    {vacancy.title} - {vacancy.department}
                  </Option>
                ))}
              </Select>
              <RangePicker
                size="large"
                style={{ width: 280 }}
                placeholder={['Start Date', 'End Date']}
                onChange={(dates) => {
                  setDateRange(dates);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                format="YYYY-MM-DD"
              />
            </div>
          </div>
        </Card>

        {/* Applications Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={applications}
            loading={loading}
            rowKey="_id"
            className="custom-table applications-table"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} applications`,
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
                if (hasPermission('applications', 'update')) {
                  navigate(`/enquiries-applications/applications/${record._id}`);
                }
              },
              className: hasPermission('applications', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
            })}
          />
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Application"
          content={`Are you sure you want to delete the application from "${selectedApplication?.firstName} ${selectedApplication?.lastName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedApplication(null);
          }}
          okText="Delete"
          cancelText="Cancel"
        />
      </div>
    </MainLayout>
  );
};

export default Applications;

