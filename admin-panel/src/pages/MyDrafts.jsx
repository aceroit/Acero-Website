import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Empty,
  Spin,
  Tabs,
  Breadcrumb,
  Typography,
  Tooltip,
} from 'antd';
import {
  HomeOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FileOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import WorkflowStatusBadge from '../components/workflow/WorkflowStatusBadge';
import * as dashboardService from '../services/dashboardService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const MyDrafts = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getMyDrafts();
      if (response.success) {
        setDrafts(response.data);
      } else {
        toast.error('Failed to load drafts');
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const pageColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            <code>{record.slug}</code>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <WorkflowStatusBadge status={status} />,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (date) => (
        <Tooltip title={dayjs(date).format('MMMM DD, YYYY [at] h:mm A')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
      sorter: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/pages/${record._id}`)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  const sectionColumns = [
    {
      title: 'Page',
      dataIndex: 'pageId',
      key: 'pageId',
      render: (page) => page?.title || '—',
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
      width: 120,
      render: (status) => <WorkflowStatusBadge status={status} />,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (date) => (
        <Tooltip title={dayjs(date).format('MMMM DD, YYYY [at] h:mm A')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
      sorter: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
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
        >
          Edit
        </Button>
      ),
    },
  ];

  const allItems = [
    ...(drafts?.drafts?.pages || []).map((item) => ({ ...item, type: 'page' })),
    ...(drafts?.drafts?.sections || []).map((item) => ({ ...item, type: 'section' })),
  ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const breadcrumbItems = [
    {
      title: (
        <HomeOutlined onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} />
      ),
    },
    {
      title: 'My Drafts',
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: '16px' }} />

        <Card>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EditOutlined />
                My Drafts
              </Title>
              <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                Your draft content that hasn't been submitted for review
              </Text>
            </div>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/pages/new')}
              >
                New Page
              </Button>
            </Space>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'all',
                  label: (
                    <span>
                      All Drafts{' '}
                      <Tag>
                        {(drafts?.count?.pages || 0) + (drafts?.count?.sections || 0)}
                      </Tag>
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
                              <div>
                                <Text strong>{record.title}</Text>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                  <code>{record.slug}</code>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <Text strong>{record.pageId?.title || 'Section'}</Text>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                  <Tag>{record.sectionTypeSlug}</Tag>
                                </div>
                              </div>
                            ),
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          width: 120,
                          render: (status) => <WorkflowStatusBadge status={status} />,
                        },
                        {
                          title: 'Updated',
                          dataIndex: 'updatedAt',
                          key: 'updatedAt',
                          width: 150,
                          render: (date) => (
                            <Tooltip title={dayjs(date).format('MMMM DD, YYYY [at] h:mm A')}>
                              {dayjs(date).fromNow()}
                            </Tooltip>
                          ),
                        },
                        {
                          title: 'Actions',
                          key: 'actions',
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
                            >
                              Edit
                            </Button>
                          ),
                        },
                      ]}
                      dataSource={allItems}
                      rowKey={(record) => `${record.type}-${record._id}`}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} drafts`,
                      }}
                      locale={{
                        emptyText: <Empty description="No drafts found" />,
                      }}
                    />
                  ),
                },
                {
                  key: 'pages',
                  label: (
                    <span>
                      Pages <Tag color="blue">{drafts?.count?.pages || 0}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={pageColumns}
                      dataSource={drafts?.drafts?.pages || []}
                      rowKey="_id"
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} pages`,
                      }}
                      locale={{
                        emptyText: <Empty description="No draft pages" />,
                      }}
                    />
                  ),
                },
                {
                  key: 'sections',
                  label: (
                    <span>
                      Sections <Tag color="green">{drafts?.count?.sections || 0}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={sectionColumns}
                      dataSource={drafts?.drafts?.sections || []}
                      rowKey="_id"
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} sections`,
                      }}
                      locale={{
                        emptyText: <Empty description="No draft sections" />,
                      }}
                    />
                  ),
                },
              ]}
            />
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

export default MyDrafts;

