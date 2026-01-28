import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Empty,
  Spin,
  Tabs,
  Input,
  Select,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  FileTextOutlined,
  FileOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  EditOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import WorkflowStatusBadge from '../components/workflow/WorkflowStatusBadge';
import * as pageService from '../services/pageService';
import * as sectionService from '../services/sectionService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Search } = Input;
const { Option } = Select;

const Workflow = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState(null);
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchWorkflowItems();
  }, [statusFilter, resourceTypeFilter]);

  const fetchWorkflowItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (searchText) {
        params.search = searchText;
      }
      // Remove limit to get all items for workflow view
      params.limit = 1000;

      const pagesResponse = resourceTypeFilter !== 'sections' 
        ? await pageService.getAllPages(params)
        : { success: true, data: { pages: [] } };

      if (pagesResponse.success) {
        setPages(pagesResponse.data.pages || []);
      }

      // For sections, we'll fetch them from pages that have sections
      // Since there's no direct "get all sections" endpoint, we'll get sections from pages
      // Only fetch sections if not filtering to pages only
      if (resourceTypeFilter !== 'pages') {
        // Get a limited set of pages to fetch sections from (to avoid too many API calls)
        const pagesToCheck = pagesResponse.data?.pages?.slice(0, 50) || [];
        const sectionsPromises = pagesToCheck.map(page => 
          sectionService.getPageSections(page._id, true).catch(() => ({ success: true, data: { sections: [] } }))
        );
        const sectionsResponses = await Promise.all(sectionsPromises);
        const allSections = sectionsResponses
          .filter(res => res.success && res.data?.sections)
          .flatMap(res => res.data.sections)
          .filter(section => {
            if (statusFilter && section.status !== statusFilter) return false;
            if (searchText) {
              const searchLower = searchText.toLowerCase();
              return section.sectionTypeSlug?.toLowerCase().includes(searchLower);
            }
            return true;
          });
        setSections(allSections);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching workflow items:', error);
      toast.error('Failed to load workflow items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchWorkflowItems();
  };

  const getUserName = (user) => {
    if (!user) return 'System';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Unknown';
  };

  // Calculate statistics
  const stats = {
    draft: pages.filter(p => p.status === 'draft').length + sections.filter(s => s.status === 'draft').length,
    in_review: pages.filter(p => p.status === 'in_review').length + sections.filter(s => s.status === 'in_review').length,
    pending_approval: pages.filter(p => p.status === 'pending_approval').length + sections.filter(s => s.status === 'pending_approval').length,
    pending_publish: pages.filter(p => p.status === 'pending_publish').length + sections.filter(s => s.status === 'pending_publish').length,
    published: pages.filter(p => p.status === 'published').length + sections.filter(s => s.status === 'published').length,
    changes_requested: pages.filter(p => p.status === 'changes_requested').length + sections.filter(s => s.status === 'changes_requested').length,
    archived: pages.filter(p => p.status === 'archived').length + sections.filter(s => s.status === 'archived').length,
  };

  const pageColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white">
            <FileTextOutlined />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{text}</span>
            <span className="text-xs text-gray-500">{record.slug}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => <WorkflowStatusBadge status={status} />,
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 150,
      render: (user) => <span className="text-gray-700">{getUserName(user)}</span>,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
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
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/pages/${record._id}`)}
          className="text-white"
          style={{
            backgroundColor: '#1f2937',
            borderColor: '#1f2937',
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const sectionColumns = [
    {
      title: 'Page',
      dataIndex: 'pageId',
      key: 'pageId',
      render: (page) => <span className="text-gray-700">{page?.title || '—'}</span>,
    },
    {
      title: 'Section Type',
      dataIndex: 'sectionTypeSlug',
      key: 'sectionTypeSlug',
      render: (slug) => <Tag>{slug}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => <WorkflowStatusBadge status={status} />,
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 150,
      render: (user) => <span className="text-gray-700">{getUserName(user)}</span>,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
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
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            if (record.pageId?._id) {
              navigate(`/pages/${record.pageId._id}/sections/${record._id}`);
            }
          }}
          className="text-white"
          style={{
            backgroundColor: '#1f2937',
            borderColor: '#1f2937',
          }}
        >
          View
        </Button>
      ),
    },
  ];

  // Filter data based on active tab and filters
  const getFilteredData = () => {
    let filteredPages = pages;
    let filteredSections = sections;

    // Apply status filter
    if (statusFilter) {
      filteredPages = filteredPages.filter(p => p.status === statusFilter);
      filteredSections = filteredSections.filter(s => s.status === statusFilter);
    }

    // Apply resource type filter
    if (resourceTypeFilter === 'pages') {
      filteredSections = [];
    } else if (resourceTypeFilter === 'sections') {
      filteredPages = [];
    }

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filteredPages = filteredPages.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.slug?.toLowerCase().includes(searchLower)
      );
      filteredSections = filteredSections.filter(s =>
        s.pageId?.title?.toLowerCase().includes(searchLower) ||
        s.sectionTypeSlug?.toLowerCase().includes(searchLower)
      );
    }

    // Apply tab filter
    if (activeTab !== 'all') {
      filteredPages = filteredPages.filter(p => p.status === activeTab);
      filteredSections = filteredSections.filter(s => s.status === activeTab);
    }

    return { filteredPages, filteredSections };
  };

  const { filteredPages, filteredSections } = getFilteredData();
  const allItems = [
    ...filteredPages.map((item) => ({ ...item, type: 'page' })),
    ...filteredSections.map((item) => ({ ...item, type: 'section' })),
  ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));


  const getStatusIcon = (status) => {
    const icons = {
      draft: <EditOutlined />,
      in_review: <EyeOutlined />,
      pending_approval: <ClockCircleOutlined />,
      pending_publish: <CheckCircleOutlined />,
      published: <RocketOutlined />,
      changes_requested: <EditOutlined />,
      archived: <InboxOutlined />,
    };
    return icons[status] || <FileTextOutlined />;
  };

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Workflow Management
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              View and manage all content in the approval workflow
            </p>
          </div>
        </div>

        {/* Statistics */}
        <Row gutter={16} className="mb-6">
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card className="border border-gray-200 shadow-md bg-white">
              <Statistic
                title={<span className="text-gray-700">Draft</span>}
                value={stats.draft}
                prefix={<EditOutlined className="text-gray-600" />}
                valueStyle={{ color: '#111827', fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card className="border border-gray-200 shadow-md bg-white">
              <Statistic
                title={<span className="text-gray-700">In Review</span>}
                value={stats.in_review}
                prefix={<EyeOutlined className="text-gray-600" />}
                valueStyle={{ color: '#111827', fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card className="border border-gray-200 shadow-md bg-white">
              <Statistic
                title={<span className="text-gray-700">Pending Approval</span>}
                value={stats.pending_approval}
                prefix={<ClockCircleOutlined className="text-gray-600" />}
                valueStyle={{ color: '#111827', fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card className="border border-gray-200 shadow-md bg-white">
              <Statistic
                title={<span className="text-gray-700">Pending Publish</span>}
                value={stats.pending_publish}
                prefix={<CheckCircleOutlined className="text-gray-600" />}
                valueStyle={{ color: '#111827', fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card className="border border-gray-200 shadow-md bg-white">
              <Statistic
                title={<span className="text-gray-700">Published</span>}
                value={stats.published}
                prefix={<RocketOutlined className="text-gray-600" />}
                valueStyle={{ color: '#111827', fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card className="border border-gray-200 shadow-md bg-white">
              <Statistic
                title={<span className="text-gray-700">Changes Requested</span>}
                value={stats.changes_requested}
                prefix={<EditOutlined className="text-gray-600" />}
                valueStyle={{ color: '#111827', fontWeight: 600 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Search and Filters Bar */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search by title or slug..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => {
                  if (!e.target.value) {
                    setSearchText('');
                    fetchWorkflowItems();
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
                  setActiveTab(value || 'all');
                }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="draft">Draft</Option>
                <Option value="in_review">In Review</Option>
                <Option value="pending_approval">Pending Approval</Option>
                <Option value="pending_publish">Pending Publish</Option>
                <Option value="published">Published</Option>
                <Option value="changes_requested">Changes Requested</Option>
                <Option value="archived">Archived</Option>
              </Select>
              <Select
                placeholder="Filter by Type"
                allowClear
                size="large"
                style={{ width: 150 }}
                value={resourceTypeFilter}
                onChange={setResourceTypeFilter}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">All Types</Option>
                <Option value="pages">Pages Only</Option>
                <Option value="sections">Sections Only</Option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Content Table */}
        <Card 
          className="border border-gray-200 shadow-md bg-white"
          bodyStyle={{ padding: '24px' }}
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <Spin size="large" />
            </div>
          ) : (
            <div className="workflow-tabs-wrapper">
              <style>{`
                .workflow-tabs-wrapper .ant-tabs-nav {
                  margin: 0 0 24px 0;
                  padding: 0;
                }
                .workflow-tabs-wrapper .ant-tabs-content-holder {
                  padding: 0;
                }
                .workflow-tabs-wrapper .ant-pagination {
                  margin: 16px 0 0 0 !important;
                  padding: 0;
                }
                .workflow-tabs-wrapper .ant-table-pagination {
                  margin: 16px 0 0 0 !important;
                  padding: 0 24px;
                }
              `}</style>
              <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                  setActiveTab(key);
                  setStatusFilter(key === 'all' ? null : key);
                }}
                className="workflow-tabs"
                items={[
                {
                  key: 'all',
                  label: (
                    <span>
                      All Items{' '}
                      <Tag color="blue">{allItems.length}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={[
                        {
                          title: 'Type',
                          key: 'type',
                          width: 100,
                          render: (_, record) => (
                            <Tag color={record.type === 'page' ? 'blue' : 'green'}>
                              {record.type === 'page' ? <FileTextOutlined /> : <FileOutlined />}{' '}
                              {record.type}
                            </Tag>
                          ),
                        },
                        {
                          title: 'Title',
                          key: 'title',
                          render: (_, record) =>
                            record.type === 'page' ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white">
                                  <FileTextOutlined />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{record.title}</span>
                                  <span className="text-xs text-gray-500">{record.slug}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white">
                                  <FileOutlined />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{record.pageId?.title || 'Section'}</span>
                                  <span className="text-xs text-gray-500">
                                    <Tag>{record.sectionTypeSlug}</Tag>
                                  </span>
                                </div>
                              </div>
                            ),
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          width: 150,
                          render: (status) => <WorkflowStatusBadge status={status} />,
                        },
                        {
                          title: 'Updated',
                          dataIndex: 'updatedAt',
                          key: 'updatedAt',
                          width: 150,
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
                          width: 100,
                          render: (_, record) => (
                            <Button
                              type="primary"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => {
                                if (record.type === 'page') {
                                  navigate(`/pages/${record._id}`);
                                } else if (record.pageId?._id) {
                                  navigate(`/pages/${record.pageId._id}/sections/${record._id}`);
                                }
                              }}
                              className="text-white"
                              style={{
                                backgroundColor: '#1f2937',
                                borderColor: '#1f2937',
                              }}
                            >
                              View
                            </Button>
                          ),
                        },
                      ]}
                      dataSource={allItems}
                      rowKey={(record) => `${record.type}-${record._id}`}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                          `${range[0]}-${range[1]} of ${total} items`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                      }}
                      locale={{
                        emptyText: <Empty description="No workflow items found" />,
                      }}
                      className="custom-table workflow-table"
                      scroll={{ x: 'max-content' }}
                    />
                  ),
                },
                {
                  key: 'draft',
                  label: (
                    <span>
                      {getStatusIcon('draft')} Draft{' '}
                      <Tag color="default">{stats.draft}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={pageColumns}
                      dataSource={filteredPages.filter(p => p.status === 'draft')}
                      rowKey="_id"
                      pagination={{ 
                        pageSize: 20, 
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                          `${range[0]}-${range[1]} of ${total} items`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        style: { margin: '16px 24px' },
                      }}
                      locale={{ emptyText: <Empty description="No draft items" /> }}
                      className="custom-table workflow-table"
                      scroll={{ x: 'max-content' }}
                    />
                  ),
                },
                {
                  key: 'in_review',
                  label: (
                    <span>
                      {getStatusIcon('in_review')} In Review{' '}
                      <Tag color="blue">{stats.in_review}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={pageColumns}
                      dataSource={filteredPages.filter(p => p.status === 'in_review')}
                      rowKey="_id"
                      pagination={{ pageSize: 20, showSizeChanger: true }}
                      locale={{ emptyText: <Empty description="No items in review" /> }}
                    />
                  ),
                },
                {
                  key: 'pending_approval',
                  label: (
                    <span>
                      {getStatusIcon('pending_approval')} Pending Approval{' '}
                      <Tag color="purple">{stats.pending_approval}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={pageColumns}
                      dataSource={filteredPages.filter(p => p.status === 'pending_approval')}
                      rowKey="_id"
                      pagination={{ pageSize: 20, showSizeChanger: true }}
                      locale={{ emptyText: <Empty description="No items pending approval" /> }}
                    />
                  ),
                },
                {
                  key: 'pending_publish',
                  label: (
                    <span>
                      {getStatusIcon('pending_publish')} Pending Publish{' '}
                      <Tag color="cyan">{stats.pending_publish}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={pageColumns}
                      dataSource={filteredPages.filter(p => p.status === 'pending_publish')}
                      rowKey="_id"
                      pagination={{ pageSize: 20, showSizeChanger: true }}
                      locale={{ emptyText: <Empty description="No items pending publish" /> }}
                    />
                  ),
                },
                {
                  key: 'published',
                  label: (
                    <span>
                      {getStatusIcon('published')} Published{' '}
                      <Tag color="green">{stats.published}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={pageColumns}
                      dataSource={filteredPages.filter(p => p.status === 'published')}
                      rowKey="_id"
                      pagination={{ pageSize: 20, showSizeChanger: true }}
                      locale={{ emptyText: <Empty description="No published items" /> }}
                    />
                  ),
                },
                {
                  key: 'changes_requested',
                  label: (
                    <span>
                      {getStatusIcon('changes_requested')} Changes Requested{' '}
                      <Tag color="orange">{stats.changes_requested}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={pageColumns}
                      dataSource={filteredPages.filter(p => p.status === 'changes_requested')}
                      rowKey="_id"
                      pagination={{ pageSize: 20, showSizeChanger: true }}
                      locale={{ emptyText: <Empty description="No items with changes requested" /> }}
                    />
                  ),
                },
                ]}
              />
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

export default Workflow;

