import { Modal, Descriptions, Tag, Divider, Empty } from 'antd';
import { FileTextOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import WorkflowStatusBadge from './WorkflowStatusBadge';
import dayjs from 'dayjs';

/**
 * Version View Modal Component
 * Displays version content in a readable format
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is open
 * @param {Object} props.version - Version data object
 * @param {string} props.resourceType - Resource type ('page' or 'section')
 * @param {Function} props.onClose - Close handler
 */
const VersionViewModal = ({ open, version, resourceType = 'page', onClose }) => {
  if (!version || !version.data) {
    return (
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title="Version Details"
        width={800}
      >
        <Empty description="No version data available" />
      </Modal>
    );
  }

  const versionData = version.data;
  const isPage = resourceType === 'page';
  const isSection = resourceType === 'section';

  const getUserName = (user) => {
    if (!user) return 'System';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Unknown';
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div className="flex items-center gap-2">
          <FileTextOutlined />
          <span>Version {version.version} Details</span>
        </div>
      }
      width={900}
    >
      <div className="space-y-4">
        {/* Version Metadata */}
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Version Number">
            <Tag color="blue">{version.version}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <WorkflowStatusBadge status={version.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Change Type">
            <Tag>{version.changeType || 'updated'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {dayjs(version.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
          </Descriptions.Item>
          {version.createdBy && (
            <Descriptions.Item label="Created By" span={2}>
              <div className="flex items-center gap-2">
                <UserOutlined />
                {getUserName(version.createdBy)}
              </div>
            </Descriptions.Item>
          )}
          {version.changeSummary && (
            <Descriptions.Item label="Change Summary" span={2}>
              {version.changeSummary}
            </Descriptions.Item>
          )}
          {version.feedback && (
            <Descriptions.Item label="Feedback" span={2}>
              <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                {version.feedback}
              </div>
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider>Content Data</Divider>

        {/* Page Content */}
        {isPage && (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Title">
                <span className="font-semibold">{versionData.title || '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Slug">
                <code className="bg-gray-100 px-2 py-1 rounded">{versionData.slug || '—'}</code>
              </Descriptions.Item>
              <Descriptions.Item label="Path">
                <code className="bg-gray-100 px-2 py-1 rounded">{versionData.path || '—'}</code>
              </Descriptions.Item>
              <Descriptions.Item label="Parent Page">
                {versionData.parentId ? (
                  <span>{versionData.parentId}</span>
                ) : (
                  <Tag>Root Level</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Show in Menu">
                <Tag color={versionData.showInMenu ? 'green' : 'default'}>
                  {versionData.showInMenu ? 'Yes' : 'No'}
                </Tag>
              </Descriptions.Item>
              {versionData.metaTitle && (
                <Descriptions.Item label="Meta Title">
                  {versionData.metaTitle}
                </Descriptions.Item>
              )}
              {versionData.metaDescription && (
                <Descriptions.Item label="Meta Description">
                  {versionData.metaDescription}
                </Descriptions.Item>
              )}
              {versionData.metaKeywords && (
                <Descriptions.Item label="Meta Keywords">
                  {versionData.metaKeywords}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}

        {/* Section Content */}
        {isSection && (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Section Type">
                <Tag color="blue">{versionData.sectionTypeSlug || '—'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Order">
                {versionData.order ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Visibility">
                <Tag color={versionData.isVisible ? 'green' : 'default'}>
                  {versionData.isVisible ? 'Visible' : 'Hidden'}
                </Tag>
              </Descriptions.Item>
              {versionData.cssClasses && (
                <Descriptions.Item label="CSS Classes">
                  <code className="bg-gray-100 px-2 py-1 rounded">{versionData.cssClasses}</code>
                </Descriptions.Item>
              )}
            </Descriptions>

            {versionData.content && Object.keys(versionData.content).length > 0 && (
              <>
                <Divider>Section Content</Divider>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Descriptions bordered size="small" column={1}>
                    {Object.entries(versionData.content).map(([key, value]) => (
                      <Descriptions.Item key={key} label={key}>
                        {typeof value === 'object' ? (
                          <pre className="bg-white p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          <span>{String(value)}</span>
                        )}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VersionViewModal;

