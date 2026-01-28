import { Tag } from 'antd';

/**
 * Workflow Status Badge Component
 * Displays workflow status with appropriate color and label
 * 
 * @param {Object} props
 * @param {string} props.status - Workflow status
 * @param {string} props.size - Badge size ('small', 'default', 'large')
 * @param {boolean} props.showIcon - Whether to show icon
 * @param {string} props.className - Additional CSS classes
 */
const WorkflowStatusBadge = ({ 
  status, 
  size = 'default',
  showIcon = false,
  className = '' 
}) => {
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

  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    default: 'px-3 py-1 text-sm',
    large: 'px-4 py-1.5 text-base',
  };

  return (
    <Tag 
      color={color}
      className={`${sizeClasses[size]} font-semibold rounded-full ${className}`}
    >
      {label}
    </Tag>
  );
};

export default WorkflowStatusBadge;

