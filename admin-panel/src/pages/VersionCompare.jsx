import { useEffect, useMemo, useState } from 'react';
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

const RESOURCE_CONFIG = {
  page: {
    singularLabel: 'Page',
    pluralLabel: 'Pages',
    listRoute: '/pages',
    historyRoute: (id) => `/versions/page/${id}`,
    editorRoute: (id) => `/pages/${id}`,
  },
  section: {
    singularLabel: 'Section',
    pluralLabel: 'Sections',
    listRoute: '/sections',
    historyRoute: (id) => `/versions/section/${id}`,
    editorRoute: (id) => `/sections/${id}`,
  },
  project: {
    singularLabel: 'Project',
    pluralLabel: 'Projects',
    listRoute: '/projects',
    historyRoute: (id) => `/versions/project/${id}`,
    editorRoute: (id) => `/projects/${id}`,
  },
  vacancy: {
    singularLabel: 'Vacancy',
    pluralLabel: 'Vacancies',
    listRoute: '/enquiries-applications/vacancies',
    historyRoute: (id) => `/versions/vacancy/${id}`,
    editorRoute: (id) => `/enquiries-applications/vacancies/${id}`,
  },
};

const getFallbackResourceConfig = (resource, id) => ({
  singularLabel: resource ? resource.charAt(0).toUpperCase() + resource.slice(1) : 'Resource',
  pluralLabel: resource ? `${resource.charAt(0).toUpperCase() + resource.slice(1)}s` : 'Resources',
  listRoute: `/${resource}s`,
  historyRoute: () => `/versions/${resource}/${id}`,
  editorRoute: () => `/${resource}s/${id}`,
});

