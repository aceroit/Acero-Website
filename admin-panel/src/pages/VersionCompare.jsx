import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Divider,
  Descriptions,
  Empty,
  Spin,
  Breadcrumb,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  HomeOutlined,
  SwapOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import WorkflowStatusBadge from '../components/workflow/WorkflowStatusBadge';
import VersionViewModal from '../components/workflow/VersionViewModal';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const VersionCompare = () => {
  const { resource, id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const v1 = searchParams.get('v1') || searchParams.get('version1');
  const v2 = searchParams.get('v2') || searchParams.get('version2');

  const [version1, setVersion1] = useState(null);
  const [version2, setVersion2] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    if (v1 && v2) {
      fetchComparison();
    } else {
      toast.error('Both version numbers are required');
      navigate(`/versions/${resource}/${id}`);
    }
  }, [resource, id, v1, v2]);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const response = await versionService.compareVersions(resource, id, parseInt(v1), parseInt(v2));
      if (response.success) {
        const comp = response.data.comparison;
        setComparison(comp);
        // Fetch full version data for display
        const [v1Response, v2Response] = await Promise.all([
          versionService.getVersion(resource, id, parseInt(v1)),
          versionService.getVersion(resource, id, parseInt(v2)),
        ]);
        if (v1Response.success) setVersion1(v1Response.data.version);
        if (v2Response.success) setVersion2(v2Response.data.version);
      } else {
        toast.error('Failed to compare versions');
      }
    } catch (error) {
      console.error('Error comparing versions:', error);
      toast.error('Failed to compare versions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (version) => {
    setViewingVersion(version);
    setIsViewModalOpen(true);
  };

  const handleSwapVersions = () => {
    navigate(`/versions/${resource}/${id}/compare?v1=${v2}&v2=${v1}`);
  };

  const getUserName = (user) => {
    if (!user) return 'System';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Unknown';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return <Text type="secondary">null</Text>;
    }
    if (typeof value === 'object') {
      return (
        <pre style={{ margin: 0, fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    if (typeof value === 'string' && value.length > 200) {
      return (
        <div>
          <Text>{value.substring(0, 200)}...</Text>
          <Text type="secondary"> ({value.length} characters)</Text>
        </div>
      );
    }
    return <Text>{String(value)}</Text>;
  };

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
      title: (
        <span onClick={() => navigate(`/versions/${resource}/${id}`)} style={{ cursor: 'pointer' }}>
          Version History
        </span>
      ),
    },
    {
      title: 'Compare Versions',
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: '24px' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px' }}>Loading comparison...</p>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!comparison || !version1 || !version2) {
    return (
      <MainLayout>
        <div style={{ padding: '24px' }}>
          <Breadcrumb items={breadcrumbItems} style={{ marginBottom: '16px' }} />
          <Card>
            <Empty description="Comparison data not available" />
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { diff, summary, changedFields } = comparison;

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: '16px' }} />

        <Card>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SwapOutlined />
              Version Comparison
            </Title>
            <Space>
              <Button icon={<SwapOutlined />} onClick={handleSwapVersions}>
                Swap Versions
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchComparison}>
                Refresh
              </Button>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/versions/${resource}/${id}`)}>
                Back to History
              </Button>
            </Space>
          </div>

          {/* Version Info Cards */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={12}>
              <Card
                size="small"
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <Tag color="blue">Version {version1.version}</Tag>
                      <WorkflowStatusBadge status={version1.status} />
                    </span>
                    <Button
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={() => handleViewVersion(version1)}
                    >
                      View Full
                    </Button>
                  </div>
                }
              >
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Created">
                    {dayjs(version1.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created By">
                    {getUserName(version1.createdBy)}
                  </Descriptions.Item>
                  {version1.changeSummary && (
                    <Descriptions.Item label="Change Summary">
                      {version1.changeSummary}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                size="small"
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <Tag color="green">Version {version2.version}</Tag>
                      <WorkflowStatusBadge status={version2.status} />
                    </span>
                    <Button
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={() => handleViewVersion(version2)}
                    >
                      View Full
                    </Button>
                  </div>
                }
              >
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Created">
                    {dayjs(version2.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created By">
                    {getUserName(version2.createdBy)}
                  </Descriptions.Item>
                  {version2.changeSummary && (
                    <Descriptions.Item label="Change Summary">
                      {version2.changeSummary}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>
          </Row>

          {/* Summary Alert */}
          <Alert
            message={summary}
            type={changedFields.length > 0 ? 'info' : 'success'}
            style={{ marginBottom: '24px' }}
            showIcon
          />

          <Divider>Changes</Divider>

          {/* Changes List */}
          {changedFields.length === 0 ? (
            <Empty description="No changes detected between these versions" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Added Fields */}
              {Object.keys(diff.added || {}).length > 0 && (
                <Card size="small" title={<Tag color="green">Added Fields</Tag>}>
                  {Object.entries(diff.added).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '12px' }}>
                      <Text strong style={{ color: '#52c41a' }}>+ {key}</Text>
                      <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
                        {formatValue(value)}
                      </div>
                    </div>
                  ))}
                </Card>
              )}

              {/* Modified Fields */}
              {Object.keys(diff.modified || {}).length > 0 && (
                <Card size="small" title={<Tag color="orange">Modified Fields</Tag>}>
                  {Object.entries(diff.modified).map(([key, change]) => (
                    <div key={key} style={{ marginBottom: '16px' }}>
                      <Text strong style={{ color: '#fa8c16' }}>~ {key}</Text>
                      <Row gutter={16} style={{ marginTop: '8px' }}>
                        <Col span={12}>
                          <div style={{ padding: '8px', backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: '4px' }}>
                            <Text type="secondary" strong>Version {version1.version}:</Text>
                            <div style={{ marginTop: '4px' }}>{formatValue(change.old)}</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ padding: '8px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
                            <Text type="secondary" strong>Version {version2.version}:</Text>
                            <div style={{ marginTop: '4px' }}>{formatValue(change.new)}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </Card>
              )}

              {/* Removed Fields */}
              {Object.keys(diff.removed || {}).length > 0 && (
                <Card size="small" title={<Tag color="red">Removed Fields</Tag>}>
                  {Object.entries(diff.removed).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '12px' }}>
                      <Text strong style={{ color: '#ff4d4f' }}>- {key}</Text>
                      <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#fff1f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
                        {formatValue(value)}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
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

export default VersionCompare;

