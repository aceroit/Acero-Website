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
  SendOutlined,
  EyeOutlined,
  FileTextOutlined,
  FileOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import WorkflowStatusBadge from '../components/workflow/WorkflowStatusBadge';
import * as dashboardService from '../services/dashboardService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const MySubmissions = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getMySubmissions();
      if (response.success) {
        setSubmissions(response.data);
      } else {
        toast.error('Failed to load submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
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
      width: 150,
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
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/pages/${record._id}`)}
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
      width: 150,
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
        >
          View
        </Button>
      ),
    },
  ];

  const allItems = [
    ...(submissions?.submissions?.pages || []).map((item) => ({ ...item, type: 'page' })),
    ...(submissions?.submissions?.sections || []).map((item) => ({ ...item, type: 'section' })),
  ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const breadcrumbItems = [
    {
      title: (
        <HomeOutlined onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} />
      ),
    },
    {
      title: 'My Submissions',
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: '16px' }} />

        <Card>
          <div style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SendOutlined />
              My Submissions
            </Title>
            <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
              Your content that is currently in the workflow (submitted, in review, pending approval, etc.)
            </Text>
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
                      All Submissions{' '}
                      <Tag>
                        {(submissions?.count?.pages || 0) + (submissions?.count?.sections || 0)}
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
                          width: 150,
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
                        showTotal: (total) => `Total ${total} submissions`,
                      }}
                      locale={{
                        emptyText: <Empty description="No submissions found" />,
                      }}
                    />
                  ),
                },
                {
                  key: 'pages',
                  label: (
                    <span>
                      Pages <Tag color="blue">{submissions?.count?.pages || 0}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={pageColumns}
                      dataSource={submissions?.submissions?.pages || []}
                      rowKey="_id"
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} pages`,
                      }}
                      locale={{
                        emptyText: <Empty description="No submitted pages" />,
                      }}
                    />
                  ),
                },
                {
                  key: 'sections',
                  label: (
                    <span>
                      Sections <Tag color="green">{submissions?.count?.sections || 0}</Tag>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={sectionColumns}
                      dataSource={submissions?.submissions?.sections || []}
                      rowKey="_id"
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} sections`,
                      }}
                      locale={{
                        emptyText: <Empty description="No submitted sections" />,
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

export default MySubmissions;