const VersionCompare = () => {
  const { resource, id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const v1 = searchParams.get('v1') || searchParams.get('version1');
  const v2 = searchParams.get('v2') || searchParams.get('version2');
  const mode = searchParams.get('mode');
  const isLiveDraftMode = mode === 'live-draft';

  const [version1, setVersion1] = useState(null);
  const [version2, setVersion2] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [activeRevision, setActiveRevision] = useState(null);

  const resourceConfig = useMemo(
    () => RESOURCE_CONFIG[resource] || getFallbackResourceConfig(resource, id),
    [resource, id]
  );

  useEffect(() => {
    if (isLiveDraftMode) {
      fetchLiveDraftComparison();
      return;
    }

    if (v1 && v2) {
      fetchVersionComparison();
      return;
    }

    toast.error('Both version numbers are required');
    navigate(resourceConfig.historyRoute(id));
  }, [resource, id, v1, v2, isLiveDraftMode]);

  const fetchVersionComparison = async () => {
    setLoading(true);
    try {
      const response = await versionService.compareVersions(resource, id, parseInt(v1, 10), parseInt(v2, 10));
      if (!response.success) {
        throw new Error(response.message || 'Failed to compare versions');
      }

      setComparison(response.data.comparison);
      setResourceTitle(response.data.resourceTitle || '');
      setActiveRevision(null);

      const [versionOneResponse, versionTwoResponse] = await Promise.all([
        versionService.getVersion(resource, id, parseInt(v1, 10)),
        versionService.getVersion(resource, id, parseInt(v2, 10)),
      ]);

      if (versionOneResponse.success) {
        setVersion1(versionOneResponse.data.version);
      }
      if (versionTwoResponse.success) {
        setVersion2(versionTwoResponse.data.version);
      }
    } catch (error) {
      console.error('Error comparing versions:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to compare versions');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveDraftComparison = async () => {
    setLoading(true);
    try {
      const response = await versionService.compareLiveDraft(resource, id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to compare live and draft content');
      }

      setVersion1(response.data.version1);
      setVersion2(response.data.version2);
      setComparison(response.data.comparison);
      setResourceTitle(response.data.resourceTitle || '');
      setActiveRevision(response.data.activeRevision || null);
    } catch (error) {
      console.error('Error comparing live and draft content:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to compare live and draft content');
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

  const handleBack = () => {
    navigate(isLiveDraftMode ? resourceConfig.editorRoute(id) : resourceConfig.historyRoute(id));
  };

  const getUserName = (user) => {
    if (!user) return 'System';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Unknown';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <Text type="secondary">-</Text>;
    }

    if (Array.isArray(value)) {
      if (!value.length) return <Text type="secondary">-</Text>;
      const simpleValues = value.every(
        (item) => item === null || ['string', 'number', 'boolean'].includes(typeof item)
      );

      if (simpleValues) {
        return (
          <Space wrap>
            {value.map((item, index) => (
              <Tag key={`${String(item)}-${index}`}>{String(item)}</Tag>
            ))}
          </Space>
        );
      }
    }

    if (typeof value === 'object') {
      return (
        <pre style={{ margin: 0, fontSize: '12px', maxHeight: '220px', overflow: 'auto' }}>
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

  const breadcrumbItems = [
    {
      title: <HomeOutlined onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} />,
    },
    {
      title: (
        <span onClick={() => navigate(resourceConfig.listRoute)} style={{ cursor: 'pointer' }}>
          {resourceConfig.pluralLabel}
        </span>
      ),
    },
    ...(isLiveDraftMode
      ? [
          {
            title: (
              <span onClick={() => navigate(resourceConfig.editorRoute(id))} style={{ cursor: 'pointer' }}>
                {resourceTitle || resourceConfig.singularLabel}
              </span>
            ),
          },
          {
            title: 'Compare Changes',
          },
        ]
      : [
          {
            title: (
              <span onClick={() => navigate(resourceConfig.historyRoute(id))} style={{ cursor: 'pointer' }}>
                Version History
              </span>
            ),
          },
          {
            title: 'Compare Versions',
          },
        ]),
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

  const { diff = {}, summary, changedFields = [] } = comparison;

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: '16px' }} />

        <Card>
          <div
            style={{
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SwapOutlined />
                {isLiveDraftMode ? 'Live vs Draft Comparison' : 'Version Comparison'}
              </Title>
              <Text type="secondary">{resourceTitle || resourceConfig.singularLabel}</Text>
            </div>
            <Space wrap>
              {!isLiveDraftMode && (
                <Button icon={<SwapOutlined />} onClick={handleSwapVersions}>
                  Swap Versions
                </Button>
              )}
              <Button icon={<ReloadOutlined />} onClick={isLiveDraftMode ? fetchLiveDraftComparison : fetchVersionComparison}>
                Refresh
              </Button>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                {isLiveDraftMode ? 'Back to Editor' : 'Back to History'}
              </Button>
            </Space>
          </div>

          {isLiveDraftMode && activeRevision && (
            <Alert
              showIcon
              type="warning"
              style={{ marginBottom: '24px' }}
              message={`Review staged revision #${activeRevision.revisionNumber || ''}`.trim()}
              description={
                activeRevision.changeSummary ||
                'The published content remains live until this staged revision is approved and published.'
              }
            />
          )}

          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span>
                      <Tag color="blue">{version1.label || `Version ${version1.version}`}</Tag>
                      <WorkflowStatusBadge status={version1.status} />
                    </span>
                    <Button size="small" icon={<FileTextOutlined />} onClick={() => handleViewVersion(version1)}>
                      View Full
                    </Button>
                  </div>
                }
              >
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Updated">
                    {dayjs(version1.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Updated By">
                    {getUserName(version1.createdBy)}
                  </Descriptions.Item>
                  {version1.changeSummary && (
                    <Descriptions.Item label="Change Summary">{version1.changeSummary}</Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span>
                      <Tag color="green">{version2.label || `Version ${version2.version}`}</Tag>
                      <WorkflowStatusBadge status={version2.status} />
                    </span>
                    <Button size="small" icon={<FileTextOutlined />} onClick={() => handleViewVersion(version2)}>
                      View Full
                    </Button>
                  </div>
                }
              >
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Updated">
                    {dayjs(version2.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Updated By">
                    {getUserName(version2.createdBy)}
                  </Descriptions.Item>
                  {version2.changeSummary && (
                    <Descriptions.Item label="Change Summary">{version2.changeSummary}</Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>
          </Row>

          <Alert
            message={summary || 'Comparison loaded successfully'}
            type={changedFields.length > 0 ? 'info' : 'success'}
            style={{ marginBottom: '24px' }}
            showIcon
          />

          <Divider>Changes</Divider>

          {changedFields.length === 0 ? (
            <Empty description="No changes detected between these versions" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.keys(diff.added || {}).length > 0 && (
                <Card size="small" title={<Tag color="green">Added Fields</Tag>}>
                  {Object.entries(diff.added).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '12px' }}>
                      <Text strong style={{ color: '#52c41a' }}>+ {key}</Text>
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '8px',
                          backgroundColor: '#f6ffed',
                          border: '1px solid #b7eb8f',
                          borderRadius: '4px',
                        }}
                      >
                        {formatValue(value)}
                      </div>
                    </div>
                  ))}
                </Card>
              )}

              {Object.keys(diff.modified || {}).length > 0 && (
                <Card size="small" title={<Tag color="orange">Modified Fields</Tag>}>
                  {Object.entries(diff.modified).map(([key, change]) => (
                    <div key={key} style={{ marginBottom: '16px' }}>
                      <Text strong style={{ color: '#fa8c16' }}>~ {key}</Text>
                      <Row gutter={16} style={{ marginTop: '8px' }}>
                        <Col xs={24} lg={12}>
                          <div
                            style={{
                              padding: '8px',
                              backgroundColor: '#fff7e6',
                              border: '1px solid #ffd591',
                              borderRadius: '4px',
                            }}
                          >
                            <Text type="secondary" strong>
                              {version1.label || `Version ${version1.version}`}:
                            </Text>
                            <div style={{ marginTop: '4px' }}>{formatValue(change.old)}</div>
                          </div>
                        </Col>
                        <Col xs={24} lg={12}>
                          <div
                            style={{
                              padding: '8px',
                              backgroundColor: '#f6ffed',
                              border: '1px solid #b7eb8f',
                              borderRadius: '4px',
                            }}
                          >
                            <Text type="secondary" strong>
                              {version2.label || `Version ${version2.version}`}:
                            </Text>
                            <div style={{ marginTop: '4px' }}>{formatValue(change.new)}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </Card>
              )}

              {Object.keys(diff.removed || {}).length > 0 && (
                <Card size="small" title={<Tag color="red">Removed Fields</Tag>}>
                  {Object.entries(diff.removed).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '12px' }}>
                      <Text strong style={{ color: '#ff4d4f' }}>- {key}</Text>
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '8px',
                          backgroundColor: '#fff1f0',
                          border: '1px solid #ffccc7',
                          borderRadius: '4px',
                        }}
                      >
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
