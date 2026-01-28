import { useState, useEffect, useMemo } from 'react';
import { Button, Space, Popconfirm, Tooltip } from 'antd';
import {
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  FileTextOutlined,
  RocketOutlined,
  UndoOutlined,
  InboxOutlined,
  ReloadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { usePermissions } from '../../contexts/PermissionContext';
import useWorkflowStatus from '../../hooks/useWorkflowStatus';
import * as workflowService from '../../services/workflowService';
import { toast } from 'react-toastify';
import FeedbackModal from './FeedbackModal';

/**
 * Workflow Actions Component
 * Displays available workflow action buttons based on current status and user permissions
 * 
 * @param {Object} props
 * @param {string} props.resource - Resource type ('page' or 'section')
 * @param {string} props.resourceId - Resource ID
 * @param {string} props.currentStatus - Current workflow status
 * @param {string} props.createdBy - User ID who created the resource (optional)
 * @param {Array} props.availableActions - Available actions from backend (optional, will fetch if not provided)
 * @param {Function} props.onActionComplete - Callback after action completes
 * @param {boolean} props.showLabels - Whether to show button labels (default: true)
 * @param {string} props.size - Button size ('small', 'middle', 'large')
 */
const WorkflowActions = ({
  resource,
  resourceId,
  currentStatus,
  createdBy = null,
  availableActions = null,
  onActionComplete,
  showLabels = true,
  size = 'middle',
}) => {
  const { hasPermission, userRole } = usePermissions();
  
  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: currentStatus || 'draft',
    resourceType: resource,
    createdBy,
  });
  const [actions, setActions] = useState(availableActions || []);
  const [loading, setLoading] = useState(false);
  const [fetchingActions, setFetchingActions] = useState(!availableActions);
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    action: null,
  });

  // Fetch available actions if not provided
  useEffect(() => {
    if (!availableActions && resource && resourceId && currentStatus) {
      fetchAvailableActions();
    } else if (availableActions) {
      setActions(availableActions);
    }
  }, [resource, resourceId, currentStatus, availableActions]);

  // Map status transitions to action names
  const mapStatusToAction = (currentStatus, targetStatus) => {
    const actionMap = {
      'draft_in_review': 'submit',
      'draft_archived': 'archive',
      'draft_published': 'publish',
      'in_review_pending_approval': 'review',
      'in_review_changes_requested': 'request-changes',
      'in_review_draft': 'revert', // Revert to draft (not submit)
      'changes_requested_in_review': 'submit',
      'changes_requested_draft': 'revert', // Revert to draft
      'pending_approval_pending_publish': 'approve',
      'pending_approval_changes_requested': 'reject',
      'pending_approval_in_review': 'revert', // Send back to review
      'pending_publish_published': 'publish',
      'pending_publish_changes_requested': 'request-changes',
      'published_draft': 'unpublish',
      'published_archived': 'archive',
      'archived_draft': 'restore',
    };
    return actionMap[`${currentStatus}_${targetStatus}`] || null;
  };

  const fetchAvailableActions = async () => {
    if (!resourceId) {
      setFetchingActions(false);
      setActions([]);
      return;
    }
    
    setFetchingActions(true);
    try {
      const response = await workflowService.getAvailableActions(resource, resourceId);
      if (response.success) {
        // Backend returns currentStatus and availableActions array
        // Use the status from backend response to ensure we have the latest status
        const backendStatus = response.data.currentStatus || currentStatus;
        const statusTransitions = response.data.availableActions || [];
        
        // Map transitions to action names using the backend status
        const mappedActions = statusTransitions
          .map(transition => mapStatusToAction(backendStatus, transition.status))
          .filter(action => action !== null); // Remove null mappings
        
        // Remove duplicates
        const uniqueActions = [...new Set(mappedActions)];
        setActions(uniqueActions);
      } else {
        setActions([]);
      }
    } catch (error) {
      console.error('Failed to fetch available actions:', error);
      setActions([]);
    } finally {
      setFetchingActions(false);
    }
  };

  const handleAction = async (action, data = {}) => {
    setLoading(true);
    try {
      let response;
      
      switch (action) {
        case 'submit':
          response = await workflowService.submitForReview(resource, resourceId, data);
          break;
        case 'review':
          response = await workflowService.markReviewed(resource, resourceId, data);
          break;
        case 'request-changes':
          response = await workflowService.requestChanges(resource, resourceId, data);
          break;
        case 'approve':
          response = await workflowService.approveContent(resource, resourceId, data);
          break;
        case 'reject':
          response = await workflowService.rejectContent(resource, resourceId, data);
          break;
        case 'publish':
          response = await workflowService.publishContent(resource, resourceId, data);
          break;
        case 'unpublish':
          response = await workflowService.unpublishContent(resource, resourceId, data);
          break;
        case 'archive':
          response = await workflowService.archiveContent(resource, resourceId, data);
          break;
        case 'restore':
          response = await workflowService.restoreContent(resource, resourceId, data);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      if (response.success) {
        toast.success(response.message || 'Action completed successfully');
        if (resource === 'page' && action === 'unpublish' && response.data?.pageWasInHeader) {
          toast.warning(
            'This page was in the header. Update Header Configuration to remove its link and keep the site in sync.',
            { autoClose: 8000 }
          );
        }
        if (onActionComplete) {
          onActionComplete(action, response);
        }
        // Refresh available actions after a short delay to ensure backend has updated
        if (!availableActions) {
          setTimeout(() => {
            fetchAvailableActions();
          }, 500);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} content`);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = (values) => {
    handleAction(feedbackModal.action, values);
    setFeedbackModal({ open: false, action: null });
  };

  const openFeedbackModal = (action) => {
    setFeedbackModal({ open: true, action });
  };

  // Action button configurations
  const actionConfigs = {
    submit: {
      label: 'Submit for Review',
      icon: <SendOutlined />,
      type: 'primary',
      color: '#1890ff',
      requiresFeedback: true, // Change summary is required for submit
    },
    review: {
      label: 'Mark as Reviewed',
      icon: <EyeOutlined />,
      type: 'default',
      color: '#1890ff',
      requiresFeedback: false,
    },
    'request-changes': {
      label: 'Request Changes',
      icon: <FileTextOutlined />,
      type: 'default',
      color: '#f97316',
      requiresFeedback: true,
    },
    approve: {
      label: 'Approve',
      icon: <CheckOutlined />,
      type: 'primary',
      color: '#10b981',
      requiresFeedback: false,
    },
    reject: {
      label: 'Reject',
      icon: <CloseOutlined />,
      type: 'default',
      danger: true,
      requiresFeedback: true,
    },
    publish: {
      label: 'Publish',
      icon: <RocketOutlined />,
      type: 'primary',
      color: '#10b981',
      requiresFeedback: false,
    },
    unpublish: {
      label: 'Unpublish',
      icon: <UndoOutlined />,
      type: 'default',
      color: '#6b7280',
      requiresFeedback: false,
    },
    archive: {
      label: 'Archive',
      icon: <InboxOutlined />,
      type: 'default',
      color: '#ef4444',
      requiresFeedback: false,
    },
    restore: {
      label: 'Restore',
      icon: <ReloadOutlined />,
      type: 'default',
      color: '#10b981',
      requiresFeedback: false,
    },
  };

  // Filter actions based on permissions and role hierarchy
  // IMPORTANT: Backend already checks permissions correctly via getNextPossibleStates
  // Frontend should trust backend response, but we can do basic role checks for UI consistency
  const filteredActions = useMemo(() => {
    if (!actions || actions.length === 0) return [];
    
    // Admin/Super Admin can perform all actions returned by backend
    if (workflowStatus.isAdmin) {
      return actions;
    }

    // For non-admin users, filter out restricted actions (archive and unpublish)
    // These actions should only be visible to Admin and Super Admin
    const restrictedActions = ['archive', 'unpublish'];
    return actions.filter(action => !restrictedActions.includes(action));
  }, [actions, workflowStatus]);

  // Early returns AFTER all hooks have been called
  if (fetchingActions) {
    return <Button size={size} loading>Loading actions...</Button>;
  }

  if (!filteredActions || filteredActions.length === 0) {
    return null;
  }

  // Every workflow action uses confirmation: Yes / No → then proceed (or open feedback modal)
  const renderConfirmButton = (action) => {
    const config = actionConfigs[action];
    if (!config) return null;

    const buttonProps = {
      size,
      icon: config.icon,
      loading: loading,
      disabled: loading,
    };
    if (config.type === 'primary') {
      buttonProps.type = 'primary';
      if (config.color) {
        buttonProps.style = { backgroundColor: config.color, borderColor: config.color };
      }
    } else if (config.danger) {
      buttonProps.danger = true;
    }

    const onConfirm = () => {
      if (config.requiresFeedback) {
        openFeedbackModal(action);
      } else {
        handleAction(action);
      }
    };

    return (
      <Popconfirm
        key={action}
        title={`${config.label}?`}
        description={`Are you sure you want to ${config.label.toLowerCase()} this content?`}
        onConfirm={onConfirm}
        okText="Yes"
        cancelText="No"
      >
        <Button {...buttonProps}>
          {showLabels && config.label}
        </Button>
      </Popconfirm>
    );
  };

  return (
    <>
      <Space size="small" style={{ flexWrap: 'nowrap' }}>
        {filteredActions.map((action) => renderConfirmButton(action))}
      </Space>

      <FeedbackModal
        open={feedbackModal.open}
        title={
          feedbackModal.action === 'reject'
            ? 'Reject Content'
            : feedbackModal.action === 'submit'
            ? 'Submit for Review'
            : 'Request Changes'
        }
        action={feedbackModal.action}
        onSubmit={handleFeedbackSubmit}
        onCancel={() => setFeedbackModal({ open: false, action: null })}
        loading={loading}
      />
    </>
  );
};

export default WorkflowActions;

