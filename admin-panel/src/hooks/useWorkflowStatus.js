import { useMemo } from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * useWorkflowStatus Hook
 * Checks edit permissions based on workflow status, user permissions, and role hierarchy
 * 
 * @param {Object} options
 * @param {string} options.status - Current workflow status
 * @param {string} options.resourceType - Resource type ('page' or 'section')
 * @param {string} options.createdBy - User ID who created the resource (optional)
 * @returns {Object} - { canEdit, canDelete, canCreateSection, canModifyTree, reason }
 */
const useWorkflowStatus = ({ status, resourceType = 'page', createdBy = null }) => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();

  // Get user role slug from user object (handles both object and string formats)
  const getUserRoleSlug = useMemo(() => {
    if (!user?.role) return null;
    if (typeof user.role === 'object' && user.role.slug) {
      return user.role.slug.toLowerCase();
    }
    if (typeof user.role === 'string') {
      return user.role.toLowerCase();
    }
    return null;
  }, [user]);

  // Check if user is admin or super admin (bypass all restrictions)
  const isAdmin = useMemo(() => {
    if (!getUserRoleSlug) return false;
    return getUserRoleSlug === 'admin' || getUserRoleSlug === 'super_admin';
  }, [getUserRoleSlug]);

  // Check if user is the creator (normalize IDs so ObjectId and string match)
  const isCreator = useMemo(() => {
    if (!user || !createdBy) return false;
    const userId = user._id ?? user.id;
    if (!userId) return false;
    return String(userId) === String(createdBy);
  }, [user, createdBy]);

  // Get resource name for permission checks (plural form used by hasPermission)
  const resourceName = useMemo(() => {
    const map = {
      page: 'pages',
      section: 'sections',
      project: 'projects',
      'building-type': 'building-types',
      industry: 'industries',
      country: 'countries',
      region: 'regions',
      area: 'areas',
      branch: 'branches',
      customer: 'customers',
      certification: 'certifications',
      'company-update': 'company-updates',
      'company-update-category': 'company-update-categories',
      brochure: 'brochures',
      'header-configuration': 'header-configurations',
      'footer-configuration': 'footer-configurations',
      'website-appearance': 'website-appearance',
      'smtp-settings': 'smtp-settings',
      'google-recaptcha': 'google-recaptcha',
      'google-maps': 'google-maps',
    };
    return map[resourceType] ?? (resourceType ? `${resourceType}s` : 'pages');
  }, [resourceType]);

  // Check if user can edit content
  const canEdit = useMemo(() => {
    // Admin/Super Admin bypass all checks
    if (isAdmin) {
      return { canEdit: true, reason: null };
    }

    const editableStatuses = ['draft', 'changes_requested'];
    const restrictedStatuses = ['in_review', 'pending_approval', 'pending_publish'];

    // If status allows editing (draft or changes_requested)
    if (editableStatuses.includes(status)) {
      const hasEditPermission = hasPermission(resourceName, 'update');
      if (hasEditPermission || isCreator) {
        return { canEdit: true, reason: null };
      }
      return { 
        canEdit: false, 
        reason: `You do not have permission to edit ${resourceType}s, or you are not the creator of this content.` 
      };
    }

    // If status is restricted, check permission + role hierarchy
    if (restrictedStatuses.includes(status)) {
      const hasEditPermission = hasPermission(resourceName, 'update');
      
      if (hasEditPermission) {
        const roleSlug = getUserRoleSlug;
        
        // Check role hierarchy for status (case-insensitive)
        if (status === 'in_review' || status === 'pending_approval') {
          const allowedRoles = ['reviewer', 'approver', 'admin', 'super_admin'];
          if (roleSlug && allowedRoles.includes(roleSlug)) {
            return { canEdit: true, reason: null };
          }
          return { 
            canEdit: false, 
            reason: `Only Reviewer or higher roles can edit content in ${status.replace('_', ' ')} status.` 
          };
        }
        
        if (status === 'pending_publish') {
          const allowedRoles = ['approver', 'admin', 'super_admin'];
          if (roleSlug && allowedRoles.includes(roleSlug)) {
            return { canEdit: true, reason: null };
          }
          return { 
            canEdit: false, 
            reason: `Only Approver or higher roles can edit content in pending publish status.` 
          };
        }
      }
      
      return { 
        canEdit: false, 
        reason: `You do not have permission to edit ${resourceType}s in ${status.replace('_', ' ')} status.` 
      };
    }

    // Published and archived - only with permission
    if (status === 'published' || status === 'archived') {
      const hasEditPermission = hasPermission(resourceName, 'update');
      if (hasEditPermission) {
        return { canEdit: true, reason: null };
      }
      return { 
        canEdit: false, 
        reason: `You do not have permission to edit ${resourceType}s.` 
      };
    }

    return { canEdit: false, reason: `Unknown status: ${status}` };
  }, [status, resourceType, resourceName, hasPermission, isCreator, isAdmin, getUserRoleSlug]);

  // Check if user can delete content
  const canDelete = useMemo(() => {
    // Admin/Super Admin bypass all checks
    if (isAdmin) {
      return { canDelete: true, reason: null };
    }

    const hasDeletePermission = hasPermission(resourceName, 'delete');
    
    // If has permission, can delete
    if (hasDeletePermission) {
      return { canDelete: true, reason: null };
    }

    // Creator can delete in draft, changes_requested, published, archived
    if (isCreator && ['draft', 'changes_requested', 'published', 'archived'].includes(status)) {
      return { canDelete: true, reason: null };
    }

    return { 
      canDelete: false, 
      reason: `You do not have permission to delete ${resourceType}s, or the content is in a restricted workflow state.` 
    };
  }, [status, resourceType, resourceName, hasPermission, isCreator, isAdmin]);

  // Check if user can create sections
  const canCreateSection = useMemo(() => {
    // Admin/Super Admin bypass all checks
    if (isAdmin) {
      return { canCreateSection: true, reason: null };
    }

    const editableStatuses = ['draft', 'changes_requested'];
    const restrictedStatuses = ['in_review', 'pending_approval', 'pending_publish'];

    const hasCreatePermission = hasPermission('sections', 'create');
    
    // If status allows, check permission
    if (editableStatuses.includes(status)) {
      if (hasCreatePermission || isCreator) {
        return { canCreateSection: true, reason: null };
      }
      return { 
        canCreateSection: false, 
        reason: `You do not have permission to create sections, or you are not the creator of this ${resourceType}.` 
      };
    }

    // If restricted, need permission + appropriate role
    if (restrictedStatuses.includes(status)) {
      if (hasCreatePermission) {
        const roleSlug = getUserRoleSlug;
        const allowedRoles = ['reviewer', 'approver', 'admin', 'super_admin'];
        if (roleSlug && allowedRoles.includes(roleSlug)) {
          return { canCreateSection: true, reason: null };
        }
        return { 
          canCreateSection: false, 
          reason: `Only Reviewer or higher roles can create sections when the ${resourceType} is in ${status.replace('_', ' ')} status.` 
        };
      }
      return { 
        canCreateSection: false, 
        reason: `You do not have permission to create sections when the ${resourceType} is in ${status.replace('_', ' ')} status.` 
      };
    }

    return { 
      canCreateSection: false, 
      reason: `Cannot create sections when ${resourceType} is in ${status.replace('_', ' ')} status.` 
    };
  }, [status, resourceType, hasPermission, isCreator, isAdmin, getUserRoleSlug]);

  // Check if user can modify tree (move/reorder)
  const canModifyTree = useMemo(() => {
    // Admin/Super Admin bypass all checks
    if (isAdmin) {
      return { canModifyTree: true, reason: null };
    }

    const hasUpdatePermission = hasPermission(resourceName, 'update');
    
    // Can only modify tree in draft status (unless has permission + appropriate role)
    if (status === 'draft') {
      if (hasUpdatePermission || isCreator) {
        return { canModifyTree: true, reason: null };
      }
      return { 
        canModifyTree: false, 
        reason: `You do not have permission to modify the tree structure, or you are not the creator of this ${resourceType}.` 
      };
    }

    // If has permission, check role hierarchy for restricted statuses
    if (hasUpdatePermission && ['in_review', 'pending_approval', 'pending_publish'].includes(status)) {
      const roleSlug = getUserRoleSlug;
      const allowedRoles = ['reviewer', 'approver', 'admin', 'super_admin'];
      if (roleSlug && allowedRoles.includes(roleSlug)) {
        return { canModifyTree: true, reason: null };
      }
      return { 
        canModifyTree: false, 
        reason: `Only Reviewer or higher roles can modify the tree structure when the ${resourceType} is in ${status.replace('_', ' ')} status.` 
      };
    }

    return { 
      canModifyTree: false, 
      reason: `Cannot modify tree structure when ${resourceType} is in ${status.replace('_', ' ')} status.` 
    };
  }, [status, resourceType, resourceName, hasPermission, isCreator, isAdmin, getUserRoleSlug]);

  return {
    canEdit,
    canDelete,
    canCreateSection,
    canModifyTree,
    isAdmin,
    isCreator,
  };
};

export default useWorkflowStatus;

