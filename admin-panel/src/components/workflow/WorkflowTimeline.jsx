import { useState, useEffect } from 'react';
import { Timeline, Tag, Card, Button, Space, Tooltip, Empty, Spin } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  EyeOutlined,
  RocketOutlined,
  EditOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import * as versionService from '../../services/versionService';
import WorkflowStatusBadge from './WorkflowStatusBadge';
import VersionViewModal from './VersionViewModal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Workflow Timeline Component
 * Displays workflow history and version timeline
 * 
 * @param {Object} props
 * @param {string} props.resource - Resource type ('page' or 'section')
 * @param {string} props.resourceId - Resource ID
 * @param {Array} props.versions - Version history (optional, will fetch if not provided)
 * @param {Function} props.onVersionSelect - Callback when version is selected
 * @param {Function} props.onRestoreVersion - Callback to restore a version
 */
const WorkflowTimeline = ({
  resource,
  resourceId,
  versions = null,
  onVersionSelect,
  onRestoreVersion,
}) => {
  const [timelineVersions, setTimelineVersions] = useState(versions || []);
  const [loading, setLoading] = useState(!versions);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    if (!versions && resource && resourceId) {
      fetchVersions();
    } else if (versions) {
      setTimelineVersions(versions);
    }
  }, [resource, resourceId, versions]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await versionService.getVersionHistory(resource, resourceId);
      if (response.success) {
        setTimelineVersions(response.data.versions || []);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status, changeType) => {
    if (changeType === 'created') {
      return <FileTextOutlined style={{ color: '#1890ff' }} />;
    }

    switch (status) {
      case 'published':
        return <RocketOutlined style={{ color: '#10b981' }} />;
      case 'pending_publish':
        return <CheckCircleOutlined style={{ color: '#06b6d4' }} />;
      case 'pending_approval':
        return <CheckCircleOutlined style={{ color: '#8b5cf6' }} />;
      case 'in_review':
        return <EyeOutlined style={{ color: '#1890ff' }} />;
      case 'changes_requested':
        return <CloseCircleOutlined style={{ color: '#f97316' }} />;
      case 'draft':
        return <EditOutlined style={{ color: '#6b7280' }} />;
      case 'archived':
        return <ClockCircleOutlined style={{ color: '#ef4444' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#6b7280' }} />;
    }
  };

  const getUserName = (user) => {
    if (!user) return 'System';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Unknown';
  };

  const getChangeTypeLabel = (changeType) => {
    const labels = {
      created: 'Created',
      updated: 'Updated',
      status_changed: 'Status Changed',
      deleted: 'Deleted',
    };
    return labels[changeType] || 'Modified';
  };

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      </Card>
    );
  }

  if (!timelineVersions || timelineVersions.length === 0) {
    return (
      <Card>
        <Empty
          description="No version history available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card title={<><HistoryOutlined /> Version History</>}>
      <Timeline
        mode="left"
        items={timelineVersions.map((version, index) => {
          const isLatest = index === 0;
          const isSelected = selectedVersion === version.version;

          return {
            dot: getStatusIcon(version.status, version.changeType),
            color: isLatest ? 'blue' : 'gray',
            children: (
              <div className={`p-3 rounded-lg border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} hover:border-gray-300 transition-colors`}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        Version {version.version}
                      </span>
                      {isLatest && (
                        <Tag color="blue" className="text-xs">Current</Tag>
                      )}
                      <WorkflowStatusBadge status={version.status} size="small" />
                      <Tag className="text-xs">
                        {getChangeTypeLabel(version.changeType)}
                      </Tag>
                    </div>

                    {version.changeSummary && (
                      <div className="mt-2 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                          <FileTextOutlined />
                          Change Summary:
                        </p>
                        <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
                          {version.changeSummary}
                        </p>
                      </div>
                    )}

                    {version.feedback && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                        <p className="text-xs font-semibold text-orange-800 mb-1">Feedback:</p>
                        <p className="text-sm text-orange-700">{version.feedback}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <Tooltip title={dayjs(version.createdAt).format('MMMM DD, YYYY [at] h:mm A')}>
                        <span>{dayjs(version.createdAt).fromNow()}</span>
                      </Tooltip>
                      {version.createdBy && (
                        <span className="flex items-center gap-1">
                          <UserOutlined />
                          {getUserName(version.createdBy)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Space direction="vertical" size="small">
                    <Button
                      size="small"
                      type={isSelected ? 'primary' : 'default'}
                      onClick={() => {
                        setSelectedVersion(version.version);
                        setViewingVersion(version);
                        setIsViewModalOpen(true);
                        if (onVersionSelect) {
                          onVersionSelect(version);
                        }
                      }}
                    >
                      View
                    </Button>
                    {onRestoreVersion && !isLatest && (
                      <Button
                        size="small"
                        onClick={() => onRestoreVersion(version.version)}
                      >
                        Restore
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
            ),
          };
        })}
      />

      <VersionViewModal
        open={isViewModalOpen}
        version={viewingVersion}
        resourceType={resource}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingVersion(null);
        }}
      />
    </Card>
  );
};

export default WorkflowTimeline;

