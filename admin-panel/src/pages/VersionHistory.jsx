import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Empty,
  Spin,
  Select,
  Breadcrumb,
  Typography,
} from 'antd';
import {
  HomeOutlined,
  HistoryOutlined,
  EyeOutlined,
  ReloadOutlined,
  SwapOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import WorkflowStatusBadge from '../components/workflow/WorkflowStatusBadge';
import VersionViewModal from '../components/workflow/VersionViewModal';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title } = Typography;

const VersionHistory = () => {
  const { resource, id } = useParams();
  const navigate = useNavigate();

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [resource, id]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await versionService.getVersionHistory(resource, id);
      if (response.success) {
        setVersions(response.data.versions || []);
      } else {
        toast.error('Failed to load version history');
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (version) => {
    setViewingVersion(version);
    setIsViewModalOpen(true);
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      navigate(`/versions/${resource}/${id}/compare?v1=${selectedVersions[0]}&v2=${selectedVersions[1]}`);
    } else {
      toast.warning('Please select exactly 2 versions to compare');
    }
  };

  const handleRestoreVersion = async (version) => {
    try {
      const response = await versionService.restoreVersion(resource, id, version.version, {
        changeSummary: `Restored from version ${version.version}`,
      });
      if (response.success) {
        toast.success(`Version ${version.version} restored successfully`);
        fetchVersions();
        // Navigate back to the editor
        navigate(`/${resource}s/${id}`);
      } else {
        toast.error(response.message || 'Failed to restore version');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    }
  };

  const getUserName = (user) => {
    if (!user) return 'System';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Unknown';
  };

  const columns = [
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (version) => (
        <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>
          v{version}
        </Tag>
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
      title: 'Change Type',
      dataIndex: 'changeType',
      key: 'changeType',
      width: 120,
      render: (type) => {
        const colors = {
          created: 'green',
          updated: 'blue',
          status_changed: 'orange',
          deleted: 'red',
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Change Summary',
      dataIndex: 'changeSummary',
      key: 'changeSummary',
      ellipsis: true,
      render: (summary) => summary || '—',
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 150,
      render: (user) => getUserName(user),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => (
        <Tooltip title={dayjs(date).format('MMMM DD, YYYY [at] h:mm A')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, version) => {
        const isLatest = version.version === versions[0]?.version;
        return (
          <Space size="small">
            <Tooltip title="View Version">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewVersion(version)}
              >
                View
              </Button>
            </Tooltip>
            {!isLatest && (
              <Popconfirm
                title="Restore this version?"
                description={`This will restore version ${version.version} as a new draft. Continue?`}
                onConfirm={() => handleRestoreVersion(version)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title="Restore Version">
                  <Button size="small" icon={<ReloadOutlined />} danger>
                    Restore
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  // Build breadcrumb
  const breadcrumbItems = [
    {
      title: (
        <HomeOutlined onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} />
      ),
    },
    {
      title: (
        <span onClick={() => navigate(`/${resource}s`)} style={{ cursor: 'pointer' }}>
          {resource === 'page' ? 'Pages' : 'Sections'}
        </span>
      ),
    },
    {
      title: 'Version History',
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: '16px' }} />

        <Card>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HistoryOutlined />
                Version History
              </Title>
              <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                {versions.length} version{versions.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <Space>
              {selectedVersions.length === 2 && (
                <Button
                  type="primary"
                  icon={<SwapOutlined />}
                  onClick={handleCompareVersions}
                >
                  Compare Selected
                </Button>
              )}
              <Button icon={<ReloadOutlined />} onClick={fetchVersions}>
                Refresh
              </Button>
            </Space>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : versions.length === 0 ? (
            <Empty
              description="No version history available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <Select
                  mode="multiple"
                  placeholder="Select 2 versions to compare"
                  value={selectedVersions}
                  onChange={setSelectedVersions}
                  style={{ width: '100%', maxWidth: '400px' }}
                  maxTagCount={2}
                >
                  {versions.map((version) => (
                    <Select.Option key={version.version} value={version.version}>
                      Version {version.version} - {version.status} ({dayjs(version.createdAt).format('MMM DD, YYYY')})
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <Table
                columns={columns}
                dataSource={versions}
                rowKey="version"
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} versions`,
                }}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: selectedVersions,
                  onChange: (keys) => {
                    if (keys.length <= 2) {
                      setSelectedVersions(keys);
                    }
                  },
                  getCheckboxProps: (record) => ({
                    disabled: selectedVersions.length >= 2 && !selectedVersions.includes(record.version),
                  }),
                }}
                scroll={{ x: 1000 }}
              />
            </>
          )}
        </Card>

        <VersionViewModal
          open={isViewModalOpen}
          version={viewingVersion}
          resourceType={resource}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingVersion(null);
          }}
        />
      </div>
    </MainLayout>
  );
};

export default VersionHistory;

