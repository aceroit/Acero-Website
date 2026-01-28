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
  FileTextOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import ConfirmModal from '../components/common/ConfirmModal';
import PermissionWrapper from '../components/common/PermissionWrapper';
import { usePermissions } from '../contexts/PermissionContext';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as pageService from '../services/pageService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

// Row actions with workflow-based visibility (Edit/Delete only when allowed by status + permission)
const PageRowActions = ({ record, onNavigate, onDeleteClick }) => {
  const { hasPermission } = usePermissions();
  const workflowStatus = useWorkflowStatus({
    status: record?.status || 'draft',
    resourceType: 'page',
    createdBy: record?.createdBy?._id || record?.createdBy,
  });
  const menuItems = [];
  if (hasPermission('sections', 'read')) {
    menuItems.push({
      key: 'sections',
      label: 'View Sections',
      icon: <UnorderedListOutlined />,
      onClick: () => onNavigate(`/pages/${record._id}/sections`),
    });
  }
  if (hasPermission('pages', 'update') && workflowStatus.canEdit.canEdit) {
    menuItems.push({
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => onNavigate(`/pages/${record._id}`),
    });
  }
  if (hasPermission('pages', 'delete') && workflowStatus.canDelete.canDelete) {
    menuItems.push({
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDeleteClick(record),
    });
  }
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button type="text" icon={<MoreOutlined />} className="hover:bg-gray-100" />
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

const Pages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('descend');

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Fetch pages
  const fetchPages = async (params = {}) => {
    setLoading(true);
    try {
      const sortBy = params.sortBy ?? sortField;
      const order = params.sortOrder ?? sortOrder;
      const apiParams = {
        page: params.page ?? pagination.current,
        limit: params.limit ?? pagination.pageSize,
        search: params.search !== undefined ? params.search : searchText,
        status: params.status !== undefined ? params.status : statusFilter,
        sortBy: sortBy === 'title' ? 'title' : 'createdAt',
        sortOrder: order === 'ascend' ? 'asc' : 'desc',
      };
      const response = await pageService.getAllPages(apiParams);

      if (response.success) {
        setPages(response.data.pages || response.data || []);
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
      toast.error(error.response?.data?.message || 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [pagination.current, pagination.pageSize, statusFilter, sortField, sortOrder, searchText]);

  // Handle table change (pagination, filters, sort)
  const handleTableChange = (newPagination, newFilters, newSorter) => {
    const newStatus = newFilters?.status?.[0] ?? null;
    const sorter = Array.isArray(newSorter) ? newSorter[0] : newSorter;
    const filterOrSortChanged = statusFilter !== newStatus || (sorter?.field && (sorter.field !== sortField || sorter.order !== sortOrder));

    setPagination((prev) => ({
      ...prev,
      current: filterOrSortChanged ? 1 : newPagination.current,
      pageSize: newPagination.pageSize,
    }));
    setStatusFilter(newStatus);
    if (sorter?.field) {
      setSortField(sorter.field === 'title' ? 'title' : 'createdAt');
      setSortOrder(sorter.order || 'descend');
    }
  };

  // Handle delete page
  const handleDelete = async () => {
    try {
      const response = await pageService.deletePage(selectedPage._id);
      if (response.success) {
        toast.success('Page deleted successfully');
        if (response.data?.pageWasInHeader) {
          toast.warning(
            'This page was in the header. Update Header Configuration to remove its link and keep the site in sync.',
            { autoClose: 8000 }
          );
        }
        setIsDeleteModalOpen(false);
        setSelectedPage(null);
        fetchPages();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete page');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchPages({ search: value });
  };

  // Table columns
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white">
            <FileTextOutlined />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{record.title}</span>
            <span className="text-xs text-gray-500">{record.path}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => (
        <span className="text-gray-700 font-mono text-sm">{slug}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filteredValue: statusFilter ? [statusFilter] : undefined,
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
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (level) => (
        <Tag className="px-2 py-1">{level === 0 ? 'Root' : `Level ${level}`}</Tag>
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
        <PageRowActions
          record={record}
          onNavigate={(path) => navigate(path)}
          onDeleteClick={(page) => {
            setSelectedPage(page);
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
              Pages
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Manage and organize your website pages
            </p>
          </div>
          <Space>
            <Button
              onClick={() => navigate('/pages/tree')}
              size="large"
            >
              View Tree
            </Button>
            <PermissionWrapper resource="pages" action="create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/pages/new')}
                className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all text-white"
                style={{
                  backgroundColor: '#1f2937',
                  borderColor: '#1f2937',
                  height: '44px',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                Create Page
              </Button>
            </PermissionWrapper>
          </Space>
        </div>

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search pages by title, slug, or path..."
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

        {/* Pages Table - only table body scrolls, not the whole page */}
        <Card 
          className="border border-gray-200 shadow-md bg-white overflow-hidden"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={pages}
            loading={loading}
            rowKey="_id"
            className="custom-table pages-table"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} pages`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize,
                }));
              },
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content', y: 'calc(100vh - 380px)' }}
            onRow={(record) => ({
              onClick: () => {
                if (hasPermission('pages', 'update')) {
                  navigate(`/pages/${record._id}`);
                }
              },
              className: hasPermission('pages', 'update') ? 'cursor-pointer hover:bg-gray-50' : '',
            })}
          />
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Page"
          content={`Are you sure you want to delete "${selectedPage?.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedPage(null);
          }}
          okText="Delete"
        />
      </div>
    </MainLayout>
  );
};

export default Pages;

