import React, { useMemo } from 'react';
import { Alert } from 'antd';
import { InfoCircleOutlined, LockOutlined } from '@ant-design/icons';
import { usePermissions } from '../../contexts/PermissionContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Workflow Status Guard Component
 * Disables forms/buttons and shows messages based on workflow status and user permissions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.status - Current workflow status
 * @param {string} props.resourceType - Resource type ('page' or 'section')
 * @param {string} props.resourceId - Resource ID (optional, for creator check)
 * @param {string} props.createdBy - User ID who created the resource (optional)
 * @param {string} props.action - Action to check ('edit', 'delete', 'createSection', 'modifyTree')
 * @param {boolean} props.showMessage - Whether to show alert message when disabled (default: true)
 * @param {string} props.messageType - Message type ('info', 'warning', 'error') (default: 'warning')
 * @param {string} props.customMessage - Custom message to display when disabled
 * @returns {React.ReactNode}
 */
const WorkflowStatusGuard = ({
  children,
  status,
  resourceType = 'page',
  resourceId = null,
  createdBy = null,
  action = 'edit',
  showMessage = true,
  messageType = 'warning',
  customMessage = null,
}) => {
  const { hasPermission, userRole } = usePermissions();
  const { user } = useAuth();

  // Check if user is admin or super admin (bypass all restrictions)
  const isAdmin = useMemo(() => {
    if (!userRole) return false;
    const roleSlug = userRole.slug || userRole;
    return roleSlug === 'admin' || roleSlug === 'super_admin';
  }, [userRole]);

  // Check if user is the creator
  const isCreator = useMemo(() => {
    if (!user || !createdBy) return false;
    return user._id === createdBy || user.id === createdBy;
  }, [user, createdBy]);

  // Determine if editing is allowed based on status and permissions
  const canPerformAction = useMemo(() => {
    // Admin/Super Admin bypass all restrictions
    if (isAdmin) {
      return true;
    }

    // Status-based restrictions
    const editableStatuses = ['draft', 'changes_requested'];
    const restrictedStatuses = ['in_review', 'pending_approval', 'pending_publish'];

    // For edit action
    if (action === 'edit') {
      // If status allows editing (draft or changes_requested)
      if (editableStatuses.includes(status)) {
        // Check if user has permission OR is the creator
        const hasEditPermission = hasPermission(resourceType === 'page' ? 'pages' : 'sections', 'update');
        return hasEditPermission || isCreator;
      }

      // If status is restricted, check permission + role hierarchy
      if (restrictedStatuses.includes(status)) {
        const hasEditPermission = hasPermission(resourceType === 'page' ? 'pages' : 'sections', 'update');
        
        // If user has permission, check role hierarchy (case-insensitive)
        if (hasEditPermission) {
          // Reviewer can edit in_review, pending_approval
          // Approver can edit pending_approval, pending_publish
          if (status === 'in_review' || status === 'pending_approval') {
            const roleSlug = (userRole?.slug || userRole || '').toLowerCase();
            const allowedRoles = ['reviewer', 'approver', 'admin', 'super_admin'];
            return allowedRoles.includes(roleSlug);
          }
          if (status === 'pending_publish') {
            const roleSlug = (userRole?.slug || userRole || '').toLowerCase();
            const allowedRoles = ['approver', 'admin', 'super_admin'];
            return allowedRoles.includes(roleSlug);
          }
        }
        
        return false;
      }

      // Published and archived - only with permission
      if (status === 'published' || status === 'archived') {
        return hasPermission(resourceType === 'page' ? 'pages' : 'sections', 'update');
      }
    }

    // For delete action
    if (action === 'delete') {
      const hasDeletePermission = hasPermission(resourceType === 'page' ? 'pages' : 'sections', 'delete');
      
      // If has permission, can delete
      if (hasDeletePermission) {
        return true;
      }

      // Creator can delete in draft, changes_requested, published, archived
      if (isCreator && ['draft', 'changes_requested', 'published', 'archived'].includes(status)) {
        return true;
      }

      return false;
    }

    // For createSection action
    if (action === 'createSection') {
      // Check parent page status (for sections)
      if (resourceType === 'section') {
        // This would need parent page status, but for now check permission
        const hasCreatePermission = hasPermission('sections', 'create');
        if (hasCreatePermission) {
          // If status allows, can create
          if (editableStatuses.includes(status)) {
            return true;
          }
          // If restricted, need appropriate role (case-insensitive)
          if (restrictedStatuses.includes(status)) {
            const roleSlug = (userRole?.slug || userRole || '').toLowerCase();
            const allowedRoles = ['reviewer', 'approver', 'admin', 'super_admin'];
            return allowedRoles.includes(roleSlug);
          }
        }
        // Creator can create in draft/changes_requested
        if (isCreator && editableStatuses.includes(status)) {
          return true;
        }
      }
      return false;
    }

    // For modifyTree action (move/reorder)
    if (action === 'modifyTree') {
      const hasUpdatePermission = hasPermission(resourceType === 'page' ? 'pages' : 'sections', 'update');
      
      // Can only modify tree in draft status (unless has permission + appropriate role)
      if (status === 'draft') {
        return hasUpdatePermission || isCreator;
      }

      // If has permission, check role hierarchy (case-insensitive)
      if (hasUpdatePermission && restrictedStatuses.includes(status)) {
        const roleSlug = (userRole?.slug || userRole || '').toLowerCase();
        const allowedRoles = ['reviewer', 'approver', 'admin', 'super_admin'];
        return allowedRoles.includes(roleSlug);
      }

      return false;
    }

    return false;
  }, [status, resourceType, action, hasPermission, isCreator, isAdmin, userRole]);

  // Generate message when action is disabled
  const getDisabledMessage = () => {
    if (customMessage) {
      return customMessage;
    }

    const statusLabels = {
      draft: 'Draft',
      in_review: 'In Review',
      pending_approval: 'Pending Approval',
      pending_publish: 'Pending Publish',
      published: 'Published',
      changes_requested: 'Changes Requested',
      archived: 'Archived',
    };

    const actionLabels = {
      edit: 'edit',
      delete: 'delete',
      createSection: 'create sections',
      modifyTree: 'modify the tree structure',
    };

    const statusLabel = statusLabels[status] || status;
    const actionLabel = actionLabels[action] || action;

    if (status === 'in_review' || status === 'pending_approval' || status === 'pending_publish') {
      return `You cannot ${actionLabel} this ${resourceType} while it is ${statusLabel.toLowerCase()}. Only users with appropriate permissions and role hierarchy can perform this action.`;
    }

    if (status === 'published') {
      return `You cannot ${actionLabel} published content. Please unpublish first or use workflow actions.`;
    }

    if (status === 'archived') {
      return `You cannot ${actionLabel} archived content. Please restore it first.`;
    }

    return `You do not have permission to ${actionLabel} this ${resourceType} in its current state (${statusLabel}).`;
  };

  // Render children with disabled state
  const renderChildren = () => {
    if (canPerformAction) {
      return children;
    }

    // Clone children and add disabled prop
    return (
      <div className="workflow-status-guard-disabled">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              disabled: true,
              className: `${child.props.className || ''} opacity-50 cursor-not-allowed`,
            });
          }
          return child;
        })}
      </div>
    );
  };

  return (
    <div className="workflow-status-guard">
      {!canPerformAction && showMessage && (
        <Alert
          message={getDisabledMessage()}
          type={messageType}
          icon={messageType === 'error' ? <LockOutlined /> : <InfoCircleOutlined />}
          showIcon
          className="mb-4"
        />
      )}
      {renderChildren()}
    </div>
  );
};

export default WorkflowStatusGuard;

