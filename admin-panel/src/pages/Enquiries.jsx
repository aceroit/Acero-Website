import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Card, Tag, Select, Dropdown, Space, DatePicker } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  MessageOutlined,
  MailOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import * as enquiryService from '../services/enquiryService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Status color mapping
const getStatusColor = (status) => {
  const colors = {
    new: 'blue',
    read: 'cyan',
    replied: 'green',
    archived: 'default',
  };
  return colors[status] || 'default';
};

// Status display names
const getStatusLabel = (status) => {
  const labels = {
    new: 'New',
    read: 'Read',
    replied: 'Replied',
    archived: 'Archived',
  };
  return labels[status] || status;
};

// Purpose display names
const getPurposeLabel = (purpose) => {
  const labels = {
    general: 'General Inquiry',
    sales: 'Sales Inquiry',
    support: 'Support Request',
    partnership: 'Partnership Inquiry',
    other: 'Other',
  };
  return labels[purpose] || purpose;
};

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Fetch enquiries
  const fetchEnquiries = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter,
        ...params,
      };

      // Add date range filters if selected
      if (dateRange && dateRange.length === 2) {
        queryParams.startDate = dateRange[0].startOf('day').toISOString();
        queryParams.endDate = dateRange[1].endOf('day').toISOString();
      }

      const response = await enquiryService.getAllEnquiries(queryParams);

      if (response.success) {
        setEnquiries(response.data.enquiries || response.data || []);
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
      toast.error(error.response?.data?.message || 'Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [pagination.current, pagination.pageSize, statusFilter, dateRange]);

  // Handle delete enquiry
  const handleDelete = async () => {
    try {
      const response = await enquiryService.deleteEnquiry(selectedEnquiry._id);
      if (response.success) {
        toast.success('Enquiry deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedEnquiry(null);
        fetchEnquiries();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete enquiry');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchEnquiries({ search: value });
  };

  // Table columns
  const columns = [
    {
      title: 'Enquiry',
      key: 'enquiry',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white">
            <MessageOutlined />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{record.subject}</span>
              {record.status === 'new' && (
                <Tag color="blue" className="text-xs">
                  New
                </Tag>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {record.fullName} • {record.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose) => (
        <Tag color="blue" className="text-xs">
          {getPurposeLabel(purpose)}
        </Tag>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-900">{record.fullName}</span>
          <span className="text-gray-500 text-xs">{record.email}</span>
          {record.mobileNumber && (
            <span className="text-gray-500 text-xs">{record.mobileNumber}</span>
          )}
        </div>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      render: (country) => (
        <span className="text-gray-700 text-sm">{country || '—'}</span>
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
        { text: 'Read', value: 'read' },
        { text: 'Replied', value: 'replied' },
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
              <PermissionWrapper permission="enquiries" action="update">
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/enquiries-applications/enquiries/${record._id}`);
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
              <PermissionWrapper permission="enquiries" action="delete">
                <div
                  className="flex items-center gap-2 text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEnquiry(record);
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
              Enquiries
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage contact form submissions
            </p>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search enquiries by name, email, subject, or message..."
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
                <Option value="read">Read</Option>
                <Option value="replied">Replied</Option>
                <Option value="archived">Archived</Option>
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

        {/* Enquiries Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={enquiries}
            loading={loading}
            rowKey="_id"
            className="custom-table enquiries-table"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} enquiries`,
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
                if (hasPermission('enquiries', 'update')) {
                  navigate(`/enquiries-applications/enquiries/${record._id}`);
                }
              },
              className: hasPermission('enquiries', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
            })}
          />
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Enquiry"
          content={`Are you sure you want to delete the enquiry from "${selectedEnquiry?.fullName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedEnquiry(null);
          }}
          okText="Delete"
          cancelText="Cancel"
        />
      </div>
    </MainLayout>
  );
};

export default Enquiries;

